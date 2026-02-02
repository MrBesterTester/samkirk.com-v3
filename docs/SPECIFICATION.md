# samkirk.com v3 — Specification (V1)

## 1) Summary

Build `samkirk.com` as a personal website that showcases Sam Kirk’s genAI capabilities and helps hiring managers evaluate fit for a role. The site includes:

- Three public LLM-powered tools:
  - **How Do I Fit?** (job fit scoring + rationale)
  - **Get a Custom Resume** (job-tailored resume output)
  - **Interview Me Now** (career-only Q&A with RAG from master resume)
- Non-chat features:
  - Weekly **Dance Menu** upload/publish + multi-format download
  - A **song dedication** page
  - Several **static exploration pages** (Category Theory, Pocket Flow, Dance Instruction, Uber Level AI Skills)

V1 is deployed primarily on **GCP** using **Next.js (TypeScript, strict)** on **Cloud Run**, with **Vertex AI (Gemini)** as the LLM provider.

## 2) Goals

- Provide a simple, professional site for hiring managers to quickly answer: **“Is Sam Kirk a good fit for my job opportunity?”**
- Demonstrate real genAI product skills: RAG, multi-turn flows, robust guardrails, cost control, and admin workflows.
- Maintainability: Sam can update the **master resume (Markdown)** and **weekly Dance Menu** via a protected admin experience **without redeploying**.
- Transparency/accountability: allow downloads that include **inputs + extracted fields + outputs + citations**.

## 3) Non-goals (V1)

- Fine-tuning (explicitly excluded).
- SMS alerts (future option only; must be implemented later, with phone number treated as a secret).
- Perfect scraping compatibility for all job boards (fallback to user paste required).
- Rich “enterprise” admin analytics (V1 only needs “view recent submissions”).
- High-fidelity doc generation (`.docx`/`.pdf`) for chatbot artifacts (V1 emphasis is `.md`, with rendered `.html`).

## 4) Users & Primary Use Case

### Primary external user
- **Hiring managers / recruiters**
  - Primary task: submit a job opportunity and evaluate Sam’s fit.

### Site owner/admin
- **Sam (admin)**
  - Upload/replace master resume markdown (triggers immediate RAG re-index)
  - Upload weekly Dance Menu bundle
  - View recent submissions and tool outputs

## 5) Information Architecture (Simple)

The exact nav is flexible; keep it minimal and obvious.

Required top-level destinations (V1):
- Home
- Tools (or direct links to):
  - How Do I Fit?
  - Get a Custom Resume
  - Interview Me Now
- Dance Menu
- Song dedication
- Explorations
  - Category Theory
  - Pocket Flow
  - Dance Instruction
  - Uber Level AI Skills
- Admin (protected)
  - Resume upload
  - Dance Menu upload
  - Recent submissions

## 6) Deployment & Hosting

### Canonical domain
- Canonical URL: **`samkirk.com`**
- `www.samkirk.com` should **redirect** to `samkirk.com`.
- DNS is managed in **Microsoft DNS** (exact provider/portal configuration will be handled during deployment).

### App architecture (Option B)
- Single **Next.js** full-stack app deployed to **Cloud Run**.
  - Serves pages (including static HTML content) and API endpoints.
  - Calls **Vertex AI (Gemini)** from server-side routes only.

## 7) LLM Provider & Model

- Primary LLM: **Google Gemini via Vertex AI**.
- One provider for all three tools in V1.

## 8) Core Features

### 8.1) Tool: “How Do I Fit?”

#### Inputs
A user can provide any combination of:
- Job text pasted into a textarea (preferred, always supported)
- Job posting URL
- File upload (supported file types: **PDF, DOCX, TXT, MD**, max **10MB**)

Additionally, the system must capture/derive these factors:
- **Seniority level** (if not clearly present in job text, ask as follow-up)
- **Location/remote expectations** (highest priority)
- **Must-have skills** (if not clearly present, ask as follow-up)

