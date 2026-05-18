import os
import sys
import time
import logging
import redis as redis_lib
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))

from utils.logger import setup_logging  # noqa: E402
setup_logging()
logger = logging.getLogger(__name__)

from db.connection import init_db  # noqa: E402
from services.redis_client import get_redis  # noqa: E402
from job_analyzer import JobAnalyzerWorker  # noqa: E402
from early_rejection import EarlyRejectionWorker, ReevaluateRejectionsWorker  # noqa: E402
from resume_parser import ResumeParserWorker  # noqa: E402
from scorer import ScorerWorker, ScorerBulkWorker  # noqa: E402
from question_generator import QuestionGeneratorWorker  # noqa: E402


STREAMS = [
    "hira:jobs:analyze",
    "hira:jobs:early_reject",
    "hira:jobs:parse_resume",
    "hira:jobs:score",
    "hira:jobs:score_bulk",
    "hira:jobs:generate_questions",
    "hira:jobs:reevaluate_rejections",
]

GROUP = "workers-group"


def create_consumer_groups() -> None:
    r = get_redis()
    for stream in STREAMS:
        try:
            r.xgroup_create(stream, GROUP, id="$", mkstream=True)
            logger.info(f"created consumer group {GROUP} on {stream}")
        except redis_lib.exceptions.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise
            # already exists, ignore


def main() -> None:
    init_db()
    create_consumer_groups()

    workers = [
        JobAnalyzerWorker(),
        EarlyRejectionWorker(),
        ReevaluateRejectionsWorker(),
        ResumeParserWorker(),
        ScorerWorker(),
        ScorerBulkWorker(),
        QuestionGeneratorWorker(),
    ]
    for w in workers:
        w.start_thread()
    logger.info(f"started {len(workers)} workers")

    while True:
        time.sleep(60)


if __name__ == "__main__":
    main()
