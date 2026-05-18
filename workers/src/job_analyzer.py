import json
import logging
from base_worker import BaseWorker
from db.queries import get_job, upsert_job_analysis
from services.openai_client import chat

logger = logging.getLogger(__name__)


class JobAnalyzerWorker(BaseWorker):
    stream = "hira:jobs:analyze"
    consumer = "job-analyzer-1"

    def handle(self, payload: dict) -> None:
        job_id = payload.get("job_id")
        if not job_id:
            logger.warning("missing job_id in payload")
            return

        job = get_job(job_id)
        if not job:
            logger.warning(f"job {job_id} not found")
            return

        system_prompt = (
            "You are an expert HR analyst. Analyse the following job and return ONLY a JSON object "
            "with this exact shape. Do not include any explanation or markdown.\n\n"
            "{\n"
            '  "required_skills": ["skill1", "skill2"],\n'
            '  "preferred_skills": ["skill3"],\n'
            '  "experience_years_min": 3,\n'
            '  "education_level": "bachelor",\n'
            '  "key_responsibilities": ["responsibility1"],\n'
            '  "seniority": "mid",\n'
            '  "domain": "software engineering"\n'
            "}"
        )

        instructions = job.get("scoring_instructions") or []
        user_prompt = (
            f"Job title: {job['title']}\n\n"
            f"Job description:\n{job['description']}\n\n"
            f"Recruiter scoring instructions:\n" + ("\n".join(f"- {i}" for i in instructions) if instructions else "(none)")
        )

        raw = chat(system_prompt, user_prompt, response_format="json_object")
        structured = json.loads(raw)
        upsert_job_analysis(job_id, structured)
        logger.info(f"job analysis stored for {job_id}")
