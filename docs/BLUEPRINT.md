# samkirk.com v3 — Blueprint (V1)

This document is the “how” plan for implementing `docs/SPECIFICATION.md` as an incremental, testable Next.js + GCP project. It is intentionally **step-by-step**, with **embedded prompts** you can hand to a code-generation LLM to implement each step safely.

> **Methodology note:** Per `docs/Dylan-Davis-50plus-method.md`, the recommended model for Blueprint/Architecture work is **Claude Opus 4.5**.

## Guiding principles (V1)

- **Single full-stack service**: One Next.js app (App Router) deployed to **Cloud Run**.
- **Server-only secrets + LLM**: Vertex AI (Gemini) calls happen only in server routes.
- **Type safety**: TypeScript `strict` everywhere; validate untrusted inputs at API boundaries.
- **Artifacts are first-class**: Store inputs/outputs/citations; 90-day retention.
- **Hard guardrails**: reCAPTCHA once per session, rate limit 10/10m, $20/month spend cap kill-switch.
- **Incremental delivery**: Prefer small steps that end wired-in (routes working, UI reachable).

## Current repo reality (starting point)

- Next.js (App Router) lives in `web/`.
- Tailwind is already configured (v4), but the UI is currently the default starter template.
- No test framework is configured yet (no `test` script).

## System architecture (target)

### Runtime + deployment

- **Runtime**: Next.js server on Node.js.
- **Hosting**: Cloud Run (single service).
- **LLM**: Vertex AI (Gemini) via server-side SDK.
- **Storage**:
  - **GCS public bucket**: published Dance Menu assets (+ optionally some static assets).
  - **GCS private bucket**: master resume source, uploads, generated artifacts, exports/zips.
  - **Firestore**: metadata only (submissions index, counters, sessions, rate limit, spend).

### Route map (V1)

Public pages:
- `/` — home (quick hiring-manager path + links)
- `/tools` — tool hub
- `/tools/fit` — “How Do I Fit?”
- `/tools/resume` — “Get a Custom Resume”
- `/tools/interview` — “Interview Me Now”
- `/dance-menu` — view current menu (HTML) + downloads
- `/song-dedication` — static page
- `/explorations` — hub
  - `/explorations/category-theory`
  - `/explorations/pocket-flow`
  - `/explorations/dance-instruction`
  - `/explorations/uber-level-ai-skills`

Admin pages (protected):
- `/admin` — landing
- `/admin/resume` — upload/replace master resume markdown (triggers immediate re-index)
- `/admin/dance-menu` — upload menu bundle, publish to public bucket
- `/admin/submissions` — view recent submissions, open details

API routes (server-only):
- `POST /api/session/init` — create/refresh session cookie (httpOnly)
- `POST /api/captcha/verify` — verify reCAPTCHA v2 token; mark “captcha passed” for session
- `POST /api/tools/fit/start` — ingest job input; may return follow-up question
- `POST /api/tools/fit/answer` — accept follow-up answer; may ask another; else produce report
- `POST /api/tools/resume` — generate tailored resume + artifacts
- `POST /api/tools/interview` — chat turn (career-only), returns assistant response
- `POST /api/admin/resume` — upload master resume markdown (admin-only)
- `POST /api/admin/dance-menu` — upload/publish dance menu bundle (admin-only)
- `GET  /api/submissions/[id]` — fetch submission details (admin-only)
- `GET  /api/submissions/[id]/download` — download artifact bundle (admin-only for full; public for end-user if you choose)
- `POST /api/maintenance/retention` — scheduled cleanup (Cloud Scheduler → Cloud Run)

> Note: the exact endpoint split can change, but keep server responsibilities in routes under `web/src/app/api/**`.

## Data model (Firestore + GCS)

### Firestore collections (suggested)

- `sessions/{sessionId}`
  - `createdAt`, `expiresAt`
  - `captchaPassedAt?`
  - `requestWindow` fields (or keep rate limit separately)
  - `ipHash?` (optional; avoid storing raw IP)

- `rateLimits/{key}`
  - `windowStart`, `count`, `expiresAt`
  - `key` is derived from \(hash(sessionId + ip + routeGroup)\)

- `spend/monthly/{YYYY-MM}`
  - `usdBudget` (= 20)
  - `usdUsedEstimated`
  - `updatedAt`