#### Multi-turn behavior
- The flow is **multi-turn**, allowed up to **5 follow-up questions** total.
- If critical info is missing/unclear, ask follow-up questions.
- For **location/onsite/commute**, if unclear and user cannot clarify, assume **worst-case** and score poorly for that criterion.

#### Location/remote acceptance rules
Acceptable:
- Fully remote, or
- Hybrid **1–2 onsite days/week** AND **max one-way commute \(\le 30 minutes\)** from **Fremont, CA**.

If job requires higher onsite frequency or longer commute: treat as poor fit for location criterion.

#### Output (report)
Produce a structured report that includes:
- A **3-way fit scoring**: **Well / Average / Poorly**
- Rationale per category
- Explicit “unknowns” and assumptions
- A final recommendation summary (short)
- **Citations at the end** (see “Citations” section)

#### Transparency & downloads
Must support download of:
- Original user input(s): pasted text, URL, uploaded file reference
- Extracted/normalized fields (seniority/location/must-haves)
- The model prompt(s) (optional to include verbatim; at minimum include a prompt summary)
- The model output report
- Citations

Preferred download formats: **Markdown (`.md`) + rendered HTML (`.html`)**.

### 8.2) Tool: “Get a Custom Resume”

#### Inputs
Same job opportunity inputs as above:
- Paste text, URL, file upload (PDF/DOCX/TXT/MD, max 10MB)

#### Source of truth for Sam’s background
- A single **master resume** in **Markdown** is uploaded and stored server-side for RAG.
- Must be replaceable via admin UI without redeploy.

#### Output constraints
- Produce a **2-page** resume
- Primary artifact: **Markdown**; also provide **rendered HTML**
- **Never invent** experience/claims. If information is not present in the master resume context, **omit** it.

#### Transparency & downloads
Download bundle includes:
- Job input(s)
- Any extracted/normalized job fields
- Generated resume (`.md` + `.html`)
- Any additional generated artifacts if implemented (optional in V1): cover letter, keyword list, bullets
- Citations at end (see “Citations” section)

### 8.3) Tool: “Interview Me Now”

#### Purpose
Interactive chat that answers questions about Sam’s career, using the master resume as a RAG source.

#### Scope guardrails
- If user asks outside career scope or attempts prompt injection:
  - **Answer briefly with redirection** back to allowed topics.
- Disallowed topics (initial list, can expand later):
  - Personal life
  - Politics
  - Medical
  - Unrelated technical help / general-purpose assistant behavior

Allowed topics (initial list):
- Work history, projects, skills, education
- Availability
- Location/remote constraints
- Compensation expectations (if provided in resume/profile; otherwise omit/deflect)

#### Transparency & downloads
Download bundle includes:
- Full chat transcript
- Model responses
- Citations at the end of the generated report/transcript export

### 8.4) Citations (All tools)

- Citations should appear **at the end** of the generated report/output.
- Citations should refer to specific chunks/sections from the master resume (or other authoritative context) used to support claims.
- UI may optionally support a “view sources” panel later, but V1 requirement is end-of-report citations.

### 8.5) Weekly Dance Menu

#### Admin-only upload + publish
- Only Sam can upload via the protected admin area.
- Upload a “bundle” containing at least:
  - `.md`
  - `.txt`
  - `.html`
- `.pdf` is desired but may be skipped if burdensome in V1.

#### Visitor experience
- Visitors can view the current Dance Menu (display HTML version).
- Visitors can download the menu in supported formats (at least `.md`, `.txt`, `.html`; optionally `.pdf`).

### 8.6) Static pages (built into the app)

The following must exist as static `.html` pages included in the build:
- Song dedication (lyrics + audio embed/link handled as page content)
- Category Theory exploration
- Pocket Flow page
- Dance Instruction page
- Uber Level AI Skills page

## 9) Admin Experience

### Authentication
- Preferred: **Google OAuth login** restricted to Sam’s Google Workspace identity (e.g., `sam@samkirk.com`).
- If OAuth proves too complex, fallback: single shared password (future fallback; still a V1 contingency).

