import json
import logging
from datetime import date
from base_worker import BaseWorker
from services.redis_client import get_redis
from db.queries import (
    get_application,
    get_job,
    get_job_analysis,
    get_effective_scoring_weights,
    update_application_score,
    update_application_stage,
    get_applications_in_stages,
)
from services.openai_client import chat

logger = logging.getLogger(__name__)

SCOREABLE_STAGES = [
    "screening",
    "interview",
    "specialist_interview",
    "review",
    "hm_approved",
    "offer_sent",
    "offer_accepted",
]

# When a single-app score message arrives but the job's structured analysis
# isn't ready yet, the worker re-publishes the analyze + score messages and
# bumps `retries`. After this many attempts we give up and score without the
# digest rather than loop forever.
MAX_ANALYSIS_RETRIES = 3

PRESENT_TOKENS = {"present", "current", "now", "ongoing", "today", ""}


def _ym_int(year: int, month: int) -> int:
    """Encode a year-month as a single ordinal integer (months since year 0)."""
    return year * 12 + month


def _parse_year_month(value, today: date) -> int | None:
    """Parse 'YYYY-MM', 'YYYY', or a 'present'-like token into a year-month ordinal."""
    if value is None:
        return None
    s = str(value).strip().lower()
    if s in PRESENT_TOKENS:
        return _ym_int(today.year, today.month)
    parts = s.split("-")
    try:
        year = int(parts[0])
        month = int(parts[1]) if len(parts) >= 2 else 1
        month = max(1, min(12, month))
        return _ym_int(year, month)
    except (ValueError, IndexError):
        return None


def summarize_experience(experiences: list, today: date | None = None) -> dict:
    """
    Build authoritative experience facts the LLM should not re-derive.
    Months are computed exclusive (end - start), so 2024-07 → 2026-05 = 22 months.
    Overlapping intervals are merged so total months never double-count.
    """
    today = today or date.today()
    intervals: list[tuple[int, int]] = []
    roles: list[dict] = []

    for e in experiences or []:
        start = _parse_year_month(e.get("start"), today)
        end = _parse_year_month(e.get("end"), today)
        if start is None or end is None or end < start:
            continue
        months = end - start
        intervals.append((start, end))
        roles.append({
            "title": (e.get("title") or "").strip(),
            "company": (e.get("company") or "").strip(),
            "start": (e.get("start") or "").strip(),
            "end": (e.get("end") or "").strip(),
            "months": months,
        })

    intervals.sort()
    merged: list[list[int]] = []
    for s, t in intervals:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], t)
        else:
            merged.append([s, t])

    total = sum(t - s for s, t in merged)
    years, months = divmod(total, 12)
    return {
        "total_months": total,
        "total_label": f"{years} year{'s' if years != 1 else ''}, {months} month{'s' if months != 1 else ''}",
        "roles": roles,
    }


