import json
import logging
import threading
from abc import ABC, abstractmethod

from services.redis_client import get_redis

logger = logging.getLogger(__name__)

GROUP = "workers-group"
BLOCK_MS = 5000


class BaseWorker(ABC):
    """
    Consumer-group reader for a single Redis Stream.
    Subclasses override `handle(payload)`.

    On success the message is XACK'd. On failure it stays in the Pending Entries
    List (PEL) so it can be reclaimed and retried later.
    """

    stream: str = ""
    consumer: str = ""

    def run(self) -> None:
        r = get_redis()
        logger.info(f"[{self.consumer}] listening on {self.stream}")

        while True:
            try:
                results = r.xreadgroup(
                    groupname=GROUP,
                    consumername=self.consumer,
                    streams={self.stream: ">"},
                    count=1,
                    block=BLOCK_MS,
                )
                if not results:
                    continue

                for _, messages in results:
                    for message_id, raw in messages:
                        try:
                            payload = {k: json.loads(v) for k, v in raw.items()}
                        except json.JSONDecodeError:
                            payload = dict(raw)
                        try:
                            self.handle(payload)
                            r.xack(self.stream, GROUP, message_id)
                        except Exception as exc:
                            logger.exception(
                                f"[{self.consumer}] failed to handle {message_id}: {exc}"
                            )
            except Exception as exc:
                logger.exception(f"[{self.consumer}] stream error: {exc}")

    def start_thread(self) -> threading.Thread:
        t = threading.Thread(target=self.run, daemon=True, name=self.consumer)
        t.start()
        return t

    @abstractmethod
    def handle(self, payload: dict) -> None:
        ...