- `resumeIndex/current`
  - `resumeGcsPath`
  - `indexedAt`
  - `chunkCount`
  - `version` (monotonic integer)

- `resumeChunks/{chunkId}`
  - `version`
  - `title` (e.g., section heading)
  - `content` (chunk text)
  - `sourceRef` (e.g., `h2:Experience > Project X`, or line range)
  - `embedding` (optional in V1; see RAG plan below)

- `submissions/{submissionId}`
  - `createdAt`, `expiresAt`
  - `tool` = `fit|resume|interview`
  - `status` = `in_progress|complete|blocked|error`
  - `sessionId` (or anonymized session ref)
  - `inputs` (structured, sanitized)
  - `extracted` (structured: seniority/location/mustHaves, etc.)
  - `outputs` (summary fields + paths to artifacts)
  - `citations` (structured list)
  - `artifactGcsPrefix` (where the bundle lives)

### GCS object layout (suggested)

Private bucket:
- `resume/master.md`
- `resume/index/current.json` (chunk metadata; optional)
- `submissions/{submissionId}/input/*`
- `submissions/{submissionId}/extracted.json`
- `submissions/{submissionId}/output/report.md`
- `submissions/{submissionId}/output/report.html`
- `submissions/{submissionId}/output/resume.md`
- `submissions/{submissionId}/output/resume.html`
- `submissions/{submissionId}/output/transcript.md`
- `submissions/{submissionId}/bundle.zip`

Public bucket:
- `dance-menu/current/menu.html`
- `dance-menu/current/menu.md`
- `dance-menu/current/menu.txt`
- `dance-menu/current/menu.pdf` (optional)
- (optionally) versioned folders like `dance-menu/2026-02-02/*`

## LLM integration (Vertex AI Gemini)

### Design goals

- One small server module that wraps:
  - model selection
  - request/response typing
  - safety settings
  - usage extraction (token counts) when available

### Spend accounting (app-level)

- Maintain a **monthly spend doc** in Firestore (`spend/monthly/YYYY-MM`).
- On every tool call:
  - Check spend; if \(\ge 20\), block tool usage and return a “temporarily unavailable” payload.
  - Estimate cost from token usage (or a conservative heuristic if exact usage not returned).
  - Increment spend.

> Backstop: configure GCP Billing Budget emails to `sam@samkirk.com` (outside code).

## RAG plan for the master resume

### V0 (fastest path, still grounded)

- Store uploaded master resume markdown in private GCS.
- For retrieval, **inject the relevant resume sections** as context. In V0, “relevant sections” can simply be the full document if small enough.
- Citations are generated from headings/section labels (not embeddings).

### V1 (true selective retrieval)

- Chunk the markdown (by headings + size).
- Create embeddings via Vertex AI embeddings model.
- Store embeddings somewhere durable (Firestore if feasible; otherwise GCS JSON).
- Retrieve top-k chunks for:
  - custom resume generation
  - interview bot answers
  - fit rationale when referencing resume experience
- Citations reference `chunkId` + `sourceRef`.

## Abuse prevention & security

### reCAPTCHA v2 (once per session)

- Frontend displays checkbox on first tool attempt.
- Server verifies token via Google endpoint and stores `captchaPassedAt` for the session.

### Rate limiting (10 requests / 10 minutes)

- Derive a stable key from:
  - session id + IP (hashed) + “tools” bucket
- Enforce in a shared server utility used by all tool endpoints.
- When blocked: return UI-friendly message directing to `sam@samkirk.com`.

### Auth (admin)

- Preferred: Google OAuth restricted to a single allowed email (e.g., `sam@samkirk.com`).
- Fallback: single shared password is a contingency only (still behind server-side checks).

### Input validation & safety

- Validate all API inputs with a schema library (e.g., `zod`).
- Enforce file type + max 10MB.
- Prompt injection resistance:
  - do not accept system prompt overrides
  - constrain tool outputs to schemas
  - include explicit “career-only” scope guardrails

## Testing strategy (pragmatic + “real calls”)

### What “no mocks” means here

