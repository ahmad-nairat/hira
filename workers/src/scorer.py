import json
import logging
from base_worker import BaseWorker
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


class ScorerWorker(BaseWorker):
    stream = "hira:jobs:score"
    consumer = "scorer-1"

    def handle(self, payload: dict) -> None:
        if payload.get("bulk"):
            self._score_bulk(payload["job_id"])
        elif "application_id" in payload:
            self._score_single(payload["application_id"], payload["job_id"])

    def _score_single(self, application_id: str, job_id: str) -> None:
        app = get_application(application_id)
        if not app:
            logger.warning(f"application {application_id} not found")
            return

        score = self._calculate_score(app, job_id)
        update_application_score(application_id, score)

        if app["currentStage"] == "ai_evaluation":
            update_application_stage(
                application_id,
                "screening",
                moved_by=None,
                note="AI evaluation complete",
            )

    def _score_bulk(self, job_id: str) -> None:
        apps = get_applications_in_stages(job_id, SCOREABLE_STAGES)
        for app in apps:
            try:
                score = self._calculate_score(app, job_id)
                update_application_score(app["id"], score)
            except Exception:
                logger.exception(f"failed to score application {app['id']}")

    def _calculate_score(self, app: dict, job_id: str) -> int:
        job = get_job(job_id)
        analysis = get_job_analysis(job_id)
        weights = get_effective_scoring_weights(job_id)
        if not job:
            raise ValueError(f"job {job_id} not found while scoring")

        instructions = job.get("scoring_instructions") or []
        instr_text = "\n".join(f"- {i}" for i in instructions) if instructions else "None"

        system_prompt = (
            "You are an expert HR evaluator. Score this candidate out of 100 based on the job requirements.\n\n"
            f"Scoring weights (reflect these proportions):\n"
            f"- Education:      {weights['education'] * 100:.0f}%\n"
            f"- Skills:         {weights['skills']    * 100:.0f}%\n"
            f"- Experience:     {weights['experience']* 100:.0f}%\n"
            f"- Certifications: {weights['certs']     * 100:.0f}%\n\n"
            f"Additional recruiter instructions:\n{instr_text}\n\n"
            'Return ONLY valid JSON: {"score": 75, "reasoning": "brief explanation"}'
        )

        structured = analysis["structuredCriteria"] if analysis else {}
        user_prompt = (
            f"Job title: {job['title']}\n"
            f"Structured job criteria: {json.dumps(structured, indent=2, default=str)}\n\n"
            f"Candidate profile:\n"
            f"Form answers: {json.dumps(app['formAnswers'], indent=2, default=str)}\n"
            f"Skills: {json.dumps(app.get('parsed_skills') or [], default=str)}\n"
            f"Experience: {json.dumps(app.get('parsed_experience') or [], default=str)}\n"
            f"Education: {json.dumps(app.get('parsed_education') or [], default=str)}\n"
            f"Certifications: {json.dumps(app.get('parsed_certs') or [], default=str)}\n"
        )
        raw = chat(system_prompt, user_prompt, response_format="json_object")
        result = json.loads(raw)
        return max(0, min(100, int(result["score"])))


class ScorerBulkWorker(ScorerWorker):
    """Listens on score_bulk for full-job rescoring triggered by the API."""
    stream = "hira:jobs:score_bulk"
    consumer = "scorer-bulk-1"
