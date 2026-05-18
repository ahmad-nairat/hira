# Hira API

The central backend. Handles auth, business rules, persistence, and publishes events to Redis Streams for the workers to consume.

| | |
|---|---|
| **URL (dev)** | http://localhost:3000 |
| **URL (prod)** | `api.hira-ats.com` |
| **Spec** | `api/CLAUDE.md` |

---

## Stack

| Concern | Library |
|---|---|
| Runtime | Node.js 20 LTS, TypeScript (strict) |
| Framework | Express 5 |
| ORM | TypeORM + PostgreSQL 16 |
| Validation | Zod |
| DI | tsyringe |
| Auth | jsonwebtoken + bcrypt + passport-google-oauth20 + cookie-parser |
| Queue | ioredis (Redis Streams XADD) |
| File storage | @aws-sdk/client-s3 (Cloudflare R2) |
| Email | Nodemailer |
| Real-time | Server-Sent Events (in-memory connection map) |

---

## Architecture — four layers

```
src/API/            HTTP only. Controllers, routes, middlewares.
src/application/    Business rules. Services + errors. Depends on repo interfaces only.
src/core/           Domain. Entities, DTOs, repo interfaces. No framework imports.
src/infrastructure/ Implementations. TypeORM repos, R2, Redis, Nodemailer, DI container.
src/server.ts       Bootstrap: env validation, DB init, route mount, graceful shutdown.
```

Never import across layers in the wrong direction.

---

## Run

```bash
docker compose up -d api
```
Builds the multi-stage Dockerfile, runs `node dist/server.js` on port 3000. `GET /health` returns `{ "status": "ok" }`. Env values come from the root `.env`.

---

## Build, typecheck, migrate, seed

```bash
npm run typecheck                 # tsc --noEmit
npm run build                     # tsc -p tsconfig.json → dist/

npm run migration:generate -- src/infrastructure/database/migrations/NAME
npm run migration:run
npm run migration:revert

npm run seed                      # demo org, 4 users, 1 job, 2 candidates
```

`NODE_ENV=development` uses `synchronize: true` (TypeORM creates schema from entities on boot). `NODE_ENV=production` disables synchronize and runs pending migrations at startup instead.

---

## Layer map (key files)

```
src/
├── API/
│   ├── controllers/        ← one per domain, all @injectable() with arrow methods
│   ├── middlewares/        ← async-handler, authenticate, requireOrgMember,
│   │                         authorizeOrgRole, validate, error, logging
│   ├── routes/             ← one per domain; each extends BaseRoute
│   ├── types/express.d.ts  ← augments Request with user/membership/validated
│   └── index.ts            ← AppServer: middleware + route registration
├── application/
│   ├── errors/             ← AppError + http.errors.ts
│   └── services/           ← business logic per domain
├── core/
│   ├── entities/           ← TypeORM entity classes + enums
│   ├── dtos/               ← Zod schemas + Read DTO types + mappers
│   └── repo-interfaces/    ← I*Repo interfaces (services depend on these)
├── infrastructure/
│   ├── database/data-source.ts
│   ├── database/migrations/
│   ├── database/seed.ts
│   ├── di/tokens.ts
│   ├── di/container.ts
│   ├── repos/              ← TypeORM implementations of I*Repo
│   └── services/           ← Queue (Redis), File (R2), Mail (SMTP), SSE
└── server.ts
```

---

## Routes (mounted under `/api/v1`)

| Path | Auth |
|---|---|
| `/auth/*` | mixed |
| `/onboarding/*` | authenticated |
| `/orgs/:orgId/*` | authenticated + org member |
| `/orgs/:orgId/jobs/*` | authenticated + org member |
| `/orgs/:orgId/candidates/*` | authenticated + org member |
| `/orgs/:orgId/applications/*` | authenticated + org member |
| `/orgs/:orgId/interviews/*` | authenticated + org member |
| `/orgs/:orgId/notifications/*` | authenticated + org member (SSE `/stream` accepts `?token=` query param) |
| `/offers/*` | public — token-scoped |
| `/public/*` | public — for the careers site |

Role rules are enforced via `authorizeOrgRole(...)` middleware AND re-checked inside services. The frontend's `usePermission()` is for UX only.

---

## Background work

The API publishes to Redis Streams via `IQueueService`. Workers (`workers/`) consume them.

| Stream | When | Payload |
|---|---|---|
| `hira:jobs:analyze` | Job published / republished | `{ job_id, org_id }` |
| `hira:jobs:early_reject` | New application submitted (not blacklisted) | `{ application_id, job_id, org_id }` |
| `hira:jobs:score_bulk` | Recruiter clicks Rescore (or republish with outdated scores) | `{ job_id, org_id, bulk: true }` |
| `hira:jobs:reevaluate_rejections` | Recruiter clicks Re-evaluate rejections | `{ job_id, org_id, bulk: true }` |
| `hira:jobs:generate_questions` | Question generation requested | `{ application_id, job_id, org_id, interview_id?, instructions?, generated_by }` |

`hira:jobs:parse_resume` and `hira:jobs:score` are published by workers themselves, not the API.

---

## Environment

See root `.env.example`. Required vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, `R2_*`, `SMTP_HOST`. Optional: `GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL` (for Sign-in-with-Google), `R2_PUBLIC_URL` (for resume URLs).

The env validator (Zod) runs at startup and exits with a useful message if anything required is missing.