- **Unit tests** should still exist for pure functions (parsing, chunking, formatting).
- For external services (Vertex/GCS/Firestore), provide **real-integration smoke tests** that run only when credentials/env are present.
  - Default CI/dev can skip these tests if env is missing.
  - When enabled, they make real calls (or to official emulators where appropriate).

### Tooling (recommended)

- Unit: **Vitest**
- Components: **@testing-library/react**
- E2E: **Playwright** (especially for captcha + multi-turn flows)
- Lint: existing `npm run lint`

## Implementation phases + steps (small, iterative, wired-in)

Each step below includes:
- **Goal**
- **Acceptance criteria**
- **Test plan**
- **Prompt** (copy/paste into your code-gen model)

---

## Phase 0 — Project foundation (tests, env, UI shell)

### 0.1 Add test tooling (Vitest + React Testing Library)

- **Goal**: Add a minimal test framework so every step can ship with real assertions.
- **Acceptance criteria**:
  - `npm run test` exists and passes.
  - One sample test runs in CI/local.
- **Test plan**:
  - `npm run test`
- **Prompt**:

```text
You are working in a Next.js App Router project in web/.

Task: add Vitest + React Testing Library with TypeScript support.

Requirements:
- Add a "test" script to web/package.json.
- Configure Vitest for jsdom where needed.
- Add one simple passing test for an existing component/page.
- Keep TypeScript strict; avoid any.
- Do not add mocks for external APIs yet.

Then run: npm test and npm run lint.
```

### 0.2 Add typed env validation (server-only secrets)

- **Goal**: Centralize required env vars and keep secrets server-only.
- **Acceptance criteria**:
  - One module exports validated env values.
  - Missing env produces clear startup error (server routes).
- **Test plan**:
  - Unit tests validate schema behavior.
- **Prompt**:

```text
Implement a typed env validation module for Next.js.

Include placeholders (no secrets committed) for:
- GCP project id
- GCS bucket names (public/private)
- Vertex AI location + model names
- reCAPTCHA keys (site key for client, secret for server)
- Auth (Google OAuth client id/secret) for admin

Use zod (or similar) and ensure server-only secrets are not imported into client components.
Add unit tests for env parsing.
```

### 0.3 Create site layout + navigation skeleton (no business logic)

- **Goal**: Replace starter UI with real IA and navigation.
- **Acceptance criteria**:
  - Header nav links to required destinations.
  - Placeholder pages exist for all routes in the spec.
- **Test plan**:
  - Basic component render tests for layout/nav.
- **Prompt**:

```text
Replace the starter homepage/layout with a real site shell:
- Global layout with header/nav + main + footer.
- Pages: /, /tools, /dance-menu, /song-dedication, /explorations (+ four exploration pages), /admin.

Keep styling simple but clean using Tailwind.
Add a couple of basic render tests for the layout/nav.
Run npm test and npm run lint.
```

---

## Phase 1 — Static content pages (song + explorations)

### 1.1 Add exploration pages with static HTML content included in build

- **Goal**: Ensure required static pages exist as “static HTML included in build”.
- **Acceptance criteria**:
  - Each exploration route renders content sourced from a checked-in `.html` file.
  - Navigation links work.
- **Test plan**:
  - Component tests for route rendering.
- **Prompt**:

```text
Implement exploration pages that render static HTML shipped with the repo.

Constraints:
- Store the HTML files in web/public/static/ (or equivalent) so they are included in the build.
- The Next.js pages should render the HTML safely (e.g., within an iframe or sanitized injection).
- Create pages for Category Theory, Pocket Flow, Dance Instruction, Uber Level AI Skills.

Add basic tests that the routes render and include expected headings.
```

### 1.2 Add song dedication page (static content + optional audio embed)

- **Goal**: Provide the song dedication page per spec.
- **Acceptance criteria**:
  - Page exists, linked in nav.
  - Supports lyrics + a link/embed placeholder for audio.
- **Test plan**:
  - Component test render.
- **Prompt**:

```text
Add /song-dedication page with static content (lyrics + audio link/embed placeholder).
Keep styling consistent with the site shell.
Add a simple render test.
```

---

## Phase 2 — GCP integration primitives (Firestore + GCS + sessions)

### 2.1 Create server utilities for Firestore + GCS access

- **Goal**: One typed module each for Firestore and GCS access used by routes.
- **Acceptance criteria**:
  - Firestore client and Storage client are created server-side only.
  - No secrets leak to client bundles.
