# Hira Workers

Six Python services that handle all background AI processing for Hira. Five consume events from Redis Streams; one runs as a cron job inside the container.

| | |
|---|---|
| **Spec** | `workers/CLAUDE.md` |

---

## What runs where

| # | Worker | Trigger | Stream(s) |
|---|---|---|---|
| 1 | `job_analyzer.py` | Job published (or republished) | `hira:jobs:analyze` |
| 2 | `early_rejection.py` | New application + bulk re-evaluation | `hira:jobs:early_reject`, `hira:jobs:reevaluate_rejections` |
| 3 | `resume_parser.py` | After a candidate passes early rejection | `hira:jobs:parse_resume` |
| 4 | `scorer.py` | After resume parsing + bulk rescore | `hira:jobs:score`, `hira:jobs:score_bulk` |
| 5 | `question_generator.py` | User requests AI interview questions | `hira:jobs:generate_questions` |
| 6 | `domain_checker.py` | **Cron**, every 2 hours inside the container | — |

The five event-driven workers run as daemon threads inside a single container process. They share the same DB/Redis/R2 clients. The cron worker is a separate Python invocation triggered by `cron` inside the same container.

---

## Stack

| Concern | Library |
|---|---|
| Redis Streams | `redis[hiredis]>=5.0` |
| PostgreSQL | `sqlalchemy>=2.0` + `psycopg2-binary>=2.9` |
| AI | `openai>=1.30` (model: `gpt-4o`) |
| R2 / S3 | `boto3>=1.34` |
| PDF text extraction | `pdfminer.six>=20221105` |
| DNS lookups | `dnspython>=2.6` |
| Env loading | `python-dotenv>=1.0` |
| HTTP | `httpx>=0.27` (reserved for resume fallbacks) |

---

## Run

```bash
docker compose up -d workers
docker compose logs -f workers
```
The container starts both `cron` and `python src/main.py`. Domain-checker output is tailed to stdout via `tail -F /var/log/domain_checker.log`. Env values come from the root `.env`.

---

## Layer map

```
workers/
├── requirements.txt
├── Dockerfile               ← python:3.12-slim + cron
├── docker-entrypoint.sh     ← starts cron + main.py
├── crontab                  ← runs domain_checker.py every 2h
└── src/
    ├── main.py              ← starts all 5 workers in threads, creates groups
    ├── base_worker.py       ← BaseWorker class (XREADGROUP loop, XACK on success)
    ├── job_analyzer.py
    ├── early_rejection.py
    ├── resume_parser.py
    ├── scorer.py
    ├── question_generator.py
    ├── domain_checker.py
    ├── db/
    │   ├── connection.py    ← SQLAlchemy engine + session factory
    │   └── queries.py       ← raw SQL via SQLAlchemy Core (one function per query)
    ├── services/
    │   ├── redis_client.py  ← redis.from_url singleton
    │   ├── openai_client.py ← chat() wrapper for gpt-4o JSON mode
    │   └── r2_client.py     ← boto3 S3 client + download_file + url_to_key
    └── utils/
        └── logger.py
```

---

## Error semantics

- **Success** → message is XACK'd.
- **Handler raises** → message stays in the Pending Entries List (PEL). Logs the traceback and continues with the next message. A future operator can XCLAIM and retry.
- **Worker can't find the application or job** → logs a warning and returns (no ack — message stays for inspection). Common when an admin deletes a record while a job is in flight.
- **OpenAI errors** → propagate up. The base worker leaves the message un-ACK'd.
- **DB write failures** → propagate up. We never partially commit.
- **DNS resolution failures in the domain checker** → treated as "not verified yet", never as "expired" (unless the 72h window already elapsed).

Workers do not send emails or push notifications themselves — that's the API's job.

---

## Environment

| Var | Notes |
|---|---|
| `DATABASE_URL` | Same Postgres as the API. Workers convert `postgres://` → `postgresql://` for SQLAlchemy. |
| `REDIS_URL` | Same Redis as the API. |
| `OPENAI_API_KEY` | Required — `gpt-4o` access with billing enabled. |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Required for the resume parser. |
| `R2_PUBLIC_URL` | Used to strip the public prefix from `resume_url` to recover the storage key. Match the value in the API's env. |

---

## Schema coupling

The workers do **not** use the TypeORM ORM models. They use raw SQL via SQLAlchemy Core against the same tables the API owns. Column names match the TypeORM convention (camelCase, quoted in SQL):

- `applications` has `"currentStage"`, `"hasOutdatedScore"`, `"formAnswers"`, `"resumeUrl"`, `"updatedAt"`, etc.
- `application_stage_history` is append-only and the workers insert into it whenever they advance a stage.
- `job_analyses.structuredCriteria` is jsonb, written by Worker 1 and read by Worker 4.

If you change the API schema, update `workers/src/db/queries.py` accordingly.