### Admin functions (V1)
- Upload/replace master resume markdown
  - Triggers **immediate** RAG re-indexing
  - No resume versioning required (replace in place)
- Upload weekly Dance Menu bundle
- View **recent submissions** (minimal admin dashboard)
  - V1 scope: list latest N submissions, click to view details (inputs + outputs + timestamps)

## 10) Abuse Prevention & Cost Control

### 10.1) CAPTCHA
- Use **Google reCAPTCHA v2** (visible checkbox).
- Required on the **first request per site visit/session**.
  - “Session” definition for V1: server-issued session cookie (httpOnly) with a finite TTL.

### 10.2) Rate limiting
- Limit: **10 requests per 10 minutes** per visitor/session (exact keying determined in implementation; should include IP + session id as practical).
- Once threshold reached:
  - Block further tool usage and show message instructing user to contact **`sam@samkirk.com`** for access.

### 10.3) Monthly spend cap
- Cap: **$20/month** total for LLM usage.
- Approach: **both**
  - **App-level** cost estimation/counter (fast guardrail)
  - **GCP Billing Budget** configured in the project (backstop)
- When cap reached:
  - **Block all chatbot tools** (Fit/Resume/Interview).
  - Display “temporarily unavailable” messaging on tool pages.
  - Urgent notification: rely on **GCP Billing Budget email notifications** sent to `sam@samkirk.com`.

## 11) Data Storage & Retention

### Storage split
- **Cloud Storage**:
  - Public bucket: public site assets + published Dance Menu assets
  - Private bucket: master resume source, user submissions files, generated artifacts, logs/exports as needed
- **Firestore** (metadata/counters only):
  - Submissions metadata, indexes for “recent submissions”
  - Rate limit counters
  - Session + “captcha passed” flags (as needed)
  - LLM cost estimation counters / monthly spend tracker
  - References (GCS object paths) to uploaded files and generated outputs

### Retention
- Store user inputs + outputs for review.
- Automatic deletion after **90 days**.
- Admin can view recent submissions; manual export/purge can be added later.

### Privacy note
- Any future SMS implementation must treat phone number(s) as secrets:
  - stored only in environment variables / secret manager
  - never committed to repo
  - not displayed in logs or UI

## 12) Job URL Handling

- Attempt to fetch and extract job text server-side.
- If blocked/failed (auth wall, robots, dynamic rendering, etc.):
  - Prompt the user to **paste the job text**.

## 13) Reliability & UX Requirements (V1)

- Clear “happy path” UI for each tool: input → run → results → download.
- Multi-turn flows should be readable and guided (especially How Do I Fit? follow-ups).
- When blocked (rate limit or monthly cap), show friendly messaging + `sam@samkirk.com` contact guidance.
- Keep navigation simple and consistent.

## 14) Technical Constraints

- Next.js + TypeScript in **strict** mode.
- Vertex AI Gemini; no fine-tuning.
- Prefer Markdown-first artifacts.
- `.docx`/`.pdf` for chatbot outputs are optional and may be added later.

## 15) Acceptance Criteria (High-level)

- Public pages render correctly at `samkirk.com` with `www` redirecting to apex.
- All required static pages exist and are reachable via nav.
- Dance Menu:
  - Admin can upload `.md`/`.txt`/`.html` bundle.
  - Visitors can view HTML and download available formats.
- Master resume:
  - Admin can upload/replace markdown and system re-indexes immediately.
- Chat tools:
  - Fit supports paste/url/file and asks up to 5 follow-ups.
  - Resume generator outputs 2-page `.md` plus `.html`, factual-only.
  - Interview bot redirects off-topic queries.
  - Downloads include inputs, outputs, extracted fields, citations at end.
- Abuse/cost controls:
  - reCAPTCHA v2 required once per session before first request.
  - 10 requests/10 minutes enforced with contact gate afterward.
  - $20/month cap blocks all tools; budget emails go to `sam@samkirk.com`.
- Retention:
  - Stored submissions auto-delete after 90 days.

