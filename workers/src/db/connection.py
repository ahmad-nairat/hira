import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

_engine = None
SessionLocal = None


def init_db() -> None:
    """Initialise the SQLAlchemy engine and session factory once at startup."""
    global _engine, SessionLocal
    if _engine is not None:
        return
    url = os.environ["DATABASE_URL"]
    # SQLAlchemy expects postgresql:// not postgres://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    _engine = create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=5)
    SessionLocal = sessionmaker(bind=_engine, expire_on_commit=False)


def get_session() -> Session:
    if SessionLocal is None:
        init_db()
    assert SessionLocal is not None
    return SessionLocal()