- **Test plan**:
  - Unit tests for path building + small helpers.
  - Optional smoke script to verify credentials when env present.
- **Prompt**:

```text
Implement server-only modules:
- firestore.ts: exports a singleton Firestore client and typed collection helpers.
- storage.ts: exports a GCS Storage client and helpers to read/write objects.

Add a "smoke" script (npm run smoke:gcp) that, when env creds are present, does:
- reads/writes a tiny test object in the private bucket (under a safe prefix)
- writes a tiny doc to Firestore (under a safe collection)

If env is missing, the smoke script should fail fast with a clear message.
Do not mock these calls.
```

### 2.2 Implement session cookie + session doc

- **Goal**: A stable session id for captcha + rate limiting.
- **Acceptance criteria**:
  - `POST /api/session/init` sets an httpOnly cookie and creates a session doc.
  - Session includes TTL/expiry.
- **Test plan**:
  - Unit tests for cookie/session id logic.
  - Optional integration smoke (requires env).
- **Prompt**:

```text
Create POST /api/session/init:
- If no session cookie, mint a new random session id.
- Store session doc in Firestore with expiresAt.
- Set httpOnly, secure (in prod), sameSite cookie.

Add unit tests for session id/cookie behavior.
```

---

## Phase 3 — Admin auth + uploads (resume + dance menu)

### 3.1 Add admin authentication (Google OAuth, email allowlist)

- **Goal**: Protect `/admin/**` routes and admin API endpoints.
- **Acceptance criteria**:
  - Only allowed email can access admin pages.
  - Unauthed users are redirected/blocked.
- **Test plan**:
  - Lightweight unit tests for allowlist check.
  - Manual smoke in dev with OAuth credentials.
- **Prompt**:

```text
Add Google OAuth auth for admin-only access.

Requirements:
- Restrict access to one allowed email (config via env).
- Protect /admin pages and /api/admin routes.
- Do not leak tokens to client logs.

Add a small unit test for the allowlist logic.
```

### 3.2 Admin: upload/replace master resume markdown + store in private GCS

- **Goal**: Replace resume without redeploy.
- **Acceptance criteria**:
  - `/admin/resume` UI uploads markdown.
  - `POST /api/admin/resume` stores it to private GCS as `resume/master.md`.
  - Firestore `resumeIndex/current` updated.
- **Test plan**:
  - Unit test for markdown validation + storage path building.
  - Smoke test (real GCS + Firestore) when env present.
- **Prompt**:

```text
Implement the admin resume upload feature:
- Admin page with file input for .md and submit button.
- API route that validates file type, size, and stores to private GCS.
- Update Firestore resumeIndex/current metadata.

Include a smoke test path using the existing smoke:gcp script or an additional script.
No mocks for GCS/Firestore in smoke mode.
```

### 3.3 Resume indexing V0 (chunking + citations metadata, no embeddings yet)

- **Goal**: Prepare citation-friendly chunks immediately after upload.
- **Acceptance criteria**:
  - Resume markdown is chunked into sections.
  - Chunks stored (Firestore or GCS JSON) with `chunkId`, `title`, `sourceRef`, `content`.
- **Test plan**:
  - Unit tests for chunker with real markdown samples.
- **Prompt**:

```text
Implement Resume Index V0:
- Write a markdown chunker that splits by headings and chunk size.
- Produce chunk objects: {chunkId, title, sourceRef, content}.
- Persist chunks in Firestore (resumeChunks) keyed by version, or in a GCS JSON index.
- Update resumeIndex/current with version + counts.

Add thorough unit tests for chunking + stable ids.
```

### 3.4 Admin: upload/publish Dance Menu bundle (md/txt/html; pdf optional)

- **Goal**: Admin can publish the weekly menu without redeploy.
- **Acceptance criteria**:
  - Upload UI for multiple files.
  - Stores files to public bucket under `dance-menu/current/*`.
  - `/dance-menu` renders HTML version and offers downloads.
- **Test plan**:
  - Unit tests for bundle validation (required extensions).
  - Manual smoke for public bucket permissions.
- **Prompt**:

