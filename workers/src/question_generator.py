import json
import logging
import uuid
from sqlalchemy import text

from base_worker import BaseWorker
from db.connection import get_session
from db.queries import get_application, get_job
from services.openai_client import chat

logger = logging.getLogger(__name__)


class QuestionGeneratorWorker(BaseWorker):
    stream = "hira:jobs:generate_questions"
    consumer = "question-gen-1"

    def handle(self, payload: dict) -> None:
        application_id = payload["application_id"]
        job_id = payload["job_id"]
        interview_id = payload.get("interview_id")
        instructions = payload.get("instructions", "")
        generated_by = payload["generated_by"]

        app = get_application(application_id)
        job = get_job(job_id)
        if not app or not job:
            logger.warning(f"missing app/job: app={application_id} job={job_id}")
            return

        special = f"Special instructions: {instructions}" if instructions else ""
        system_prompt = (
            "You are an expert technical interviewer. Generate targeted interview questions for this "
            "candidate based on their profile and the job description.\n\n"
            f"{special}\n\n"
            'Return ONLY valid JSON: {"questions": [{"question": "...", "answer": null}]}\n'
            "Generate 8-12 questions. Do not include numbering in the question text."
        )
        user_prompt = (
            f"Job title: {job['title']}\n"
            f"Job description: {job['description']}\n\n"
            f"Candidate profile:\n"
            f"Skills: {json.dumps(app.get('parsed_skills') or [], default=str)}\n"
            f"Experience: {json.dumps(app.get('parsed_experience') or [], default=str)}\n"
            f"Education: {json.dumps(app.get('parsed_education') or [], default=str)}\n"
        )
        raw = chat(system_prompt, user_prompt, response_format="json_object")
        result = json.loads(raw)
        questions = result.get("questions", [])

        with get_session() as s:
            s.execute(
                text("""
                    INSERT INTO generated_questions
                        (id, "applicationId", "interviewId", "generatedBy", instructions, questions, "createdAt")
                    VALUES
                        (:id, :application_id, :interview_id, :generated_by, :instructions, CAST(:questions AS jsonb), NOW())
                """),
                {
                    "id": str(uuid.uuid4()),
                    "application_id": application_id,
                    "interview_id": interview_id,
                    "generated_by": generated_by,
                    "instructions": instructions or None,
                    "questions": json.dumps(questions),
                },
            )
            s.commit()
        logger.info(f"stored {len(questions)} questions for application {application_id}")
