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

        rejected = self._check_criteria(app["formAnswers"], criteria, job["title"])
        if rejected:
            update_application_stage(
                application_id,
                "early_rejection",
                moved_by=None,
                note="Automatically rejected by AI based on job criteria",
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
            rejected = (
                self._check_criteria(app["formAnswers"], criteria, job["title"])
                if criteria
                else False
            )
            stage = app["currentStage"]
            if stage == "early_rejection" and not rejected:
                update_application_stage(
                    app["id"], "ai_evaluation", note="Re-evaluation passed new criteria"
                )
                self._publish_to_parser(app["id"], job_id, app["orgId"], app["resumeUrl"])
            elif stage == "screening" and rejected:
                update_application_stage(
                    app["id"],
                    "early_rejection",
                    note="Failed re-evaluation against updated criteria",
                )

    def _check_criteria(self, form_answers: dict, criteria: list, job_title: str) -> bool:
        system_prompt = (
            "You are an HR screening assistant. Given a candidate's form answers and a list of "
            "rejection criteria, decide if the candidate should be rejected. "
            'Return ONLY valid JSON: {"rejected": true} or {"rejected": false}. '
            "Do not include any explanation."
        )
        criteria_lines = "\n".join(f"- {c}" for c in criteria)
        user_prompt = (
            f"Job: {job_title}\n\n"
            f"Rejection criteria (reject if ANY apply):\n{criteria_lines}\n\n"
            f"Candidate's form answers:\n{json.dumps(form_answers, indent=2, default=str)}"
        )
        raw = chat(system_prompt, user_prompt, response_format="json_object")
        result = json.loads(raw)
        return bool(result.get("rejected", False))

    def _publish_to_parser(self, application_id: str, job_id: str, org_id: str, resume_url: str) -> None:
        r = get_redis()
        r.xadd(
            "hira:jobs:parse_resume",
            {
                "application_id": json.dumps(application_id),
                "job_id": json.dumps(job_id),
                "org_id": json.dumps(org_id),
                "resume_url": json.dumps(resume_url),
            },
        )


class ReevaluateRejectionsWorker(EarlyRejectionWorker):
    """Same handler as EarlyRejectionWorker but reads the bulk re-evaluation stream."""
    stream = "hira:jobs:reevaluate_rejections"
    consumer = "early-rejection-bulk-1"