```text
Implement Dance Menu:
- Admin page to upload a bundle containing at least .md, .txt, .html (pdf optional).
- API route stores to GCS public bucket under dance-menu/current/.
- Public /dance-menu page renders the HTML version and links to downloads.

Add unit tests for bundle validation rules.
```

---

## Phase 4 — Shared “artifact” plumbing (submissions + downloads)

### 4.1 Define submission schema + Firestore helpers

- **Goal**: Standardize how all tools store inputs/outputs/citations.
- **Acceptance criteria**:
  - Typed `Submission` type(s) and helpers to create/update.
  - `expiresAt` set to now + 90 days.
- **Test plan**:
  - Unit tests for expiry calculation and schema validation.
- **Prompt**:

```text
Create typed submission models for Firestore:
- Submission base with tool, createdAt, expiresAt, status, inputs, extracted, outputs, citations.
- Helpers: createSubmission, updateSubmission, completeSubmission.

Add unit tests for TTL computation and schema validation.
```

### 4.2 Implement artifact writer (md + html render) + bundle download

- **Goal**: Convert markdown artifacts to HTML and produce a downloadable bundle.
- **Acceptance criteria**:
  - Utility renders `.md` -> `.html` deterministically.
  - `GET /api/submissions/[id]/download` returns a zip with inputs/extracted/outputs/citations.
- **Test plan**:
  - Unit tests for markdown rendering.
  - Optional smoke test with real GCS write + signed URL or direct streaming.
- **Prompt**:

```text
Implement artifact plumbing:
- A markdown-to-HTML renderer utility (server-side).
- A zip bundler that writes bundle.zip to private GCS (or streams directly).
- Download endpoint that returns the zip.

Add unit tests for markdown rendering and bundle file list.
```

---

## Phase 5 — Guardrails (captcha, rate limit, spend cap)

### 5.1 reCAPTCHA verification endpoint + client widget

- **Goal**: “captcha once per session” gate for tool usage.
- **Acceptance criteria**:
  - Client shows checkbox before first tool request.
  - Server verifies token and stores `captchaPassedAt` on session.
- **Test plan**:
  - Unit tests for server verification request formatting (skip network if env missing).
  - Manual E2E test with real reCAPTCHA keys.
- **Prompt**:

```text
Add reCAPTCHA v2 gating:
- Client component for the checkbox using site key env var.
- POST /api/captcha/verify to verify token using secret key (server-only).
- Store captchaPassedAt for session in Firestore.

Wire this so tool pages require captcha before calling tool endpoints.
```

### 5.2 Rate limiting utility (10 requests / 10 minutes)

