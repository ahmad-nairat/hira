# Hira ATS

Hira is a multi-tenant, AI-powered Applicant Tracking System. Four services live in this repo and run side-by-side under Docker Compose:

| Service | Stack | Path | Default port |
|---|---|---|---|
| **API** | Node.js 20, TypeScript, Express 5, TypeORM | [`api/`](./api) | 3000 |
| **Workers** | Python 3.12, SQLAlchemy, OpenAI, Redis Streams | [`workers/`](./workers) | — (background) |
| **Platform** (HR-facing) | Vite 5 + React 18 + TypeScript + Tailwind, served by nginx | [`platform/`](./platform) | 5173 |
| **Public App** (candidate-facing) | Next.js 14 (App Router) + TypeScript + Tailwind | [`public-app/`](./public-app) | 3001 |

Postgres 16 and Redis 7 run as containers alongside.

See [`PROJECT.md`](./PROJECT.md) for the full product spec, plus the per-service READMEs and `CLAUDE.md` files for build details.

---

## 1. Prerequisites

Just **Docker** and **Docker Compose**. Everything else (Node, Python, Postgres, Redis, nginx) runs inside containers — nothing else to install.

```bash
docker --version
docker compose version
```

If you want to hack on a single app outside Docker, also install Node 20+ for `api/`, `platform/`, and `public-app/`, or Python 3.12+ for `workers/`. See each app's README.

---

## 2. First-time setup

```bash
cp .env.example .env
# Fill in the required secrets — see section 5 below.

docker compose build
docker compose up -d

# Tail everything
docker compose logs -f api workers platform public-app
```

Then seed the demo data:
```bash
docker compose exec api node -e "require('./dist/infrastructure/database/seed.js')"
```

Open:
- **HR app** → http://localhost:5173 (sign in with one of the demo accounts)
- **Public site** → http://localhost:3001 (marketing landing)
- **Demo careers page** → http://localhost:3001/careers/hira-demo
- **API health** → http://localhost:3000/health

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@hira.com | Admin1234! |
| Recruiter | recruiter@hira.com | Recruiter1234! |
| Hiring Manager | hm@hira.com | Manager1234! |
| Interviewer | interviewer@hira.com | Interview1234! |

---

## 3. Day-to-day commands

```bash
docker compose up -d                # start everything
docker compose down                 # stop containers (volumes survive)
docker compose down -v              # stop + wipe Postgres / Redis volumes too

docker compose logs -f api          # tail one service
docker compose restart api          # restart after rebuild

# Rebuild after code changes:
docker compose build api workers platform public-app && docker compose up -d
```

---

## 4. Architecture in one diagram

```
                    ┌─────────────────────────────────┐
                    │            Postgres             │
                    │     (source of truth)           │
                    └────────────┬────────────────────┘
                                 │ read/write
                 ┌───────────────┴───────────────┐
                 │                               │
          ┌──────▼──────┐                 ┌──────▼──────┐
          │     API     │ ── publish ───▶ │   Redis     │
          │  (Express)  │                 │  Streams    │
          └──────┬──────┘                 └──────┬──────┘
                 │                               │ consume
        HTTP+SSE │                               │
       ┌─────────┴────────┐                ┌─────▼─────┐
       │                  │                │  Workers  │
  ┌─────▼─────┐     ┌─────▼──────┐         │  (Python) │
  │ platform  │     │ public-app │         └─────┬─────┘
  │   (HR)    │     │  (jobs +   │               │ R2 (resumes)
  │           │     │   offers)  │               ▼
  └───────────┘     └────────────┘         Cloudflare R2
```

