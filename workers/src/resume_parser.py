import io
import json
import logging
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams

from base_worker import BaseWorker
from services.redis_client import get_redis
from services.file_client import download_resume
from services.openai_client import chat
from db.queries import get_application, update_candidate_parsed_profile

logger = logging.getLogger(__name__)


class ResumeParserWorker(BaseWorker):
    stream = "hira:jobs:parse_resume"
    consumer = "resume-parser-1"

    def handle(self, payload: dict) -> None:
        application_id = payload["application_id"]
        job_id = payload["job_id"]
        org_id = payload["org_id"]
        resume_url = payload["resume_url"]

        app = get_application(application_id)
        if not app:
            logger.warning(f"application {application_id} not found")
            return

        file_bytes = download_resume(resume_url)
        resume_text = self._extract_text(file_bytes)

        system_prompt = (
            "You are an expert resume parser. Extract structured information from the resume text. "
            "Return ONLY valid JSON with this exact structure — no markdown, no explanation:\n\n"
            "{\n"
            '  "skills": [{"name": "Python", "level": "advanced"}],\n'
            '  "experience": [{"title": "Software Engineer", "company": "Acme", "start": "2020-01", "end": "2023-06", "description": "Built APIs"}],\n'
            '  "education": [{"degree": "BSc Computer Science", "institution": "University", "year": "2020"}],\n'
            '  "certs": [{"name": "AWS Solutions Architect", "issuer": "Amazon", "year": "2022"}]\n'
            "}"
        )
        raw = chat(system_prompt, f"Resume text:\n\n{resume_text}", response_format="json_object")
        parsed = json.loads(raw)

        update_candidate_parsed_profile(
            app["candidateId"],
            skills=parsed.get("skills", []),
            experience=parsed.get("experience", []),
            education=parsed.get("education", []),
            certs=parsed.get("certs", []),
        )

        r = get_redis()
        r.xadd(
            "hira:jobs:score",
            {
                "application_id": json.dumps(application_id),
                "job_id": json.dumps(job_id),
                "org_id": json.dumps(org_id),
            },
        )
        logger.info(f"parsed resume for application {application_id}")

    def _extract_text(self, file_bytes: bytes) -> str:
        output = io.StringIO()
        extract_text_to_fp(io.BytesIO(file_bytes), output, laparams=LAParams())
        return output.getvalue()
