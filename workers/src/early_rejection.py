import json
import logging
from base_worker import BaseWorker
from services.redis_client import get_redis
from services.openai_client import chat
from db.queries import (
    get_application,
    get_job,
    get_applications_in_stages,
    update_application_stage,
    update_application_rejection_note,
)

logger = logging.getLogger(__name__)


class EarlyRejectionWorker(BaseWorker):
    stream = "hira:jobs:early_reject"
    consumer = "early-rejection-1"

    def handle(self, payload: dict) -> None:
        if "application_id" in payload:
            self._evaluate_single(payload["application_id"], payload["job_id"])
        elif payload.get("bulk"):
            self._evaluate_bulk(payload["job_id"])

    def _evaluate_single(self, application_id: str, job_id: str) -> None:
        app = get_application(application_id)
        job = get_job(job_id)
        if not app or not job:
            logger.warning(f"missing app/job: app={application_id} job={job_id}")
            return

        criteria = job.get("rejection_criteria") or []
        if not criteria:
            self._publish_to_parser(application_id, job_id, app["orgId"], app["resumeUrl"])
            return

        rejected, reasoning = self._check_criteria(app["formAnswers"], criteria, job["title"])
        if rejected:
            note = self._format_note(reasoning)
            update_application_rejection_note(application_id, note)
            update_application_stage(
                application_id,
                "early_rejection",
                moved_by=None,
                note=note,
            )
        else:
            self._publish_to_parser(application_id, job_id, app["orgId"], app["resumeUrl"])

    def _evaluate_bulk(self, job_id: str) -> None:
        """
        Re-evaluates candidates currently in early_rejection or screening.
        - early_rejection that now pass → move to ai_evaluation, dispatch to resume parser.
        - screening that now fail → move back to early_rejection.
        """
        job = get_job(job_id)
        if not job:
            return
        criteria = job.get("rejection_criteria") or []
        apps = get_applications_in_stages(job_id, ["early_rejection", "screening"])

        for app in apps:
            if criteria:
                rejected, reasoning = self._check_criteria(app["formAnswers"], criteria, job["title"])
            else:
                rejected, reasoning = False, ""
            stage = app["currentStage"]
            if stage == "early_rejection" and not rejected:
                update_application_rejection_note(app["id"], None)
                update_application_stage(
                    app["id"], "ai_evaluation", note="Re-evaluation passed new criteria"
                )
                self._publish_to_parser(app["id"], job_id, app["orgId"], app["resumeUrl"])
            elif stage == "screening" and rejected:
                note = self._format_note(reasoning)
                update_application_rejection_note(app["id"], note)
                update_application_stage(
                    app["id"],
                    "early_rejection",
                    note=note,
                )

    def _check_criteria(self, form_answers, criteria: list, job_title: str) -> tuple[bool, str]:
        system_prompt = (
            "You are an HR screening assistant. For each rejection criterion you must evaluate "
            "strictly and factually whether it applies to the candidate.\n\n"
            "Process:\n"
            "1. For EACH criterion, identify the candidate answer(s) most relevant to it and quote them.\n"
            "2. Decide whether the criterion applies. Be strict and literal. Do NOT invent or guess "
            "factual claims about geography, dates, certifications, or definitions. Use only what your "
            "reliable knowledge supports; if genuinely uncertain about a fact, treat the criterion as "
            "NOT applying rather than guessing.\n"
            "3. The candidate is rejected if ANY single criterion applies.\n\n"
            "Return ONLY a JSON object with this exact shape:\n"
            "{\n"
            '  "per_criterion": [\n'
            '    {"criterion": "...", "relevant_answer": "...", "applies": true|false, "why": "short justification"}\n'
            "  ],\n"
            '  "rejected": true|false,\n'
            '  "reasoning": "1-2 sentence summary the recruiter will see"\n'
            "}"
        )
        criteria_lines = "\n".join(f"- {c}" for c in criteria)
        user_prompt = (
            f"Job: {job_title}\n\n"
            f"Rejection criteria (reject if ANY apply):\n{criteria_lines}\n\n"
            f"Candidate answers:\n{json.dumps(form_answers, indent=2, default=str)}"
        )
        raw = chat(system_prompt, user_prompt, response_format="json_object")
        result = json.loads(raw)
        rejected = bool(result.get("rejected", False))
        reasoning = str(result.get("reasoning", "")).strip()
        if not reasoning:
            applied = [c for c in (result.get("per_criterion") or []) if c.get("applies")]
            if applied:
                reasoning = "; ".join(f'{c.get("criterion", "")}: {c.get("why", "")}' for c in applied)
        return rejected, reasoning

    def _format_note(self, reasoning: str) -> str:
        base = "Automatically rejected by AI based on job criteria"
        return f"{base}: {reasoning}" if reasoning else base

    def _publish_to_parser(self, application_id, job_id, org_id, resume_url) -> None:
        r = get_redis()
        r.xadd(
            "hira:jobs:parse_resume",
            {
                "application_id": json.dumps(str(application_id)),
                "job_id": json.dumps(str(job_id)),
                "org_id": json.dumps(str(org_id)),
                "resume_url": json.dumps(str(resume_url)),
            },
        )


class ReevaluateRejectionsWorker(EarlyRejectionWorker):
    """Same handler as EarlyRejectionWorker but reads the bulk re-evaluation stream."""
    stream = "hira:jobs:reevaluate_rejections"
    consumer = "early-rejection-bulk-1"
