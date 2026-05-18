# Hira ATS

Hira is a multi-tenant, AI-powered Applicant Tracking System built as a SaaS platform. It helps HR teams post jobs, collect applications, evaluate candidates using AI, manage a hiring pipeline, and extend offers — all from a single workspace.

Each company that signs up gets its own isolated workspace (org). Hira serves the internal HR team through a web application and exposes each org's open positions through a public-facing careers page that is branded to the org.

---

## Table of Contents

1. [Roles & Permissions](#roles--permissions)
2. [Features](#features)
3. [Hiring Pipeline](#hiring-pipeline)
4. [Job Creation](#job-creation)
5. [System Components](#system-components)
6. [Orchestration Between Components](#orchestration-between-components)
7. [Business Rules & Constraints](#business-rules--constraints)

---

## Roles & Permissions

Every user belongs to exactly one org. Within that org they hold one of four roles.

---

### Admin
Full control over the org. Admins can do everything a Recruiter and Hiring Manager can do, plus:
- Manage org settings (name, slug, logo, branding)
- Verify the org's email domain
- Configure auto-join and default role for auto-joined members
- Invite users by email (even if the email is not yet registered)
- Approve or reject access requests from users who self-registered with the org's domain
- Assign and change member roles
- Remove members from the org
- Configure org-wide default scoring weights
- Transfer org ownership
- Delete the org - wipe all data and delete all members account.

Admin can be assigned as interviewer for any job by a themself or by a recruiter/hiring manager. In this case they can act as an interviewers (submit a feedback)

---

### Recruiter
Owns the hiring process for jobs they are assigned to. Recruiters can:
- Create, edit, publish, close, and archive jobs they are assigned to
- Build the application form for each job
- Define early rejection criteria and AI scoring instructions per job
- Override org-wide scoring weights per job
- View and manage all candidates in the candidate pool (no scoping)
- Manually add candidates to the pool or directly to a specific job (add a candidate to a specific job will send him a link to apply. will not add him actually to the job till he self apply to fill the form and provide updated resume)
- Suggest any candidate to any job (sends an email to the candidate with the job page link so he can apply)
- Blacklist candidates with a reason and duration (duration is optional. null means for ever)
- Move candidates through the pipeline for their assigned jobs
- Reject candidates at any stage (mandatory note required)
- Schedule interviews and assign interviewers for their jobs
- Add notes to any application on their jobs
- Create and send offers
- Mark candidates as hired
- Re-trigger AI scoring and re-evaluate early rejections for their jobs (only when they flagges as outdated caused by a change)
- View the full candidate profile including AI scores, notes, and all feedback

Recruiter can be assigned as interviewer for any job by a recruiter/hiring manager, or assign themself for jobs they own. In this case they can act as an interviewers (see interviews page and submit a feedback)

---

### Hiring Manager
Supports the recruiter in evaluating candidates for jobs they are assigned to. Hiring Managers can:
- View all candidates in the candidate pool (no scoping)
- View applications and pipeline for their assigned jobs
- Assign interviewers to interviews on their jobs
- Give feedback on interviews (if they were the interviewer)
- Add notes to applications on their assigned jobs
- Approve or reject candidates — but only from the Review stage
- View full candidate profiles including AI scores, notes, and all feedback for their jobs

Hiring Managers cannot create jobs, send offers, or mark candidates as hired.
Hiring Managers can be assigned as interviewer for any job by a arecruiter/hiring manager, or assign themself for related jobs. In this case they can act as an interviewers (see interviews page and submit a feedback)

---

### Interviewer
A focused role for people who only participate in interviews. Interviewers can:
- View only the interviews they have been assigned to
- View the candidate's name, resume, and parsed profile for candidates they are interviewing — only while that candidate is in the Interview or Specialist Interview stage
- Read notes left by other users on applications they are assigned to (because notes may contain instructions from the recruiter about what to explore during the interview)
- Submit interview feedback for their own interviews
- View and update answers to interview questions for their own interviews
- Request AI-generated interview questions for their assigned interviews (they will provide a text that will be added to the AI prompt to generate the question, this text could be used for quesiton scoping, instructions, or any special needs. e.g. the questions should be about system design)

Interviewers cannot see: AI scores, other users' interview feedback, stage history, or any candidate data outside of their assigned interviews.

---

## Features

### Org & Team Management
- Orgs are created on sign-up and have a unique slug used in the app URL and careers page URL
- Admins can verify their company email domain by adding a DNS TXT record; Hira checks it automatically
- Once a domain is verified, admins can enable auto-join so that anyone registering with that email domain is automatically added to the org with a default role
- If auto-join is disabled, users with a verified domain see a request-access flow and wait for admin approval
- Users registered with email of this verified domain cannot create a new Org.
- Admins can invite any email address to the org; if the email is not yet registered, the user sees the invite upon their first login
- Each user can belong to only one org at a time
- if a user registered with email that doesn't belong to any Org's verified domain -> he can create org even if he has an invitation to join an existing Org. if both options was enabled (create/join org), he can only pick one as the previous rule (users belongs to only one Org).

### Job Posting
- Jobs are created through a 5-step wizard: general information, application form, early rejection criteria, AI scoring instructions, and scoring weights
- Job description is a rich text document (similar to Notion) supporting headings, bullets, bold, italic, code blocks, dividers, and info panel.
- Jobs can be saved as drafts and published when ready
- A published job appears on the org's public careers page automatically
- Each job has one assigned recruiter and one assigned hiring manager. assigning hiring manager could be skipped temporary till the review stage.

### Application Form Builder
- Recruiters design a fully custom form that candidates fill out when applying
- The form supports: short text, long text, number, dropdown, checkbox, radio buttons, date, and file upload field (only one file is accepted and it's dedicated for the resume)
- Fields can be grouped into sections. each section has a title
- Each field supports basic validation: required, minimum/maximum value, type constraints
- Every form must include exactly one file field marked as the resume field; the recruiter controls its label and position in the form
- The form structure is part of the job's public-facing content — changes to it move a published job back to draft.

Keep in mind that not all job application will be the same as the recruiter could add extra fields after some candidates already applied to that jon.

### AI Scoring & Criteria
- Recruiters write early rejection criteria in plain English, one per line (or string[]) (e.g. "Expected salary above 5000 USD"). These are evaluated by AI against the form answers before the resume is even parsed. Candidates who match any criterion are automatically rejected without their resume being scored.
- Recruiters write scoring instructions in plain English, one per line (or string[]) (e.g. "Add 5 points for any candidate with banking experience"). These influence AI scoring but do not disqualify candidates.
- Scoring weights control how the AI distributes the 100-point score across Education, Skills, Experience, and Certifications. Weights can be set at the org level as a default and overridden per job.

### Candidate Pool
- All candidates who have ever applied, been manually added, or been suggested to a job are stored in the org's candidate pool
- A candidate is a single record even if they applied to multiple jobs; each job application is a separate Application record linked to that candidate
- For each job application, we should try to match it with a candidate using phone number or email with the name before creating a new candidate
- The pool shows the highest AI score across all of a candidate's applications as a display tag
- Candidates can be blacklisted with a reason and a duration (6 months, 12 months, permanent, or a custom expiry date). Blacklisted candidates are automatically moved to the Blacklisted stage on any new application.
- Candidates marked as hired are flagged in the pool so they are not suggested for future roles

### Hiring Pipeline Feature
Each application moves through a defined set of stages. See the [Hiring Pipeline](#hiring-pipeline) section below for full details.

### Interviews
- Recruiters and Hiring Managers can schedule interviews within the pipeline
- Interviews can be online or in-person
- When scheduling, the system can notify the candidate by email and create a Google Calendar event for internal users. we should not notify candidate automatically until the recruiter/hiring manager clicks on "Send Interview Email"
- Any user in the org (including Admins, Recruiters, and Hiring Managers) can be assigned as an interviewer for a specific interview, regardless of their role. The Interviewer role is for users whose only function is to conduct interviews.
- Interviewers can generate AI-powered questions tailored to the candidate's parsed profile and the job description, with optional custom instructions (e.g. "Focus on behavioral questions")
- Generated questions are stored and attached to the application. Interviewers can add the candidate's answers to each question (optional).
- Interviewers submit structured feedback: a 1–5 rating, written notes, and a hiring recommendation (Strong Yes / Yes / Neutral / No / Strong No)

### Offers
- Once a Hiring Manager approves a candidate (from the Review stage), the recruiter can create an offer
- The offer form captures: salary, currency, start date, contract type, and a custom welcome message
- The recruiter sends the offer with a single click; the system emails the candidate a secure link valid for 24 hours
- The candidate visits the link to view the offer details and accept or decline
- If the link expires, the candidate can enter their email on the expired-link page and the system resends a fresh link if an active offer exists for that email
- Offer acceptance moves the candidate to the Offer Accepted stage; the recruiter can then mark them as Hired

### Notifications
- All notifications are delivered in real-time via Server-Sent Events (SSE)
- Notification triggers: being assigned to a job or interview, a Hiring Manager approving a candidate, new interview feedback on a candidate, a candidate accepting or declining an offer
- Notifications are stored and can be marked as read

### Careers Page
- Every org automatically gets a public careers page at `www.hira-ats.com/careers/[org-slug]`
- The page lists all open jobs and is branded with the org's colors, logo, hero headline, hero subheadline, hero background, and CTA button label — all configurable from the Branding settings
- Candidates can browse open jobs, read job descriptions, and submit applications directly from the careers page
- The careers page and all candidate-facing pages are built as a separate Next.js application served from `www.hira-ats.com`

---

## Hiring Pipeline

Every application passes through a fixed set of stages. The system enforces which transitions are allowed.

### Stages

| # | Stage | Type | Description |
|---|---|---|---|
| 1 | **Early Rejection** | Auto / Exit | Candidate's form answers matched one or more rejection criteria. Rejected before resume parsing. Candidate is not notified automatically — the recruiter can choose to notify manually, in bulk, and with a delay. |
| 2 | **Blacklisted** | Auto / Exit | Candidate is on the org's blacklist. Application is automatically closed. |
| 3 | **AI Evaluation** | Auto | AI is actively processing the application (parsing resume, scoring). No manual moves allowed from this stage. |
| 4 | **Screening** | Human | Human review stage. Phone calls, manual resume review, or any other assessment. Actions in this stage are not tracked. Recruiters and HMs can add notes. |
| 5 | **Interview** | Human / Optional | A tracked interview. Can be with any internal user. Recruiter plans the meeting, notifies the candidate, and assigns an interviewer who submits structured feedback. |
| 6 | **Specialist Interview** | Human / Optional | A second tracked interview, typically with a Hiring Manager or specialist. Same mechanics as Interview. Any Hiring Manager in the org can be assigned, not just the job's assigned HM. |
| 7 | **Review** | Human | Holding stage for the Hiring Manager to make a decision. The HM can approve (→ HM Approved) or reject from this stage only. The recruiter can only reject here. Candidates can be returned to Interview or Specialist Interview for further evaluation; new feedback is appended, not overwritten. |
| 8 | **HM Approved** | Human | Hiring Manager approved the candidate. Recruiter must create an offer before advancing. Recruiter still can reject from this stage |
| 9 | **Offer Sent** | Human | Offer has been emailed to the candidate. Awaiting their response. |
| 10 | **Offer Accepted** | Human | Candidate accepted the offer. Recruiter can mark as Hired. |
| 11 | **Hired** | Terminal ✅ | Candidate is hired. They are flagged in the candidate pool. |
| 12 | **Declined** | Terminal ❌ | Candidate declined the offer. |
| 13 | **Rejected** | Exit | Rejected by the recruiter or HM at any stage after AI Evaluation. A note is mandatory. Candidates can be returned to Interview, Specialist Interview, or Review. Rejection is recorded in history even if the candidate is later returned. |

### Transition Rules
- Recruiter or HM can reject a candidate at any stage after AI Evaluation. A note is always required.
- Returning a candidate from Rejected to an earlier stage appends new data — it never overwrites history.
- HM approval (Review → HM Approved) is only possible from the Review stage.
- A candidate cannot move from HM Approved to Offer Sent without a completed offer record.
- Hired, Declined, Early Rejection, and Blacklisted are terminal — no further transitions.

### Outdated Flags
When the recruiter changes **rejection criteria** on a published job, a flag (`has_outdated_rejections`) is set. This means candidates currently in Early Rejection and Screening may no longer be correctly evaluated against the new criteria. The recruiter can click a button to re-evaluate:
- Candidates in Early Rejection who now pass are moved back to AI Evaluation.
- Candidates in Screening who now fail are moved back to Early Rejection.

When the recruiter changes **scoring instructions, scoring weights, or the job description** on a published job, a flag (`has_outdated_scores`) is set. The recruiter can trigger a bulk rescore of all active pipeline candidates.

If a change is **public-facing** (title, description, location, type, salary, application form structure), the job is automatically moved back to Draft and must be explicitly republished. Rescoring does not happen until republish.

A job could be flagged with both outdated flags.

---

## Job Creation

Jobs are created through a 5-step wizard. All steps can be revisited and edited after creation.

| Step | Name | Required |
|---|---|---|
| 1 | General Info | Yes |
| 2 | Application Form | Yes |
| 3 | Early Rejection Criteria | Optional |
| 4 | AI Scoring Instructions | Optional |
| 5 | Scoring Weights | Optional (defaults to org settings) |

**Step 1 — General Info:** Title, rich text description, location, employment type (Full-time / Part-time / Contract / Internship), optional salary range.

**Step 2 — Application Form:** Drag-and-drop form builder with sections and typed fields. Exactly one field must be marked as the resume upload. Field-level validation rules can be set.

**Step 3 — Early Rejection Criteria:** Plain-English lines evaluated by AI against form answers on submission. These reject candidates before resume parsing and do not affect scores.

**Step 4 — AI Scoring Instructions:** Plain-English lines that influence how the AI scores candidates. Do not disqualify anyone — only adjust the score up or down.

**Step 5 — Scoring Weights:** Distribution of the 100-point score across Education, Skills, Experience, and Certifications. Must sum to 100%. Can be skipped to use the org's default weights.

---

## System Components

---

### 1. The API

The API is the central backend of the platform. It handles all business logic, authentication, data persistence, and orchestration of background work.

**Responsibilities:**
- Authentication (email/password and Google OAuth) with JWT access and refresh tokens
- Org lifecycle: creation, membership, domain verification, invites, access requests
- Job and form management including draft/publish logic and outdated flag management
- Candidate pool management and blacklist enforcement
- Application submission validation and initial stage assignment
- Pipeline movement with transition enforcement and history recording
- Interview scheduling and feedback management
- Offer creation, delivery, and response handling
- Notification creation and real-time delivery via SSE
- Publishing events to Redis Streams to trigger background workers
- Public careers page data endpoints (no auth required)
- Public offer endpoints (no auth required)
- File uploads to Cloudflare R2

**Key constraint:** The API performs one immediate DNS check when a domain is submitted for verification. All subsequent retries are handled by the Domain Checker worker.

---

### 2. The Workers

All workers are Python services. They consume jobs from Redis Streams, perform their work (typically calling OpenAI or doing I/O), and write results back to PostgreSQL. Workers run in Docker containers.

---

#### Worker 1 — Job Description Analyzer
**Trigger:** Published when a job is first published, or republished after a description change.
**Stream:** `hira:jobs:analyze`

Reads the job's title, description, scoring instructions, and scoring weights. Sends them to OpenAI and receives back a structured representation of the hiring criteria — essentially a machine-readable scoring rubric. Stores the result in the `JobAnalysis` table. This structured analysis is used by the Scorer worker instead of dealing with the raw job description.

---

#### Worker 2 — Early Rejection Evaluator
**Trigger:** Published on every new application submission. Also triggered in bulk when a recruiter clicks "Re-evaluate rejections."
**Stream:** `hira:jobs:early_reject`

Reads the application's form answers and the job's rejection criteria (plain-English lines). Sends them to OpenAI and asks: does this candidate match any rejection criterion? If yes, updates the application stage to `early_rejection` and stops. If no, publishes the application to the Resume Parser stream. In bulk re-evaluation mode, also checks candidates currently in the Screening stage against the updated criteria.

---

#### Worker 3 — Resume Parser
**Trigger:** Published by the Early Rejection Evaluator after a candidate passes the criteria check.
**Stream:** `hira:jobs:parse_resume`

Downloads the resume file from Cloudflare R2. Sends it to OpenAI and extracts a structured profile: skills (with proficiency level), work experience (title, company, dates, description), education (degree, institution, year), and certifications (name, issuer, year). Saves the structured profile to the Application record and also updates the Candidate record with the latest parsed data. After saving, publishes the application to the Scorer stream.

---

#### Worker 4 — Scorer
**Trigger:** Published by the Resume Parser after parsing completes. Also triggered in bulk by the API's rescore endpoint.
**Stream:** `hira:jobs:score` / `hira:jobs:score_bulk`

Reads the application's parsed profile, the job's structured analysis (from `JobAnalysis`), and the effective scoring weights (job-level if set, otherwise org-level). Sends them to OpenAI and requests a 0–100 score with a breakdown by dimension (education, skills, experience, certs). Saves the score and breakdown to the Application record, sets the application stage to `screening`, records the stage history entry (system-initiated move), and clears the `has_outdated_score` flag.

---

#### Worker 5 — Interview Question Generator
**Trigger:** Published on-demand when a user requests question generation.
**Stream:** `hira:jobs:generate_questions`

Reads the candidate's parsed profile, the raw job description, and any custom instructions provided by the requesting user (e.g. "Focus on behavioral questions, generate 10"). Sends them to OpenAI and receives a list of tailored interview questions. Saves the question set to the `GeneratedQuestions` table, linked to the application and optionally to a specific interview. Questions are stored with an empty answers array that can be filled in by the interviewer.

---

#### Worker 6 — Domain Checker (Cron)
**Trigger:** Cron job running every 2 hours inside the Docker container.
**No stream** — runs on a schedule, queries the database directly.

Queries all `OrgDomain` records where `status = 'pending'` and `submitted_at > NOW() - 72 hours`. For each domain, performs a DNS TXT lookup on `_hira-verify.<domain>` and checks whether the record contains the expected verification token (`hira-verify=<token>`). If verified, sets `status = 'verified'` and `verified_at`. Domains that remain unverified after 72 hours are set to `status = 'unverified'`.

---

### 3. The Application (Vite + React)

The main product interface. This is what HR teams use daily.

**URL:** `app.hira-ats.com`

**Served to:** Admin, Recruiter, Hiring Manager, and Interviewer roles.

**Key areas:**
- Authentication and onboarding (create org, join org, accept invite)
- Dashboard with activity feed and pending actions
- Jobs list, job creation wizard, job pipeline view (Kanban and table), job settings
- Candidate pool with search and filtering
- Candidate profile with full application history, AI scores, notes, interview feedback, and offer details
- Interview management (Interviewer role sees only their own interviews)
- Settings (Admin only): general, domain verification, members, invites, access requests, scoring weights, branding, danger zone
- Real-time notifications via SSE

**Interviewer experience:** Interviewers see a simplified interface with only their assigned interviews. They can view the candidate's resume and profile, generate questions, fill in answers, and submit feedback. They cannot see AI scores, other users' feedback, or stage history.

---

### 4. The Next.js Application

A separate public-facing application for candidates and visitors.

**URL:** `www.hira-ats.com`

**No authentication required** for any page in this app.

**Pages:**

**Marketing landing page (`/`):** Explains what Hira is, highlights AI features, shows pricing tiers, and drives sign-ups. Designed for HR managers and decision-makers.

**Careers page (`/careers/[org-slug]`):** Each org's branded public job board. Displays all open positions for that org. Fully themed with the org's primary color, secondary color, logo, hero headline, hero subheadline, hero background, and CTA button label. Includes job filtering by type and search.

**Job detail page (`/careers/[org-slug]/[job-id]`):** Full job description with apply CTA. Sidebar with job summary on desktop. Sticky apply button on mobile.

**Apply page (`/careers/[org-slug]/[job-id]/apply`):** Renders the exact custom form the recruiter built for this job. Validates answers client-side and server-side. Handles resume upload. Shows success or error state after submission.

**Offer page (`/offer/[token]`):** Candidate views their offer details and accepts or declines. Handles expired tokens by asking for email and resending. Shows appropriate states: valid offer, accepted, declined, expired.

---

## Orchestration Between Components

```
┌─────────────────────────────────────────────────────────────┐
│                        PostgreSQL                           │
│         (source of truth for all persistent data)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ read/write
                ┌──────────────┴──────────────┐
                │                             │
         ┌──────▼──────┐               ┌──────▼──────┐
         │    API      │               │   Workers   │
         │  (Node.js)  │               │  (Python)   │
         └──────┬──────┘               └──────┬──────┘
                │                             │
                │   publish events (XADD)     │ consume events (XREADGROUP)
                └──────────┐  ┌──────────────-┘
                           │  │
                    ┌──────▼──▼──────┐
                    │  Redis Streams │
                    │  (job queue)   │
                    └───────────────-┘

┌──────────────┐              ┌──────────────┐
│  Vite App    │──── HTTP ───▶│    API       │
│ (app.hira)   │◀─── SSE  ───│              │
└──────────────┘              └──────────────┘

┌──────────────┐              ┌──────────────┐
│  Next.js App │──── HTTP ───▶│    API       │
│ (www.hira)   │              │              │
└──────────────┘              └──────────────┘

┌──────────────┐              ┌──────────────┐
│   Workers    │── read/write▶│ Cloudflare   │
│              │              │     R2       │
└──────────────┘              └──────────────┘
```

**Event flow for a new application:**
1. Candidate submits form on the Next.js app → POST to API
2. API validates the form, creates the Application record, uploads resume to R2
3. API checks the blacklist — if blacklisted, stops here
4. API publishes an event to the `hira:jobs:early_reject` Redis Stream
5. Early Rejection Worker consumes the event, evaluates form answers against criteria
   - Rejected → updates stage to `early_rejection`, stops
   - Passes → publishes to `hira:jobs:parse_resume`
6. Resume Parser Worker downloads resume from R2, parses it, updates the Application and Candidate records, publishes to `hira:jobs:score`
7. Scorer Worker reads the parsed profile and job analysis, scores the candidate, updates the Application record, sets stage to `screening`

**Real-time notifications:**
The API creates a Notification record and pushes it to the SSE stream maintained for the recipient user. The Vite app holds an open SSE connection and renders incoming notifications instantly.

---

## Business Rules & Constraints

### Users & Membership
- A user can belong to **at most one org**. This is enforced at registration, invite acceptance, and auto-join.
- A user with an existing org membership cannot create or join another org.
- Roles are fixed: Admin, Recruiter, Hiring Manager, Interviewer. No custom roles.
- There is exactly **one Admin** who is the owner. Ownership can be transferred.

### Jobs
- Each job has exactly **one recruiter** and at most **one hiring manager**.
- A job cannot be published without a completed application form (with a resume field).
- Public-facing changes (title, description, location, type, salary, form structure) on a published job automatically move it back to **Draft** and require explicit republish.
- Non-public changes (rejection criteria, scoring instructions, scoring weights) on a published job set outdated flags instead of drafting.
- Rescoring and re-evaluation are always **manually triggered** by the recruiter — they never happen automatically in the background.

### Applications
- A candidate can apply to the same job **only once**. Duplicate applications are ignored (not stored). Identified usign the email or phonenumber
- A candidate can apply to multiple different jobs.
- Rejection notes are **mandatory** — no candidate can be moved to the Rejected stage without a note.
- The AI evaluation stage is **system-controlled** — no user can manually move a candidate out of it.
- A candidate cannot advance from HM Approved to Offer Sent **without a completed offer record**.
- Returning a candidate from Rejected to an earlier stage **never overwrites history** — all past decisions are preserved.
- A candidate marked as Hired is **flagged in the pool** to prevent them from being surfaced as a suggestion for future roles.

### Blacklist
- Blacklists are **org-scoped** — a candidate blacklisted by one org is not affected in another org.
- A blacklist entry can have an expiry date. Expired entries are treated as inactive.
- Blacklisted candidates are **automatically** placed in the Blacklisted stage on any new application. They do not go through AI evaluation.
- Removing a blacklist entry does not automatically reopen past applications.

### Offers
- Offer links are valid for **24 hours** only.
- Only one active offer can exist per application.
- The offer resend endpoint always returns a generic success response — it does not reveal whether the email address exists in the system.
- Once a candidate is marked as Hired, they cannot be moved back through the pipeline.

### Domain Verification
- The system makes one immediate DNS check when a domain is submitted.
- The Domain Checker worker retries every 2 hours for up to **72 hours** after submission.
- After 72 hours without verification, the domain entry is marked as **unverfied** and must be resubmitted.
- One org can verify multiple domains.
- A verified domain can only be associated with **one org**.
- The domain will be ignored till it's verified (users with email belongs to unverified domain can create org and can submit the same domain for another org. no one own the domain till it's verified)

### Interviews
- Any user in the org can be assigned as an interviewer for a specific interview — the Interviewer role is not required to conduct an interview.
- The Interviewer role exists for users whose **only function** is to conduct interviews. They have no access to the broader product.
- Interviewers can only see candidates during the Interview or Specialist Interview stages. Once a candidate moves past those stages, the interviewer loses access to their profile.
- An interviewer can see notes (which may include instructions from the recruiter) but cannot see AI scores, other users' feedback, or stage history.

### AI & Scoring
- Scores are always out of 100.
- Scoring weights (Education + Skills + Experience + Certifications) must always sum to 100%.
- AI decisions (early rejection, scoring) are based on the data available at the time the worker runs. Changing criteria or instructions later does not retroactively update past decisions — the recruiter must manually trigger re-evaluation.
- AI early rejection is based on **form answers only** — the resume is not parsed before this check.
- Interview questions are generated per-request and are not shared across interviews unless the same question set is explicitly viewed.

### Notifications
- Notifications are delivered in real-time via SSE. If the user is not connected, the notification is stored and shown on next load.
- Notification types are fixed: assignment, HM approval, new feedback, offer accepted, offer declined.

### Careers Page
- Every org automatically gets a careers page at `www.hira-ats.com/careers/[org-slug]`.
- Only jobs with `status = 'published'` appear on the careers page.
- The careers page is fully branded per org using settings configured in the Branding section of the org settings.
- Custom domain support (`careers.yourdomain.com`) is planned for post-MVP.