class ScorerWorker(BaseWorker):
    stream = "hira:jobs:score"
    consumer = "scorer-1"

    def handle(self, payload: dict) -> None:
        if payload.get("bulk"):
            self._score_bulk(payload["job_id"], payload.get("org_id"))
        elif "application_id" in payload:
            self._score_single(
                payload["application_id"],
                payload["job_id"],
                payload.get("org_id"),
                int(payload.get("retries", 0) or 0),
            )

    def _score_single(self, application_id: str, job_id: str, org_id: str | None, retries: int) -> None:
        app = get_application(application_id)
        if not app:
            logger.warning(f"application {application_id} not found")
            return

        analysis = get_job_analysis(job_id)
        if analysis is None and retries < MAX_ANALYSIS_RETRIES:
            logger.warning(
                f"no job_analysis for job {job_id}; requeuing score (retry {retries + 1}/{MAX_ANALYSIS_RETRIES})"
            )
            self._request_analysis_and_requeue(application_id, job_id, org_id or app.get("orgId"), retries + 1)
            return
        if analysis is None:
            logger.error(
                f"job_analysis still missing for job {job_id} after {retries} retries; scoring without it"
            )

        score, breakdown = self._calculate_score(app, job_id, analysis)
        update_application_score(application_id, score, breakdown)

        if app["currentStage"] == "ai_evaluation":
            update_application_stage(
                application_id,
                "screening",
                moved_by=None,
                note="AI evaluation complete",
            )

    def _score_bulk(self, job_id: str, org_id: str | None) -> None:
        analysis = get_job_analysis(job_id)
        if analysis is None:
            logger.warning(
                f"no job_analysis for job {job_id} during bulk rescore; triggering analyze and skipping"
            )
            self._publish_analyze(job_id, org_id)
            return
        apps = get_applications_in_stages(job_id, SCOREABLE_STAGES)
        for app in apps:
            try:
                score, breakdown = self._calculate_score(app, job_id, analysis)
                update_application_score(app["id"], score, breakdown)
            except Exception:
                logger.exception(f"failed to score application {app['id']}")

    def _request_analysis_and_requeue(self, application_id: str, job_id: str, org_id: str | None, retries: int) -> None:
        r = get_redis()
        self._publish_analyze(job_id, org_id)
        r.xadd(
            "hira:jobs:score",
            {
                "application_id": json.dumps(str(application_id)),
                "job_id": json.dumps(str(job_id)),
                "org_id": json.dumps(str(org_id) if org_id else ""),
                "retries": json.dumps(retries),
            },
        )

    def _publish_analyze(self, job_id: str, org_id: str | None) -> None:
        r = get_redis()
        r.xadd(
            "hira:jobs:analyze",
            {
                "job_id": json.dumps(str(job_id)),
                "org_id": json.dumps(str(org_id) if org_id else ""),
            },
        )

    def _calculate_score(self, app: dict, job_id: str, analysis: dict | None) -> tuple[int, dict]:
        job = get_job(job_id)
        weights = get_effective_scoring_weights(job_id)
        if not job:
            raise ValueError(f"job {job_id} not found while scoring")

        instructions = job.get("scoring_instructions") or []
        instr_text = (
            "\n".join(f'- "{i}"' for i in instructions) if instructions else "None"
        )

        today = date.today()
        exp_summary = summarize_experience(app.get("parsed_experience") or [], today=today)

        system_prompt = (
            "You are an expert HR evaluator. Score this candidate by breaking the evaluation "
            "into four weighted dimensions plus optional bonus/penalty adjustments from "
            "recruiter instructions. You do NOT compute the final weighted sum — the worker "
            "does that deterministically from the per-component scores and bonuses you emit.\n\n"
            f"Weights (used by the worker to compute the final score):\n"
            f"- education:      {weights['education'] * 100:.0f}%\n"
            f"- skills:         {weights['skills']    * 100:.0f}%\n"
            f"- experience:     {weights['experience']* 100:.0f}%\n"
            f"- certifications: {weights['certs']     * 100:.0f}%\n\n"
            f"Recruiter scoring instructions (each may produce a bonus or penalty if it "
            f"applies — quote the instruction verbatim in the bonus rule field):\n{instr_text}\n\n"
            "Rules for component scores:\n"
            "1. Treat the Structured job criteria below as the AUTHORITATIVE source of role "
            "requirements. The job TITLE alone is NOT a requirement — do not infer "
            "seniority/years/skills from the title. For example, do NOT assume a 'Senior' "
            "title implies any specific year count; use `experience_years_min` from the "
            "structured criteria instead.\n"
            "2. For EACH of the four dimensions emit a raw 0-100 integer, a `reasoning` "
            "string (2-3 sentence neutral overview), and a `gaps` array. Use only what the "
            "profile, the structured criteria, and the Computed facts support — do not "
            "invent skills, employers, certifications, durations, or dates.\n"
            "3. The `gaps` array MUST list every concrete reason raw is below 100, each as "
            "one short phrase the recruiter will read in red text:\n"
            "   - Missing required skill X (name it as the JD names it).\n"
            "   - Only X years, Y months of experience vs N years required.\n"
            "   - No certification in X / lower degree level than the role calls for / etc.\n"
            "   If raw == 100, `gaps` MUST be []. If raw < 100 and you cannot identify a "
            "concrete gap from the structured criteria and profile, raise raw to 100. "
            "Generic positive prose hiding an unexplained gap is FORBIDDEN.\n"
            "4. For the skills dimension, apply the SKILL INFERENCE RULE below before "
            "deciding whether any item from `required_skills` is missing. After applying "
            "it, only items that remain genuinely absent count as gaps (one item per gap). "
            "Items from `preferred_skills` that are missing may be mentioned but should "
            "weigh less than required-skill gaps.\n\n"
            "   SKILL INFERENCE RULE — a required skill X is DEMONSTRATED if any of the "
            "following hold (do not require a literal string match):\n"
            "   (a) The candidate's profile lists X or a common alias/abbreviation of X.\n"
            "   (b) The candidate lists a framework, library, runtime, or tool that is "
            "built on X or cannot be used without X. Examples (illustrative, not "
            "exhaustive — generalize the principle to any stack):\n"
            "       - React / Angular / Vue / Svelte / Next.js → imply HTML, CSS, JavaScript.\n"
            "       - Express / NestJS → imply Node.js and JavaScript.\n"
            "       - .NET / ASP.NET → imply C#.\n"
            "       - Django / Flask / FastAPI / Pandas / PyTorch → imply Python.\n"
            "       - Spring / Spring Boot → imply Java.\n"
            "       - Rails → implies Ruby.\n"
            "       - Laravel / Symfony → imply PHP.\n"
            "       - React Native → implies React and JavaScript.\n"
            "   (c) The candidate lists a strict superset or modern variant of X "
            "(e.g. TypeScript implies JavaScript; C++ implies C in most contexts; "
            "PostgreSQL / MySQL imply SQL).\n"
            "   (d) Specific-version requirements are equivalent to the general skill "
            "UNLESS the JD explicitly demands a feature only available in that version. "
            "For modern roles (within roughly the last 8 years): HTML5 = HTML, "
            "CSS3 = CSS, ES6+ JavaScript = JavaScript.\n"
            "   (e) The candidate's experience descriptions show work that is impossible "
            "without X (e.g. 'built a Next.js application' demonstrates HTML/CSS/JS even "
            "if not separately listed).\n"
            "   Only flag X as a missing required skill when NONE of (a)–(e) apply.\n"
            "5. For the education dimension, score on TWO axes:\n"
            "   - LEVEL — does the candidate's highest degree meet what the role calls for "
            "(use `education_level` from the structured criteria, or a typical level for "
            "the role's seniority if the criteria are silent)?\n"
            "   - FIELD RELEVANCE — how closely is the candidate's field of study aligned "
            "with the role? Use a CONCENTRIC-DOMAIN view:\n"
            "     * Directly relevant (e.g. CS/SWE for a software role, Marketing for a "
            "marketing role): full marks possible, raw close to 100.\n"
            "     * Adjacent within the role's broader domain (e.g. Math, Physics, EE, "
            "Information Systems for a software role): moderate credit.\n"
            "     * WHOLLY OUTSIDE the role's broader domain (e.g. arts, humanities, "
            "sports, culinary for a software/engineering role): minimal credit, "
            "typically raw 10-25 — completion of any degree signals discipline, but the "
            "educational content does NOT transfer to this role. Do NOT award 50% by "
            "default for an unrelated degree; that band is for adjacent fields, not "
            "outside-the-domain ones.\n"
            "   When raw < 100, the gap MUST state the concrete cause — either a level "
            "mismatch (e.g. 'Bachelor's, role typically expects a Master's') or a field "
            "mismatch (e.g. 'Bachelor's in Sports Science is not closely related to "
            "frontend engineering'). A recruiter directive may push raw below this "
            "default further — see the directive rule under 'Recruiter scoring "
            "instructions' below.\n"
            "6. For the certifications dimension, the score must reflect what the "
            "candidate ACTUALLY brings — like every other dimension. The recruiter "
            "assigned weight to this dimension so it can discriminate; do NOT prop it "
            "up with a generous baseline. Use the same concentric-domain view as "
            "education:\n"
            "   - Role-relevant certs (e.g. AWS/Cloud for a cloud role, React Developer "
            "cert for a frontend role): raw 80-100.\n"
            "   - Certs ADJACENT to the role's broader domain (e.g. a Cloud Practitioner "
            "cert for a frontend role — not the role itself, but within the broader "
            "software domain): raw 50-70.\n"
            "   - NO certifications at all: raw MUST be exactly 0. Not 5, not 10, "
            "not 20 — zero. The candidate has not invested in any credentials, so "
            "the cert dimension contributes nothing. Add a gap entry stating 'No "
            "certifications'.\n"
            "   - Only certs WHOLLY OUTSIDE the role's broader domain (e.g. "
            "acupuncture, football coaching, culinary arts, sports therapy for a "
            "software role): raw MUST be exactly 0 — they are treated as identical "
            "to no certs. Do NOT award ANY partial credit — not for 'showing "
            "professional development', not for 'commitment', not for 'discipline', "
            "not for 'pursuing certifications in general'. Do NOT compromise on 10 "
            "or 20 as a middle ground. Zero means zero. Add a gap entry stating "
            "'No relevant certifications for this role'.\n"
            "   - When the JD/structured criteria DO name required certifications, a "
            "missing named cert is a real gap — raw 0-15 and list it under `gaps`.\n"
            "   - Recruiter directives override this default (see directive rule "
            "below). For example, 'certs are optional, don't penalize' would push the "
            "no-certs case higher; 'require AWS certification' would push it lower.\n"
            "7. For the experience dimension, use the authoritative duration strings from "
            "Computed facts as-is. Do NOT recompute durations from raw dates and do NOT "
            "truncate the label (use the full `candidate_total_experience` string such as "
            "'2 years, 5 months' — do not drop the months portion). Score using a GRADIENT, "
            "not a threshold:\n"
            "   - When the candidate meets or exceeds `required_experience_months`: raw "
            "90–100, depending on role relevance, progression, and notable achievements.\n"
            "   - When the candidate is below the requirement: anchor raw to "
            "round(candidate_total_experience_months / required_experience_months * 100), "
            "then adjust ±15 for role relevance, progression, and achievements. So a "
            "candidate with 2 years 5 months against 3 years required anchors near 80, not "
            "near 0.\n"
            "   - When `required_experience_months` is null (no minimum stated), score "
            "purely on relevance and depth — typically 70–100 for any relevant role.\n"
            "   - NEVER award 0 unless the candidate has effectively no relevant "
            "professional experience.\n"
            "8. WRITE FOR HUMANS. Reasoning and gaps are shown to a recruiter. Never use "
            "schema field names, variable names, or JSON keys in user-facing strings (no "
            "`experience_years_min`, `required_skills`, `total_label`, etc.). Use the "
            "human labels from Computed facts and the structured criteria instead — "
            "e.g. write 'Only 2 years, 5 months of experience vs 3 years required' "
            "(NOT 'Only 2 years vs experience_years_min'). Quote durations exactly as "
            "they appear in `candidate_total_experience` and `required_experience_label`.\n\n"
            "Rules for recruiter scoring instructions:\n"
            "Each entry in the recruiter instructions is ONE of two kinds:\n"
            "  (A) A POINT BONUS/PENALTY — e.g. 'Add 10 points to candidates with X', "
            "'Subtract 5 if Y'. Handle these via the `bonuses` array (see below).\n"
            "  (B) A DIRECTIVE that modifies how a component is scored — e.g. \"don't "
            "count degrees not in IT/Engineering\", 'Require AWS certification', "
            "'Ignore experience older than 10 years', 'Treat React as a hard "
            "requirement'. For these, you MUST apply the directive DURING component "
            "scoring — the affected component's `raw` reflects the directive, and the "
            "concrete reason is added to that component's `gaps`. Do NOT also emit a "
            "bonus entry for a directive (the component already accounts for it); "
            "double-counting via both component AND bonus is forbidden.\n"
            "Classify each instruction by intent (does it say 'add/subtract X points' or "
            "does it tell you HOW to evaluate a dimension?). When a directive applies, "
            "the affected component's raw should drop substantially below its default "
            "judgment band — a 'don't count' directive should drive the relevant raw "
            "toward 0–10, not just 'reduce moderately'.\n\n"
            "Rules for bonuses (type A only):\n"
            "- Bonuses are evaluated INDEPENDENTLY of component scores. If a rule says "
            '"add X points to candidates with Y", you MUST award it whenever Y is '
            "satisfied, even if the candidate falls short on experience, skills, or any "
            "other dimension. Skip a bonus ONLY when (a) its condition is not satisfied "
            "by the evidence, or (b) the rule text itself makes the bonus conditional on "
            "other criteria (e.g. 'add X points to candidates with 5+ years AND "
            "certification Y').\n"
            "- INTERPRET CONDITIONS LIBERALLY. A condition is satisfied whenever there is "
            "reasonable evidence ANYWHERE in the candidate's profile — role descriptions, "
            "company names, education, certs, skills, or form answers. Do NOT require "
            "exact keyword matches in titles. Semantic equivalents count:\n"
            "   - A candidate who built or maintained tools/products FOR domain X has "
            "experience in domain X. ('Internal tools for training management' satisfies "
            "'experience in the training domain'. 'Healthcare claims processing software' "
            "satisfies 'healthcare-domain experience'. 'Fintech payments platform' "
            "satisfies 'fintech experience'.)\n"
            "   - A candidate employed by an institution focused on X has exposure to X. "
            "(Employer named 'X Academy', 'X University', 'X Training Center', 'X "
            "Hospital', 'X Bank' → domain X experience.)\n"
            "   - Specific evidence in role descriptions counts even when the job title is "
            "generic (e.g. 'Software Engineer' working on educational content tools = "
            "education-domain experience).\n"
            "- WHEN IN DOUBT, AWARD THE BONUS. Recruiters write these rules to surface "
            "candidates with these traits; a missed bonus on a real match is worse than a "
            "generously awarded one. If you find a plausible match but it's partial or "
            "indirect, still emit the bonus and explain the partial nature in `reasoning` "
            "(the recruiter sees this and can judge).\n"
            "- For each rule that applies, emit one bonus entry: quote the instruction "
            "verbatim in `rule`, set `points` to a signed integer (positive bonus or "
            "negative penalty), explain in `reasoning` — cite every concrete piece of "
            "evidence (specific roles, descriptions, employers, activities) that "
            "triggered the bonus — and set `confidence` to one of:\n"
            '   - "high" — direct, unambiguous evidence. The candidate explicitly lists or '
            "describes exactly what the rule asks for (e.g. rule asks for fintech "
            "experience, candidate's role description literally says 'fintech payments "
            'platform at XYZ Bank").\n'
            '   - "partial" — indirect or inferred evidence. The match relies on '
            "interpretation, semantic equivalence, or a single supporting phrase rather "
            "than a clear statement (e.g. rule asks for training-domain experience, "
            "candidate's only signal is one bullet about 'training management tools' "
            "without further context).\n"
            "   Use 'partial' whenever you found yourself applying the LIBERAL "
            "INTERPRETATION rule above to justify the bonus. The recruiter sees this and "
            "treats partial bonuses as a flag to verify in interview.\n"
            "- Skip instructions only when there is genuinely no evidence in the profile.\n\n"
            "Return ONLY valid JSON of this exact shape (no markdown, no preamble):\n"
            "{\n"
            '  "components": [\n'
            '    {"name": "education",      "raw": 0-100, "reasoning": "...", "gaps": ["..."]},\n'
            '    {"name": "skills",         "raw": 0-100, "reasoning": "...", "gaps": ["..."]},\n'
            '    {"name": "experience",     "raw": 0-100, "reasoning": "...", "gaps": ["..."]},\n'
            '    {"name": "certifications", "raw": 0-100, "reasoning": "...", "gaps": ["..."]}\n'
            "  ],\n"
            '  "bonuses": [\n'
            '    {"rule": "verbatim recruiter instruction", "points": -25..+25, "reasoning": "...", "confidence": "high" | "partial"}\n'
            "  ],\n"
            '  "summary": "1-2 sentence overview the recruiter will see"\n'
            "}"
        )

        structured = analysis["structuredCriteria"] if analysis else {}

        required_years_raw = structured.get("experience_years_min")
        try:
            required_years = int(required_years_raw) if required_years_raw is not None else None
        except (TypeError, ValueError):
            required_years = None
        if required_years and required_years > 0:
            required_months = required_years * 12
            required_years_label = f"{required_years} year{'s' if required_years != 1 else ''}"
        else:
            required_months = None
            required_years_label = "no specific minimum stated"

        computed_facts = {
            "today": today.isoformat(),
            "candidate_total_experience": exp_summary["total_label"],
            "candidate_total_experience_months": exp_summary["total_months"],
            "required_experience_label": required_years_label,
            "required_experience_months": required_months,
            "roles": exp_summary["roles"],
        }
        user_prompt = (
            f"Job title: {job['title']}\n\n"
            f"Structured job criteria (AUTHORITATIVE — derived from the JD by the analyzer):\n"
            f"{json.dumps(structured, indent=2, default=str)}\n\n"
            f"Computed facts (AUTHORITATIVE — use these as-is, do not re-derive):\n"
            f"{json.dumps(computed_facts, indent=2, default=str)}\n\n"
            f"Candidate profile:\n"
            f"Form answers: {json.dumps(app['formAnswers'], indent=2, default=str)}\n"
            f"Skills: {json.dumps(app.get('parsed_skills') or [], default=str)}\n"
            f"Experience (raw): {json.dumps(app.get('parsed_experience') or [], default=str)}\n"
            f"Education: {json.dumps(app.get('parsed_education') or [], default=str)}\n"
            f"Certifications: {json.dumps(app.get('parsed_certs') or [], default=str)}\n"
        )
        raw = chat(system_prompt, user_prompt, response_format="json_object")
        result = json.loads(raw)

        component_weights = {
            "education": float(weights["education"]),
            "skills": float(weights["skills"]),
            "experience": float(weights["experience"]),
            "certifications": float(weights["certs"]),
        }
        allowed = set(component_weights.keys())

        components: list[dict] = []
        seen: set[str] = set()
        for c in result.get("components") or []:
            name = str(c.get("name", "")).lower()
            if name not in allowed or name in seen:
                continue
            seen.add(name)
            raw_gaps = c.get("gaps") or []
            gaps = [str(g).strip() for g in raw_gaps if str(g).strip()] if isinstance(raw_gaps, list) else []
            components.append({
                "name": name,
                "weight": component_weights[name],
                "raw": max(0, min(100, int(c.get("raw", 0)))),
                "reasoning": str(c.get("reasoning", "")).strip(),
                "gaps": gaps,
            })
        # Fill in any component the LLM omitted with a zero so the score math stays well-defined.
        for name in allowed - seen:
            components.append({
                "name": name,
                "weight": component_weights[name],
                "raw": 0,
                "reasoning": "Not evaluated by the model.",
                "gaps": ["Not evaluated by the model."],
            })

        bonuses: list[dict] = []
        for b in result.get("bonuses") or []:
            try:
                points = int(b.get("points", 0))
            except (TypeError, ValueError):
                points = 0
            if points == 0:
                continue
            confidence = str(b.get("confidence", "")).strip().lower()
            if confidence not in ("high", "partial"):
                confidence = "high"
            bonuses.append({
                "rule": str(b.get("rule", "")).strip(),
                "points": points,
                "reasoning": str(b.get("reasoning", "")).strip(),
                "confidence": confidence,
            })

        # Compute the final score deterministically — never trust an LLM-supplied total.
        weighted = sum(c["raw"] * c["weight"] for c in components)
        bonus_total = sum(b["points"] for b in bonuses)
        score = max(0, min(100, round(weighted + bonus_total)))

        breakdown = {
            "components": components,
            "bonuses": bonuses,
            "summary": str(result.get("summary", "")).strip(),
        }
        return score, breakdown


class ScorerBulkWorker(ScorerWorker):
    """Listens on score_bulk for full-job rescoring triggered by the API."""
    stream = "hira:jobs:score_bulk"
    consumer = "scorer-bulk-1"