Event streams (API → workers): see [`api/README.md`](./api/README.md#background-work).

---

## 5. Required secrets — how to get them

Every value below must be set in your `.env` before `docker compose up`. Defaults that are safe in dev are already in `.env.example`; the rest are blank and explained here.

### JWT_ACCESS_SECRET, JWT_REFRESH_SECRET — **required**
Random 32+ character strings used to sign access and refresh JWTs. Generate two **different** values:
```bash
openssl rand -hex 32
openssl rand -hex 32
```
Paste each into `.env`.

### OPENAI_API_KEY — **required** for any AI feature
Used by the workers (job analysis, early rejection, resume parsing, scoring, question generation).
1. https://platform.openai.com/api-keys
2. Sign in (or create an account at https://platform.openai.com/signup)
3. **Create new secret key** → name it `hira-workers` → copy the value (starts with `sk-…`)
4. Make sure your OpenAI account has a payment method on file — the workers use `gpt-4o`
5. Paste into `.env` as `OPENAI_API_KEY`

### Cloudflare R2 — **required** for resume uploads and AI parsing
Used by the API to upload resumes and by the Resume Parser worker to download them. R2 is S3-compatible — we use the AWS SDK.
1. Sign in to https://dash.cloudflare.com
2. Open **R2** (you'll be prompted to enable R2; it has a free tier)
3. Create a bucket named `hira-uploads` (or anything; just match `R2_BUCKET`)
4. From **R2 → Overview**, copy the **S3 API → Account ID** and put it in `R2_ENDPOINT`:
   ```
   R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   ```
5. **R2 → Manage R2 API Tokens** → create an **Account API token** with **Object Read & Write** scope:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
6. For `R2_PUBLIC_URL`, either enable **R2.dev public bucket** (use the `https://pub-xxxxxxxxxxxx.r2.dev` URL) or attach a custom domain (R2 → Bucket → Settings → Custom Domains).

### SMTP — **required** for invite + offer emails
Any SMTP provider works. Recommended for dev:
- **Mailtrap** (https://mailtrap.io, free sandbox) — gives you `SMTP_HOST=sandbox.smtp.mailtrap.io`, `SMTP_PORT=2525`, plus `SMTP_USER`/`SMTP_PASS` from your inbox settings. Nothing actually leaves Mailtrap.
- Production: SendGrid, Postmark, AWS SES, Mailgun, or your company's relay.

Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. If `SMTP_USER`/`SMTP_PASS` are blank, the API skips authentication (useful for some self-hosted relays).

### Google OAuth — *optional*
Skip unless you want "Sign in with Google". Email/password auth works without it.
1. https://console.cloud.google.com/apis/credentials
2. Create a project (or pick one)
3. **Create credentials → OAuth client ID → Web application**
4. Add **Authorised redirect URIs**:
   - `http://localhost:3000/api/v1/auth/google/callback` (dev)
   - `https://api.your-domain.com/api/v1/auth/google/callback` (prod)
5. Copy the **Client ID** → `GOOGLE_CLIENT_ID`, **Client secret** → `GOOGLE_CLIENT_SECRET`
6. Set `GOOGLE_CALLBACK_URL` to match exactly

---

## 6. The services

### API (`api/`)

Express 5 / TypeScript backend organised into four layers (API · application · core · infrastructure). Handles auth (JWT + Google OAuth), org lifecycle, the full hiring pipeline with stage-transition rules, AI worker triggers via Redis Streams, R2 resume uploads, real-time notifications via SSE.

→ [`api/README.md`](./api/README.md) for run, build, routes, and architecture.

### Workers (`workers/`)

Six Python 3.12 services. Five consume Redis Streams (`job-analyzer`, `early-rejection`, `resume-parser`, `scorer`, `question-generator`) as daemon threads in one container; the sixth (`domain-checker`) is a `cron` job running every two hours inside the same image. All call OpenAI `gpt-4o` for AI work and the same Postgres the API owns.

→ [`workers/README.md`](./workers/README.md) for run, schema coupling, and error semantics.

### Platform — HR-facing (`platform/`)

The single-page app HR teams (Admin / Recruiter / Hiring Manager / Interviewer) use daily. React 18 + Vite + React Router v6 + TanStack Query + Zustand + Tailwind. Drag-and-drop form builder, Kanban + table pipeline views, full settings (members, domain verification, branding, scoring, danger zone), real-time notifications over SSE. Served by nginx in the Docker image.

### Public App — candidate-facing (`public-app/`)

The marketing landing page, every org's branded careers page, job detail and application pages, and the candidate offer flow. Next.js 14 App Router + Tailwind. Server-rendered for SEO. No authentication anywhere. Pulls org branding into CSS custom properties so every careers page uses the org's colours and copy.

---

## 7. Project layout

```
hira/
├── PROJECT.md              ← product spec (business rules, roles, pipeline)
├── README.md               ← you are here
├── docker-compose.yml      ← postgres + redis + api + workers + app + public
├── .env.example            ← single env file consumed by docker compose
├── api/
│   ├── CLAUDE.md           ← API build instructions
│   ├── README.md           ← API run / architecture
│   ├── Dockerfile
│   └── src/                ← API + application + core + infrastructure + server.ts
├── workers/
│   ├── CLAUDE.md           ← workers build instructions
│   ├── README.md           ← workers run / errors
│   ├── Dockerfile + docker-entrypoint.sh + crontab
│   └── src/                ← 6 workers + db + services + utils
├── platform/
│   ├── Dockerfile + nginx.conf
│   ├── index.html, vite.config.ts
│   ├── tailwind.config.ts, postcss.config.js
│   └── src/                ← React app
└── public-app/
    ├── Dockerfile
    ├── next.config.mjs
    ├── tailwind.config.ts, postcss.config.cjs
    └── src/                ← App Router pages + components + lib + types
```

---

## 8. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `Invalid environment` on API start | A required env var is missing — recheck `.env` against `.env.example`. |
| API can't connect to Postgres on first boot | The healthcheck needs ~10s. `docker compose logs postgres` to confirm. |
| Workers log `BUSYGROUP Consumer Group name already exists` | Harmless — the workers swallow this on startup. |
| OpenAI errors | Key invalid, missing payment method, or rate-limited. Test with `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`. |
| R2 uploads fail with 403 | API token scope wrong — recreate with **Object Read & Write** on the right bucket. |
| Resume parser fails on a scanned PDF | `pdfminer.six` can't OCR. The message stays in the PEL for inspection. |
| Domain checker doesn't run | Cron output is at `/var/log/domain_checker.log` inside the workers container. The entrypoint tails it to stdout. |
| Vite dev server can't talk to API | `VITE_API_URL` mismatch, or `APP_URL` in API env doesn't include your dev origin. |
| Next.js build complains `NEXT_PUBLIC_*` env missing | Both `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` are baked at build time — set them on the build args (already wired in `docker-compose.yml`). |
| SSE notifications never arrive | Browser EventSource can't send Authorization headers; the app passes `?token=` in the URL and the API's authenticate middleware accepts it. Check Network → EventStream for the open connection. |

---

## 9. Production notes

- The Docker Compose stack here is suitable for dev and small single-host prod. For real prod, use managed Postgres, managed Redis, and a real container platform (k8s, Fly, Render, etc.).
- In `NODE_ENV=production`, the API disables TypeORM `synchronize` and runs pending migrations at boot. Generate migrations with `npm run migration:generate` in `api/`.
- The Vite app is served as a static bundle by nginx. The Next.js app uses `next start` (Node runtime). Both can sit behind a CDN.
