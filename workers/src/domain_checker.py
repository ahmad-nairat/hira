#!/usr/bin/env python3
"""
Domain verification cron worker.
Run on cron every 2 hours. Checks every org_domains row with status='pending'
that is still inside the 72-hour window. Domains past the window are marked expired.
"""
import logging
import os
import sys
from datetime import datetime, timedelta, timezone

import dns.resolver
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))
from utils.logger import setup_logging  # noqa: E402
from db.connection import init_db  # noqa: E402
from db.queries import (  # noqa: E402
    get_pending_domains,
    get_expired_pending_domains,
    update_domain_status,
)

setup_logging()
logger = logging.getLogger(__name__)


def check_dns(domain: str, token: str) -> bool:
    """Returns True if the TXT record `_hira-verify.<domain>` contains hira-verify=<token>."""
    try:
        answers = dns.resolver.resolve(f"_hira-verify.{domain}", "TXT")
        for rdata in answers:
            for string in rdata.strings:
                value = string.decode("utf-8") if isinstance(string, bytes) else string
                if value == f"hira-verify={token}":
                    return True
    except Exception as exc:
        logger.debug(f"DNS lookup failed for {domain}: {exc}")
    return False


def run() -> None:
    init_db()
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=72)

    pending = get_pending_domains(submitted_after=cutoff)
    logger.info(f"checking {len(pending)} pending domain(s) within 72h window")

    for record in pending:
        domain = record["domain"]
        token = record["verificationToken"]
        if check_dns(domain, token):
            logger.info(f"verified {domain}")
            update_domain_status(record["id"], "verified", verified_at=now)
        else:
            logger.info(f"still pending: {domain}")

    expired = get_expired_pending_domains(cutoff=cutoff)
    for record in expired:
        logger.info(f"expired (72h window passed): {record['domain']}")
        update_domain_status(record["id"], "expired")


if __name__ == "__main__":
    run()
