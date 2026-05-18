"""
All database queries used by the workers.
We use raw SQL via SQLAlchemy Core to avoid replicating the full TypeORM schema in Python.
"""
import json
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import text

from db.connection import get_session


# ── Applications ──────────────────────────────────────────────────────────────

def get_application(application_id: str) -> Optional[dict]:
    with get_session() as s:
        row = s.execute(
            text("""
                SELECT a.*, c.email AS candidate_email, c.full_name AS candidate_name,
                       c."parsedSkills" AS parsed_skills,
                       c."parsedExperience" AS parsed_experience,
                       c."parsedEducation" AS parsed_education,
                       c."parsedCerts" AS parsed_certs
                FROM applications a
                JOIN candidates c ON c.id = a."candidateId"
                WHERE a.id = :id AND a."deletedAt" IS NULL
            """),
            {"id": application_id},
        ).mappings().fetchone()
        return dict(row) if row else None


def get_applications_in_stages(job_id: str, stages: list[str]) -> list[dict]:
    with get_session() as s:
        rows = s.execute(
            text("""
                SELECT a.*, c.email AS candidate_email, c.full_name AS candidate_name,
                       c."parsedSkills" AS parsed_skills,
                       c."parsedExperience" AS parsed_experience,
                       c."parsedEducation" AS parsed_education,
                       c."parsedCerts" AS parsed_certs
                FROM applications a
                JOIN candidates c ON c.id = a."candidateId"
                WHERE a."jobId" = :job_id
                  AND a."currentStage" = ANY(:stages)
                  AND a."deletedAt" IS NULL
            """),
            {"job_id": job_id, "stages": stages},
        ).mappings().fetchall()
        return [dict(r) for r in rows]


def update_application_stage(
    application_id: str,
    stage: str,
    moved_by: Optional[str] = None,
    note: Optional[str] = None,
) -> None:
    with get_session() as s:
        current = s.execute(
            text('SELECT "currentStage" FROM applications WHERE id = :id'),
            {"id": application_id},
        ).scalar()
        s.execute(
            text("""
                UPDATE applications
                SET "currentStage" = :stage, "updatedAt" = NOW()
                WHERE id = :id
            """),
            {"stage": stage, "id": application_id},
        )
        s.execute(
            text("""
                INSERT INTO application_stage_history
                    (id, "applicationId", "fromStage", "toStage", "movedBy", note, "createdAt")
                VALUES
                    (gen_random_uuid(), :application_id, :from_stage, :to_stage, :moved_by, :note, NOW())
            """),
            {
                "application_id": application_id,
                "from_stage": current,
                "to_stage": stage,
                "moved_by": moved_by,
                "note": note,
            },
        )
        s.commit()


def update_application_score(application_id: str, score: int) -> None:
    with get_session() as s:
        s.execute(
            text("""
                UPDATE applications
                SET score = :score, "hasOutdatedScore" = FALSE, "updatedAt" = NOW()
                WHERE id = :id
            """),
            {"score": score, "id": application_id},
        )
        s.commit()


def update_candidate_parsed_profile(
    candidate_id: str,
    skills: list,
    experience: list,
    education: list,
    certs: list,
) -> None:
    with get_session() as s:
        s.execute(
            text("""
                UPDATE candidates
                SET "parsedSkills" = :skills,
                    "parsedExperience" = :experience,
                    "parsedEducation" = :education,
                    "parsedCerts" = :certs,
                    "updatedAt" = NOW()
                WHERE id = :id
            """),
            {
                "skills": json.dumps(skills),
                "experience": json.dumps(experience),
                "education": json.dumps(education),
                "certs": json.dumps(certs),
                "id": candidate_id,
            },
        )
        s.commit()


# ── Jobs ──────────────────────────────────────────────────────────────────────

def get_job(job_id: str) -> Optional[dict]:
    with get_session() as s:
        row = s.execute(
            text('SELECT * FROM jobs WHERE id = :id AND "deletedAt" IS NULL'),
            {"id": job_id},
        ).mappings().fetchone()
        if not row:
            return None
        d = dict(row)
        # Normalise to snake_case keys the workers use
        d["rejection_criteria"] = d.get("rejectionCriteria") or []
        d["scoring_instructions"] = d.get("scoringInstructions") or []
        return d


def get_job_analysis(job_id: str) -> Optional[dict]:
    with get_session() as s:
        row = s.execute(
            text('SELECT * FROM job_analyses WHERE "jobId" = :id'),
            {"id": job_id},
        ).mappings().fetchone()
        return dict(row) if row else None


def upsert_job_analysis(job_id: str, structured_criteria: dict) -> None:
    with get_session() as s:
        s.execute(
            text("""
                INSERT INTO job_analyses (id, "jobId", "structuredCriteria", "analyzedAt", "createdAt")
                VALUES (gen_random_uuid(), :job_id, CAST(:criteria AS jsonb), NOW(), NOW())
                ON CONFLICT ("jobId") DO UPDATE
                SET "structuredCriteria" = EXCLUDED."structuredCriteria",
                    "analyzedAt" = NOW()
            """),
            {"job_id": job_id, "criteria": json.dumps(structured_criteria)},
        )
        s.commit()


# ── Effective scoring weights ────────────────────────────────────────────────

def get_effective_scoring_weights(job_id: str) -> dict:
    """Job-level weights win, otherwise fall back to org defaults."""
    with get_session() as s:
        row = s.execute(
            text("""
                SELECT
                    COALESCE(j."scoringEducation",  o."scoringEducation")  AS education,
                    COALESCE(j."scoringSkills",     o."scoringSkills")     AS skills,
                    COALESCE(j."scoringExperience", o."scoringExperience") AS experience,
                    COALESCE(j."scoringCerts",      o."scoringCerts")      AS certs
                FROM jobs j
                JOIN orgs o ON o.id = j."orgId"
                WHERE j.id = :job_id
            """),
            {"job_id": job_id},
        ).mappings().fetchone()
        if not row:
            return {"education": 0.30, "skills": 0.30, "experience": 0.25, "certs": 0.15}
        return {k: float(v) for k, v in dict(row).items()}


# ── OrgDomain ─────────────────────────────────────────────────────────────────

def get_pending_domains(submitted_after: datetime) -> list[dict]:
    """Returns all pending domains submitted within the active 72-hour window."""
    with get_session() as s:
        rows = s.execute(
            text("""
                SELECT * FROM org_domains
                WHERE status = 'pending' AND "submittedAt" > :submitted_after
            """),
            {"submitted_after": submitted_after},
        ).mappings().fetchall()
        return [dict(r) for r in rows]


def get_expired_pending_domains(cutoff: datetime) -> list[dict]:
    """Pending domains whose 72-hour window has elapsed."""
    with get_session() as s:
        rows = s.execute(
            text("""
                SELECT * FROM org_domains
                WHERE status = 'pending' AND "submittedAt" <= :cutoff
            """),
            {"cutoff": cutoff},
        ).mappings().fetchall()
        return [dict(r) for r in rows]


def update_domain_status(domain_id: str, status: str, verified_at: Any = None) -> None:
    with get_session() as s:
        s.execute(
            text("""
                UPDATE org_domains
                SET status = :status, "verifiedAt" = :verified_at
                WHERE id = :id
            """),
            {"status": status, "verified_at": verified_at, "id": domain_id},
        )
        s.commit()
