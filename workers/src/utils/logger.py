import logging
import sys


def setup_logging(level: int = logging.INFO) -> None:
    """Configure root logger with timestamped, structured-ish output."""
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(name)s %(levelname)s %(message)s",
        stream=sys.stdout,
    )