- **Goal**: Shared rate limit enforcement across tool endpoints.
- **Acceptance criteria**:
  - Enforced on all /api/tools/** endpoints.
  - Friendly “contact sam@samkirk.com” error payload when blocked.
- **Test plan**:
  - Unit tests for counter increments and window behavior.
- **Prompt**:

```text
Implement rate limiting:
- 10 requests per 10 minutes keyed by session+ip hash.
- Firestore-backed counter with expiresAt.
- Utility function enforceRateLimit(req): throws a typed error for UI.

Add unit tests for the limiter logic.
```

### 5.3 Spend cap enforcement ($20/month)

- **Goal**: Block all chatbot tools when spend cap hit.
- **Acceptance criteria**:
  - All tool endpoints check spend before LLM call.
  - Spend doc updated after LLM call based on usage or conservative estimate.
- **Test plan**:
  - Unit tests for month keying and cap logic.
  - Smoke test with real Vertex usage if env present.
- **Prompt**:

```text
Implement spend tracking:
- Firestore doc per month with usdUsedEstimated and usdBudget.
- Utility: enforceSpendCap() and recordSpend(deltaUsd).
- Integrate with LLM wrapper to record usage.

Add unit tests for cap behavior and month key calculation.
```

---

## Phase 6 — Tool: “How Do I Fit?” (multi-turn)

### 6.1 Job ingestion (paste/url/file) → normalized job text

- **Goal**: Accept all job input modes.
- **Acceptance criteria**:
  - Paste always works.
  - URL fetch attempts server-side; on failure asks user to paste.
  - File upload supports PDF/DOCX/TXT/MD up to 10MB.
- **Test plan**:
  - Unit tests for text extraction from TXT/MD.
  - Smoke/integration for URL fetch on a known public URL (optional).
- **Prompt**:

```text
Implement job ingestion utilities:
- Normalize job input: pasted text OR fetched URL text OR extracted from uploaded file.
- Enforce max 10MB and allowed extensions.
- For URL fetch, attempt server-side extraction and return a typed failure that triggers "please paste" UI.

Add unit tests for TXT/MD extraction and input validation.
```

### 6.2 Fit flow state machine (up to 5 follow-ups)

- **Goal**: Multi-turn extraction of seniority/location/must-haves with rules.
- **Acceptance criteria**:
  - Up to 5 follow-up questions.
  - Location worst-case rule applied when unclear.
  - Flow ends with structured extracted fields.
- **Test plan**:
  - Unit tests for state transitions and follow-up counting.
- **Prompt**:

```text
Implement the Fit tool state machine:
- State includes jobText, extracted fields, followUpsAsked, history.
- Function nextQuestion(state) returns either a question or "ready".
- Apply special location rules: if unclear and user can't clarify, assume worst-case.

Add unit tests covering: 0..5 follow-ups, missing fields, worst-case location.
```

### 6.3 LLM prompt + structured report generation (+ citations)

- **Goal**: Generate final report with 3-way fit and citations section.
- **Acceptance criteria**:
  - Output includes Well/Average/Poorly, rationales, unknowns/assumptions, final recommendation, citations at end.
  - Stored as `.md` and `.html` artifacts.
- **Test plan**:
  - Smoke test that makes a real Vertex call when env present.
- **Prompt**:

```text
Implement Fit report generation:
- Create server-only prompt builder using extracted job fields and rules.
- Call Vertex AI Gemini and request a structured markdown report.
- Append citations section at end (even if empty in V1).
- Store artifacts in GCS and metadata in Firestore submission.

Add a smoke test path that makes a real Vertex call when credentials exist.
```

### 6.4 UI wiring for Fit tool (multi-turn UX + downloads)

- **Goal**: Public page flow: input → follow-ups → results → download.
- **Acceptance criteria**:
  - Clear UI for each step; no dead ends.
  - Download produces the expected bundle.
- **Test plan**:
  - Playwright E2E (at least one happy path without captcha in dev mode, or with a toggle).
- **Prompt**:

```text
Build /tools/fit UI:
- Input form for paste/url/file.
- Follow-up Q&A UI (up to 5).
- Results page with report preview and download button.

Add a Playwright E2E test for the happy path (use dev toggles only if required by reCAPTCHA).
```

---

## Phase 7 — Tool: “Get a Custom Resume”

### 7.1 Job ingestion reuse + resume context retrieval (RAG V0)

- **Goal**: Reuse ingestion; prepare resume context from stored chunks.
- **Acceptance criteria**:
  - Pull master resume chunks for context (initially top-N or all).
  - Citations reference chunk titles/sourceRefs.
- **Test plan**:
  - Unit tests for context assembly and citation formatting.
- **Prompt**:

```text
Implement Custom Resume context retrieval (RAG V0):
- Load resume chunks from index.
- Assemble a context string for the LLM with chunk ids/titles.
- Create citation entries mapping claims -> chunk refs (initially can cite all used chunks).

Add unit tests for context assembly and citation formatting.
```

### 7.2 Resume generation (2-page, factual-only) + artifacts

- **Goal**: Generate a 2-page markdown resume and rendered HTML.
- **Acceptance criteria**:
  - Output stays within 2 pages (approx by section length/word count guidance).
  - “Never invent”: if not in resume context, omit.
  - Bundle includes job input, extracted fields, resume md/html, citations.
- **Test plan**:
  - Smoke test real Vertex call (env present).
- **Prompt**:

```text
Implement Custom Resume generation:
- Prompt Gemini with job text + resume context chunks.
- Enforce "do not invent" and 2-page constraint.
- Save resume.md + resume.html and submission metadata.

Add a smoke test using real Vertex call when enabled by env.
```

### 7.3 UI wiring for Custom Resume

- **Goal**: Public page flow and download.
- **Acceptance criteria**:
  - Simple input → generate → preview → download.
- **Test plan**:
  - Playwright happy path.
- **Prompt**:

```text
Build /tools/resume UI:
- Reuse job input component.
- Show progress + results preview.
- Provide download bundle link.

Add a Playwright E2E test for the happy path.
```

---

## Phase 8 — Tool: “Interview Me Now” (career-only chat)

### 8.1 Career-only policy + guardrails

- **Goal**: Central policy enforcement for off-topic and injection attempts.
- **Acceptance criteria**:
  - If query is out of scope, answer briefly + redirect.
  - Never becomes a general-purpose assistant.
- **Test plan**:
  - Unit tests for policy classifier (simple rules + optional LLM).
- **Prompt**:

```text
Implement Interview policy guardrails:
- Define allowed/disallowed topics (career-only).
- Implement a lightweight classifier that blocks obvious off-topic prompts.
- Provide a standard refusal/redirect response.

Add unit tests for several disallowed examples.
```

### 8.2 Chat endpoint + transcript artifact

- **Goal**: Server chat turn handling + transcript export.
- **Acceptance criteria**:
  - `POST /api/tools/interview` returns assistant response and stores transcript.
  - Download includes transcript + citations at end.
- **Test plan**:
  - Smoke test real Vertex call (env present).
- **Prompt**:

```text
Implement Interview tool backend:
- Accept a user message + conversation id.
- Retrieve resume context (RAG V0 initially).
- Apply guardrails; if allowed, call Gemini and return response.
- Persist transcript and artifacts; include citations at end of transcript export.

Add smoke test with real Vertex call when enabled.
```

### 8.3 UI wiring for Interview tool

- **Goal**: Simple chat UI.
- **Acceptance criteria**:
  - Chat works, shows history, supports download transcript bundle.
- **Test plan**:
  - Playwright E2E for a short allowed conversation.
- **Prompt**:

```text
Build /tools/interview UI:
- Basic chat transcript view + input box.
- Call the interview endpoint; render assistant responses.
- Download transcript bundle.

Add Playwright E2E for a short allowed conversation.
```

---

## Phase 9 — Retention cleanup + admin submissions viewer

### 9.1 Admin submissions list + details view

- **Goal**: Minimal “recent submissions” dashboard.
- **Acceptance criteria**:
  - List latest N submissions; click to view details (inputs/outputs/timestamps).
- **Test plan**:
  - Component test for list rendering (mock Firestore fetch at boundary is acceptable here).
- **Prompt**:

```text
Implement /admin/submissions:
- Server-side fetch recent submissions from Firestore.
- List view + detail view page.
- Ensure admin auth protection.
```

### 9.2 Retention deletion route (90-day) + scheduler integration plan

- **Goal**: Automatic deletion of expired submissions/artifacts.
- **Acceptance criteria**:
  - `POST /api/maintenance/retention` deletes expired Firestore docs and referenced GCS objects.
  - Safe (idempotent) and logs minimally (no secrets).
- **Test plan**:
  - Unit tests for identifying expired docs.
  - Manual run in dev project.
- **Prompt**:

```text
Implement retention cleanup:
- Query Firestore for submissions where expiresAt <= now.
- Delete associated GCS objects/prefix and then delete Firestore doc.
- Keep it idempotent and safe on retries.

Add unit tests for expiry filtering logic.
```

---

## Phase 10 — Hardening + deployment checklist (Cloud Run)

### 10.1 Observability and error handling

- **Goal**: Make failures diagnosable without leaking secrets.
- **Acceptance criteria**:
  - Standard error envelope in API routes.
  - Correlation id per request (optional).
- **Test plan**:
  - Unit tests for error serializer.
- **Prompt**:

```text
Add API error handling conventions:
- Typed errors for: blocked(rate limit), blocked(spend cap), validation, upstream fetch failed, LLM failed.
- Standard JSON response shape for errors.
- Ensure no secrets are logged.

Add unit tests for error serialization.
```

### 10.2 Cloud Run configuration notes (non-code)

- **Goal**: Ensure production parity and guardrails.
- **Checklist**:
  - Configure service account permissions for Firestore + Storage.
  - Set env vars in Cloud Run / Secret Manager (no secrets in repo).
  - Set `www` redirect at DNS/load balancer layer.
  - Configure GCP Billing Budget email alerts to `sam@samkirk.com`.
  - Configure Cloud Scheduler to call retention endpoint daily.

