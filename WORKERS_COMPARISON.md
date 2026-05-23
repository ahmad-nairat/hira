# AI Worker Implementations — Comparison & Migration Notes

Comparison of the current Hira workers (`workers/`) against an alternative
implementation: [`mxen72/ATS-worker`](https://github.com/mxen72/ATS-worker).
Both target the same problem space (resume parsing, JD analysis, candidate
ranking, interview question generation) but make very different architectural
choices.

This document captures:

1. A side-by-side overview
2. Pros and cons of each implementation
3. Concrete migration opportunities, each with an estimated cost and risk

---

## 1. Side-by-side overview

| Concern              | **Hira workers** (this repo)                                   | **ATS-worker** (alternative)                          |
|----------------------|----------------------------------------------------------------|-------------------------------------------------------|
| Queue                | Redis Streams + consumer groups (raw `redis-py`)               | BullMQ (Python client)                                |
| Queue topology       | 7 streams, one per task type                                   | 1 queue (`ai-jobs`), dispatch by `job.name`           |
| AI SDK               | Raw `openai` SDK                                               | LangChain (`langchain_openai`)                        |
| Model                | `gpt-4o`, temperature `0.2`                                    | `gpt-4o-mini`, temperature `0.1`                      |
| Structured output    | JSON mode + prompt + `json.loads`                              | `with_structured_output(PydanticModel)` (strict)      |
| Concurrency model    | One thread per worker class                                    | asyncio, BullMQ `concurrency: 3`                      |
| Persistence          | SQLAlchemy → Postgres, direct writes                           | None — pure transform, backend persists               |
| File storage         | boto3 → R2, in-worker PDF extraction (pdfminer.six)            | None — text arrives in payload                        |
| Pipeline orchestration | Workers chain themselves (each publishes to next stream)     | Node.js backend drives the pipeline                   |
| Tasks implemented    | 5 event-driven + 1 cron (DNS verification)                     | 4 event-driven                                        |
| Bulk operations      | Yes (`score_bulk`, `reevaluate_rejections`)                    | No                                                    |
| Early rejection step | Yes (dedicated worker against form-answer criteria)            | No                                                    |
| Org awareness        | Yes — reads `org_id`, weights, blacklist                       | No — org-agnostic                                     |
| Retry semantics      | Manual; failed messages sit in PEL                             | BullMQ auto-retry                                     |
| Dev/test harness     | None — must publish to streams to test                         | Streamlit dashboard (`hira_test_v2.py`)               |

---

## 2. Pros and cons

### 2.1 Hira workers (current implementation)

**Pros**

- **Domain-rich.** Knows about applications, stages, orgs, blacklists, weights —
  the workers ARE the recruitment pipeline, not just AI helpers.
- **Self-orchestrating.** Pipeline transitions are encoded where the data is.
  Adding a step doesn't require backend changes.
- **Decoupled from any specific backend.** Streams are language-agnostic; any
  service can publish.
- **Per-org tunability.** Scoring weights, blacklists, criteria all resolve from
  the DB at runtime, no payload coupling.
- **Bulk re-evaluation.** Can re-score / re-screen an entire job's pipeline
  after recruiter changes criteria — important for real recruiter workflows.
- **Handles full file lifecycle.** PDF download + text extraction live in the
  worker, so the API stays thin.
- **No extra abstraction layer.** Raw OpenAI calls — easy to debug, no
  LangChain version drift.

**Cons**

- **Schema drift risk.** "JSON mode" only guarantees parseable JSON, not field
  names or types. If the model ever returns `"experiences"` instead of
  `"experience"`, parsed_experience silently lands as `[]` in Postgres. No
  runtime error.
- **No automatic retries.** Failed messages stay in the Pending Entries List
  with no built-in reclaim — production-grade error recovery is on us to write.
- **Threading bottleneck.** One thread per worker class means all
  `parse_resume` jobs serialize through one Python thread. Concurrency requires
  more processes or a code change.
- **Hard to test in isolation.** No dev harness — exercising a single worker
  requires bringing up Redis and publishing a synthetic message.
- **Schema described in English in the prompt.** Drift between the prompt
  description and the code's `.get(...)` reads is undetectable until it breaks
  in prod.
- **No structured logging.** Workers use `print` (per `CLAUDE.md`) — no easy
  way to grep or aggregate.
- **Tight coupling to DB schema.** Every worker has to know table shapes, which
  makes the system harder to evolve.

### 2.2 ATS-worker (alternative)

**Pros**

- **Schema-enforced LLM output.** `with_structured_output(Pydantic)` uses
  OpenAI's strict structured outputs under the hood — the response is
  *guaranteed* to match the schema, with `EmailStr` and `Field(ge=0, le=100)`
  validating values, not just shape.
- **Stateless transforms.** Workers are pure functions — easy to test, easy to
  reason about, trivial to scale horizontally.
- **BullMQ ergonomics.** Retries, returnvalue storage, off-the-shelf dashboards
  (Bull Board) — production niceties out of the box.
- **Real dev harness.** The Streamlit dashboard lets a developer test each task
  with sample data without touching Redis. Huge for prompt iteration.
- **Cheaper model.** `gpt-4o-mini` at low temperature is sufficient for many
  parse/analysis tasks; ~10–15× cheaper than `gpt-4o`.
- **Async-native concurrency.** BullMQ's worker concurrency setting parallelizes
  N jobs per process for free.

**Cons**

- **No domain logic.** Knows nothing about applications, orgs, blacklists,
  stages. Adding org-specific behavior (e.g. weights, blacklists) requires
  passing everything in the payload.
- **Pipeline lives in the backend.** Node.js has to know what comes after what
  — duplicates orchestration concerns and couples backend tightly to AI flow.
- **No bulk operations.** Re-scoring an entire job requires the backend to
  enqueue N jobs in a loop.
- **No early rejection.** Misses an entire stage of the funnel.
- **PDF extraction punted upstream.** Either the backend or the test UI has to
  handle PDF→text. In ATS-worker that work is duplicated (PyPDF2 + python-docx
  only in the Streamlit UI, nowhere else).
- **LangChain dependency.** Adds a large abstraction surface that changes
  frequently and has its own bug surface.
- **`__init__.py` is broken** (imports a non-existent `tasks/` package). Dead
  code, but a sign of low maintenance.
- **No `requirements.txt`, no `Dockerfile`, no `.env.example`** — production
  deployment story is missing.
- **Weights not validated** to sum to 100; default fallback (25/25/25/25)
  silently masks bad input.

---

## 3. What we could bring over — with cost

Each item below is rated on **value** (impact if done), **cost** (engineering
effort), and **risk** (chance of regression). Use this to prioritize.

### 3.1 ⭐ Pydantic structured outputs (schema-enforced JSON)

**What.** Replace `response_format={"type": "json_object"}` + `json.loads` with
either OpenAI's native structured outputs (`response_format={"type":
"json_schema", "schema": ..., "strict": true}`) or LangChain's
`llm.with_structured_output(PydanticModel)`. Define a Pydantic model per worker
output (resume profile, JD analysis, score, questions, rejection verdict).

**Value: HIGH.** Closes the single largest correctness gap in our workers.
Field name drift, missing fields, and type errors become impossible.
`EmailStr`, `Field(ge=0, le=100)`, etc. catch hallucinated values cheaply.

**Cost: LOW — half a day total.**
- ~30–50 LOC per worker, 5 workers = ~200 LOC.
- Add `pydantic` (already a transitive dep via FastAPI-style libs likely),
  optionally `langchain-openai` if going the LangChain route. **Recommendation:
  use OpenAI's native structured outputs** — same guarantee, no extra
  framework.
- One-line change in `openai_client.py` to accept a `schema` parameter and pass
  it through.

**Risk: LOW.** Backed by OpenAI's strict mode. Worst case: a temporary uptick
in retries while models adjust — but those failures would also fail under JSON
mode, just silently.

**Recommendation: do this first.** It is the highest-value, lowest-cost
change.

---

### 3.2 ⭐ Per-worker model selection via env vars

**What.** Hardcoded `gpt-4o` in `services/openai_client.py:22` becomes
configurable per worker. New env vars:
`PARSE_RESUME_MODEL`, `EARLY_REJECT_MODEL`, `SCORER_MODEL`, etc. Defaults to
`gpt-4o`.

**Value: MEDIUM-HIGH.** Significant cost savings. `gpt-4o-mini` for
`early_rejection` (binary decision) and `job_analyzer` (structured extraction)
could cut OpenAI spend by ~70–80% on those workers with little quality loss.
Keep `gpt-4o` for `scorer` where eval quality matters.

**Cost: LOW — under an hour.**
- Add `model: str` parameter to `chat()` in `openai_client.py`.
- Each worker reads its env var at module level and passes it.
- Update `.env.example` and `docker-compose.yml`.

**Risk: VERY LOW.** Easy to revert by changing the env var.

**Recommendation: pair with §3.1 in the same PR.**

---

### 3.3 Streamlit (or similar) test dashboard

**What.** Port the spirit of `hira_test_v2.py` — a simple web UI that lets a
developer test each task with sample data, paste a CV / JD, see structured
output, no Redis needed.

**Value: MEDIUM.** Massively shortens prompt-iteration cycles. Today, tweaking
a prompt in `scorer.py` means rebuilding the worker container or running
ad-hoc Python. With a dashboard, it's "edit prompt → click Run → see JSON".

**Cost: MEDIUM — one full day.**
- New `workers/dev_dashboard/` folder (kept out of the prod image).
- ~200–400 LOC of Streamlit per task — much less than ATS-worker's 580 because
  we don't need the pretty styling.
- Wire each task's prompt-building code into a "Run" button.
- Add `streamlit` + `PyPDF2` to a `requirements-dev.txt` (not the runtime image).

**Risk: LOW.** Isolated from production. Worst case: stale dashboard if prompts
change and dashboard isn't updated — easily caught.

**Recommendation: build a minimal version first (one tab per task, no styling).
Expand only if it gets used.**

---

### 3.4 Async + concurrency for workers

**What.** Move from one-thread-per-worker-class to asyncio + a configurable
concurrency setting per worker. Each consumer pulls N messages and processes
them in parallel within the same process.

**Value: MEDIUM.** Today, scoring 100 applications in `score_bulk` is
serialized — that's 100 sequential OpenAI calls × ~3s each = 5 minutes of wall
time per bulk operation. With concurrency 10, that becomes ~30 seconds.

**Cost: MEDIUM — one to two days.**
- Rewrite `BaseWorker.run()` to use `asyncio` and `aiohttp`/the async OpenAI
  client.
- Switch `openai` SDK calls to `await client.chat.completions.create(...)`.
- Add `WORKER_CONCURRENCY` env var per worker.
- Test PEL/ACK behavior under concurrency — make sure we don't ACK before
  completion.
- Watch DB pool size; SQLAlchemy session needs to be created per task, not per
  worker.

**Risk: MEDIUM.** Threading bugs and DB connection exhaustion are easy to
introduce. Needs careful testing of failure paths.

**Recommendation: do this once §3.1 and §3.2 are stable. Don't rush.**

---

### 3.5 Automatic retry / claim of stale messages

**What.** Use `XAUTOCLAIM` to reclaim messages stuck in the PEL beyond a
threshold (e.g. 5 minutes idle), with a max-retry counter stored in the message
body. Drop or move to DLQ after N retries.

**Value: HIGH** for production hardening.

**Cost: MEDIUM — half a day to one day.**
- ~50 LOC of reclaim logic in `BaseWorker`.
- A new `hira:jobs:dlq` stream for poisoned messages.
- Logic to inspect and replay DLQ items (admin script).

**Risk: MEDIUM.** Retry loops on a poisoned message that always fails will
burn OpenAI quota. Need a hard max-retry and DLQ.

**Recommendation: ship this before going to real production scale. Not urgent
for early users, critical at volume.**

**Alternative:** Migrate to BullMQ entirely — see §3.7.

---

### 3.6 Structured logging

**What.** Replace `print(...)` everywhere with the `logging` module (or
`structlog`) and JSON-formatted output. Include `worker`, `application_id`,
`job_id`, `message_id`, `duration_ms`, `tokens_in`, `tokens_out`.

**Value: MEDIUM-HIGH.** Today, debugging a stuck job means scrolling through
unstructured `print` output. Structured logs unlock log aggregation, alerting,
cost tracking per worker.

**Cost: LOW — a few hours.**
- Add `logging.basicConfig(format=json_formatter)` to `main.py`.
- Replace `print(...)` with `logger.info(...)`. Mechanical change.

**Risk: VERY LOW.**

**Recommendation: do whenever convenient. Independent of everything else.**

---

### 3.7 Migrate from Redis Streams to BullMQ

**What.** Drop `XADD`/`XREADGROUP` everywhere and use BullMQ for the queue.
Python workers consume via `bullmq-python`; the Node API enqueues via standard
BullMQ.

**Value: HIGH** — automatic retries, returnvalue storage, dashboards (Bull
Board), priority queues, delayed jobs, all for free.

**Cost: HIGH — three to five days.**
- Backend (Node) needs to be rewritten to enqueue via BullMQ instead of
  publishing to streams.
- Every worker's stream-consumption code needs replacing.
- The self-orchestration pattern (worker A publishes to stream B) becomes
  worker A returns a value and Node decides whether to enqueue B — or workers
  enqueue follow-ups themselves via BullMQ.
- Migration window: existing in-flight messages need to drain or be replayed.

**Risk: MEDIUM-HIGH.** Touches every worker AND the backend. Wrong move during
a busy period could lose jobs.

**Recommendation: only worth it if we hit serious retry/observability pain.
For now, §3.5 (manual reclaim + DLQ) is a cheaper way to get most of the
benefit.**

---

### 3.8 Stateless worker mode (optional, for some tasks)

**What.** Refactor specific workers (`job_analyzer`, `question_generator`,
maybe `early_rejection`) to be pure transforms that return their result
instead of writing to the DB. The API takes the returnvalue and persists.

**Value: LOW-MEDIUM.** Improves testability of those specific workers. Doesn't
fit `resume_parser` or `scorer` which legitimately need DB access (parsed
profile is stored, score is stored, stage transitions happen).

**Cost: MEDIUM — one day per worker.**
- Change worker to return dict instead of writing.
- Add API endpoint or queue listener for the returnvalue.
- Update tests.

**Risk: LOW.** Selective rollout; one worker at a time.

**Recommendation: low priority. Only worth it if test pain becomes blocking.
The Streamlit dashboard (§3.3) achieves most of the same testability benefit
with less architectural change.**

---

### 3.9 Adopt LangChain across the board

**What.** Rewrite all OpenAI calls through `langchain-openai` and use
LangChain chains (retrieval, output parsers, etc.) wherever they fit.

**Value: LOW.** We don't use chains, retrieval, or any LangChain feature
beyond what `with_structured_output` gives us — and that's available natively
via OpenAI's structured outputs.

**Cost: MEDIUM — couple of days for a full rewrite.**

**Risk: MEDIUM.** Adds a heavyweight dependency that breaks often. LangChain
release cadence is aggressive; we'd need to pin and update carefully.

**Recommendation: skip. Use OpenAI's native structured outputs (§3.1) instead
— same benefit, no framework lock-in.**

---

## 4. Prioritized roadmap

| Order | Item | Cost | Value | Notes |
|------:|------|:-----|:------|:------|
| 1 | §3.1 Pydantic structured outputs | Half day | HIGH | Single biggest correctness win |
| 2 | §3.2 Per-worker model env vars | <1 hour | MED-HIGH | Pair with §3.1 in the same PR |
| 3 | §3.6 Structured logging | Few hours | MED-HIGH | Independent, do anytime |
| 4 | §3.3 Streamlit test dashboard | 1 day | MED | Big DX win for prompt work |
| 5 | §3.5 PEL reclaim + DLQ | 1 day | HIGH | Before serious production load |
| 6 | §3.4 Async + concurrency | 1–2 days | MED | After §3.1 stable |
| 7 | §3.7 BullMQ migration | 3–5 days | HIGH | Only if §3.5 proves insufficient |
| — | §3.8 Stateless workers | per worker | LOW-MED | Skip unless testing pain blocks us |
| — | §3.9 Full LangChain adoption | 2+ days | LOW | Skip — no clear benefit |

---

## 5. What we will explicitly NOT take

- **Single-queue + dispatch-by-name pattern.** Our multi-stream model is
  cleaner for monitoring, scaling, and per-task tuning. Don't collapse it.
- **Putting weights in the payload.** Our DB-resolved weights are a feature,
  not a limitation — one source of truth, easy to change per org without
  touching the backend or the workers.
- **Backend-driven pipeline orchestration.** Self-orchestrating workers are
  one of Hira's better choices; don't push that complexity to Node.
- **Skipping PDF extraction in the worker.** Pushing it upstream duplicates
  logic across the API and any test harness. Keep it in the worker.
- **`gpt-4o-mini` for the scorer.** Scoring is where eval quality matters
  most; the cost savings here are not worth the quality risk. Use mini for
  early rejection and JD analysis only.

---

## Appendix: ATS-worker file map

- `worker.py` — BullMQ Worker, dispatcher, signal handling
- `config.py` — env loading, `ChatOpenAI` singleton (`gpt-4o-mini`)
- `parse_resume.py` — `ParsedResume` Pydantic model + async handler
- `analyze_jd.py` — `AnalyzedJobDescription` model + handler
- `rank_candidate.py` — `CandidateScore` model + handler, weights from payload
- `generate_interview_questions.py` — `InterviewQuestions` model + handler
- `hira_test_v2.py` — Streamlit dashboard (~580 LOC, four tabs, full UI)
- `__init__.py` — broken imports from non-existent `tasks/` package; unused
- `.gitignore` — standard Python ignores
