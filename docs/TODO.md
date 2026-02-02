# samkirk.com v3 — Implementation TODO

> Generated from `docs/BLUEPRINT.md` per the Dylan Davis methodology.
> 
> **Model labels** follow the heuristics:
> - **[Codex/Opus]** — Backend logic, APIs, data models
> - **[Opus 4.5]** — UI/Frontend components, layout, styling
> - **[Gemini 3 Pro]** — Debugging, visual testing, E2E tests with browser
> - **[Sonnet 4]** — Quick fixes, minor tweaks

---

## Phase 0 — Project Foundation (tests, env, UI shell)

### 0.1 Add test tooling (Vitest + React Testing Library)

- [x] **[Codex/Opus]** Install Vitest + @testing-library/react with TypeScript support
- [x] **[Codex/Opus]** Add `"test"` script to `web/package.json`
- [x] **[Codex/Opus]** Configure Vitest for jsdom environment
- [x] **[Codex/Opus]** Write one sample passing test for an existing page/component
- [x] **[Codex/Opus]** TEST: Run `npm test` and `npm run lint` — both pass

### 0.2 Add typed env validation (server-only secrets)

- [x] **[Codex/Opus]** Create `web/src/lib/env.ts` with zod schema for env vars
- [x] **[Codex/Opus]** Define placeholders for: GCP project id, GCS bucket names, Vertex AI config, reCAPTCHA keys, OAuth client id/secret
- [x] **[Codex/Opus]** Ensure server-only secrets are not importable in client components
- [x] **[Codex/Opus]** Add unit tests for env parsing (valid/invalid cases)
- [x] **[Codex/Opus]** TEST: Run `npm test` — env tests pass

### 0.3 Create site layout + navigation skeleton

- [x] **[Opus 4.5]** Create global layout with header/nav + main + footer
- [x] **[Opus 4.5]** Add nav links: Home, Tools, Dance Menu, Song Dedication, Explorations, Admin
- [x] **[Opus 4.5]** Create placeholder pages for all routes:
  - [x] `/` (home)
  - [x] `/tools` (tool hub)
  - [x] `/tools/fit`
  - [x] `/tools/resume`
  - [x] `/tools/interview`
  - [x] `/dance-menu`
  - [x] `/song-dedication`
  - [x] `/explorations`
  - [x] `/explorations/category-theory`
  - [x] `/explorations/pocket-flow`
  - [x] `/explorations/dance-instruction`
  - [x] `/explorations/uber-level-ai-skills`
  - [x] `/admin`
  - [x] `/admin/resume`
  - [x] `/admin/dance-menu`
  - [x] `/admin/submissions`
- [x] **[Opus 4.5]** Style with Tailwind — clean, modern look
- [x] **[Codex/Opus]** Add basic render tests for layout and nav components
- [x] **[Codex/Opus]** TEST: Run `npm test` and `npm run lint` — both pass

---

## Phase 1 — Static Content Pages (song + explorations)

### 1.1 Add exploration pages with static HTML content

- [x] **[Codex/Opus]** Create `web/public/static/` folder for static HTML files
- [x] **[Codex/Opus]** Add placeholder HTML files for each exploration topic:
  - [x] `category-theory.html`
  - [x] `pocket-flow.html`
  - [x] `dance-instruction.html`
  - [x] `uber-level-ai-skills.html`
- [x] **[Opus 4.5]** Implement exploration pages that render the static HTML safely (iframe or sanitized)
- [x] **[Opus 4.5]** Style exploration pages consistently with site shell
- [x] **[Codex/Opus]** Add render tests for exploration routes
- [x] **[Codex/Opus]** TEST: Run `npm test` — exploration tests pass

### 1.2 Add song dedication page

- [x] **[Opus 4.5]** Create `/song-dedication` page with static content placeholder
- [x] **[Opus 4.5]** Add lyrics section + audio link/embed placeholder
- [x] **[Opus 4.5]** Style consistently with site shell
- [x] **[Codex/Opus]** Add render test for song dedication page
- [x] **[Codex/Opus]** TEST: Run `npm test` — song dedication test passes

---

## Phase 2 — GCP Integration Primitives (Firestore + GCS + sessions)

### 2.1 Create server utilities for Firestore + GCS access

- [x] **[Codex/Opus]** Create `web/src/lib/firestore.ts` — singleton client + typed collection helpers
- [x] **[Codex/Opus]** Create `web/src/lib/storage.ts` — GCS client + read/write helpers
- [x] **[Codex/Opus]** Add unit tests for path building and helper functions
- [x] **[Codex/Opus]** Create `npm run smoke:gcp` script that:
  - [x] Reads/writes test object to private bucket (safe prefix)
  - [x] Writes/reads test doc to Firestore (safe collection)
  - [x] Fails fast with clear message if env missing
- [ ] **[Gemini 3 Pro]** TEST: Run smoke script with real GCP credentials to verify integration
  - [ ] Complete GCP setup checklist in `docs/GCP-SETUP.md`

### 2.2 Implement session cookie + session doc

- [ ] **[Codex/Opus]** Create `POST /api/session/init` route
- [ ] **[Codex/Opus]** Implement session id generation (cryptographically random)
- [ ] **[Codex/Opus]** Set httpOnly, secure (prod), sameSite cookie
- [ ] **[Codex/Opus]** Create session doc in Firestore with `createdAt`, `expiresAt`
- [ ] **[Codex/Opus]** Add unit tests for session id/cookie logic
- [ ] **[Gemini 3 Pro]** TEST: Smoke test session creation with real Firestore (env present)

---

## Phase 3 — Admin Auth + Uploads (resume + dance menu)

### 3.1 Add admin authentication (Google OAuth, email allowlist)

- [ ] **[Codex/Opus]** Configure NextAuth.js (or similar) with Google OAuth provider
- [ ] **[Codex/Opus]** Implement email allowlist check (allowed email from env)
- [ ] **[Codex/Opus]** Protect `/admin/**` pages with auth middleware
- [ ] **[Codex/Opus]** Protect `/api/admin/**` routes with auth check
- [ ] **[Codex/Opus]** Add unit tests for allowlist logic
- [ ] **[Gemini 3 Pro]** TEST: Manual smoke test OAuth flow in dev with real credentials

### 3.2 Admin: upload/replace master resume markdown

- [ ] **[Opus 4.5]** Create `/admin/resume` page with file input for `.md` files
- [ ] **[Codex/Opus]** Create `POST /api/admin/resume` route
- [ ] **[Codex/Opus]** Validate file type (markdown) and size (max 10MB)
- [ ] **[Codex/Opus]** Store uploaded file to private GCS as `resume/master.md`
- [ ] **[Codex/Opus]** Update Firestore `resumeIndex/current` metadata
- [ ] **[Codex/Opus]** Add unit tests for validation + storage path building
- [ ] **[Gemini 3 Pro]** TEST: Smoke test with real GCS + Firestore (env present)

### 3.3 Resume indexing V0 (chunking + citations metadata)

- [ ] **[Codex/Opus]** Write markdown chunker that splits by headings + size limits
- [ ] **[Codex/Opus]** Define chunk schema: `{chunkId, title, sourceRef, content}`
- [ ] **[Codex/Opus]** Persist chunks to Firestore `resumeChunks` collection (keyed by version)
- [ ] **[Codex/Opus]** Update `resumeIndex/current` with version + chunk count
- [ ] **[Codex/Opus]** Add thorough unit tests for chunking + stable chunk ids
- [ ] **[Codex/Opus]** TEST: Run unit tests — all chunking tests pass

### 3.4 Admin: upload/publish Dance Menu bundle

- [ ] **[Opus 4.5]** Create `/admin/dance-menu` page with multi-file upload UI
- [ ] **[Codex/Opus]** Create `POST /api/admin/dance-menu` route
- [ ] **[Codex/Opus]** Validate bundle contains required extensions: `.md`, `.txt`, `.html`
- [ ] **[Codex/Opus]** Store files to public GCS bucket under `dance-menu/current/`
- [ ] **[Opus 4.5]** Update `/dance-menu` page to render HTML version + download links
- [ ] **[Codex/Opus]** Add unit tests for bundle validation rules
- [ ] **[Gemini 3 Pro]** TEST: Manual smoke test for public bucket permissions

---

## Phase 4 — Shared "Artifact" Plumbing (submissions + downloads)

### 4.1 Define submission schema + Firestore helpers

- [ ] **[Codex/Opus]** Define typed `Submission` interface (tool, createdAt, expiresAt, status, inputs, extracted, outputs, citations, artifactGcsPrefix)
- [ ] **[Codex/Opus]** Implement `createSubmission()` helper (sets expiresAt = now + 90 days)
- [ ] **[Codex/Opus]** Implement `updateSubmission()` helper
- [ ] **[Codex/Opus]** Implement `completeSubmission()` helper
- [ ] **[Codex/Opus]** Add unit tests for TTL computation and schema validation
- [ ] **[Codex/Opus]** TEST: Run unit tests — all submission tests pass

### 4.2 Implement artifact writer + bundle download

- [ ] **[Codex/Opus]** Create markdown-to-HTML renderer utility (server-side)
- [ ] **[Codex/Opus]** Create zip bundler utility (writes bundle.zip to GCS or streams)
- [ ] **[Codex/Opus]** Create `GET /api/submissions/[id]/download` route
- [ ] **[Codex/Opus]** Return zip containing inputs/extracted/outputs/citations
- [ ] **[Codex/Opus]** Add unit tests for markdown rendering
- [ ] **[Codex/Opus]** Add unit tests for bundle file list generation
- [ ] **[Gemini 3 Pro]** TEST: Smoke test with real GCS write + download (env present)

---

## Phase 5 — Guardrails (captcha, rate limit, spend cap)

### 5.1 reCAPTCHA verification endpoint + client widget

- [ ] **[Opus 4.5]** Create reCAPTCHA v2 checkbox client component (uses site key env var)
- [ ] **[Codex/Opus]** Create `POST /api/captcha/verify` route
- [ ] **[Codex/Opus]** Verify token with Google reCAPTCHA API (server-only secret)
- [ ] **[Codex/Opus]** Store `captchaPassedAt` on session doc in Firestore
- [ ] **[Codex/Opus]** Wire tool pages to require captcha before calling tool endpoints
- [ ] **[Codex/Opus]** Add unit tests for verification request formatting
- [ ] **[Gemini 3 Pro]** TEST: Manual E2E test with real reCAPTCHA keys

### 5.2 Rate limiting utility (10 requests / 10 minutes)

- [ ] **[Codex/Opus]** Create rate limit key derivation (session+ip hash)
- [ ] **[Codex/Opus]** Implement Firestore-backed counter with `windowStart`, `count`, `expiresAt`
- [ ] **[Codex/Opus]** Create `enforceRateLimit(req)` utility — throws typed error when blocked
- [ ] **[Codex/Opus]** Apply to all `/api/tools/**` endpoints
- [ ] **[Codex/Opus]** Return friendly "contact sam@samkirk.com" error payload when blocked
- [ ] **[Codex/Opus]** Add unit tests for counter increments and window behavior
- [ ] **[Codex/Opus]** TEST: Run unit tests — all rate limit tests pass

### 5.3 Spend cap enforcement ($20/month)

- [ ] **[Codex/Opus]** Create monthly spend doc schema in Firestore (`spend/monthly/{YYYY-MM}`)
- [ ] **[Codex/Opus]** Implement `enforceSpendCap()` utility — checks spend before LLM call
- [ ] **[Codex/Opus]** Implement `recordSpend(deltaUsd)` utility — updates after LLM call
- [ ] **[Codex/Opus]** Integrate with LLM wrapper to record usage (token-based estimate)
- [ ] **[Codex/Opus]** Add unit tests for cap behavior and month key calculation
- [ ] **[Gemini 3 Pro]** TEST: Smoke test with real Vertex usage (env present)

---

## Phase 6 — Tool: "How Do I Fit?" (multi-turn)

### 6.1 Job ingestion (paste/url/file) → normalized job text

- [ ] **[Codex/Opus]** Implement text normalization from pasted content
- [ ] **[Codex/Opus]** Implement server-side URL fetch with typed failure response
- [ ] **[Codex/Opus]** Implement file extraction for PDF/DOCX/TXT/MD (max 10MB)
- [ ] **[Codex/Opus]** Validate allowed extensions and file size
- [ ] **[Codex/Opus]** Return typed failure that triggers "please paste" UI on fetch failure
- [ ] **[Codex/Opus]** Add unit tests for TXT/MD extraction
- [ ] **[Codex/Opus]** Add unit tests for input validation
- [ ] **[Gemini 3 Pro]** TEST: Optional smoke test for URL fetch on known public URL

### 6.2 Fit flow state machine (up to 5 follow-ups)

- [ ] **[Codex/Opus]** Define Fit state schema: jobText, extracted fields, followUpsAsked, history
- [ ] **[Codex/Opus]** Implement `nextQuestion(state)` function — returns question or "ready"
- [ ] **[Codex/Opus]** Apply location rules: assume worst-case if unclear and user can't clarify
- [ ] **[Codex/Opus]** Limit to max 5 follow-up questions
- [ ] **[Codex/Opus]** Add unit tests: 0..5 follow-ups, missing fields, worst-case location
- [ ] **[Codex/Opus]** TEST: Run unit tests — all state machine tests pass

### 6.3 LLM prompt + structured report generation (+ citations)

- [ ] **[Codex/Opus]** Create server-only prompt builder using extracted job fields + rules
- [ ] **[Codex/Opus]** Create LLM wrapper module for Vertex AI Gemini calls
- [ ] **[Codex/Opus]** Request structured markdown report (Well/Average/Poorly, rationales, unknowns, recommendation)
- [ ] **[Codex/Opus]** Append citations section at end
- [ ] **[Codex/Opus]** Store artifacts (.md, .html) in GCS
- [ ] **[Codex/Opus]** Store submission metadata in Firestore
- [ ] **[Gemini 3 Pro]** TEST: Smoke test with real Vertex call (env present)

### 6.4 UI wiring for Fit tool (multi-turn UX + downloads)

- [ ] **[Opus 4.5]** Build `/tools/fit` input form (paste/url/file modes)
- [ ] **[Opus 4.5]** Build follow-up Q&A UI (up to 5 questions)
- [ ] **[Opus 4.5]** Build results page with report preview
- [ ] **[Opus 4.5]** Add download button for artifact bundle
- [ ] **[Opus 4.5]** Ensure no dead ends in UI flow
- [ ] **[Gemini 3 Pro]** TEST: Playwright E2E test for happy path (use dev toggles if needed for reCAPTCHA)

---

## Phase 7 — Tool: "Get a Custom Resume"

### 7.1 Job ingestion reuse + resume context retrieval (RAG V0)

- [ ] **[Codex/Opus]** Reuse job ingestion utilities from Phase 6.1
- [ ] **[Codex/Opus]** Load resume chunks from index
- [ ] **[Codex/Opus]** Assemble context string with chunk ids/titles for LLM
- [ ] **[Codex/Opus]** Create citation entries mapping claims → chunk refs
- [ ] **[Codex/Opus]** Add unit tests for context assembly
- [ ] **[Codex/Opus]** Add unit tests for citation formatting
- [ ] **[Codex/Opus]** TEST: Run unit tests — all context/citation tests pass

### 7.2 Resume generation (2-page, factual-only) + artifacts

- [ ] **[Codex/Opus]** Create prompt for Gemini: job text + resume context chunks
- [ ] **[Codex/Opus]** Enforce "do not invent" constraint in prompt
- [ ] **[Codex/Opus]** Enforce 2-page constraint (word count / section length guidance)
- [ ] **[Codex/Opus]** Save `resume.md` + `resume.html` artifacts to GCS
- [ ] **[Codex/Opus]** Save submission metadata to Firestore
- [ ] **[Codex/Opus]** Create bundle with job input, extracted fields, resume, citations
- [ ] **[Gemini 3 Pro]** TEST: Smoke test with real Vertex call (env present)

### 7.3 UI wiring for Custom Resume

- [ ] **[Opus 4.5]** Build `/tools/resume` page
- [ ] **[Opus 4.5]** Reuse job input component from Fit tool
- [ ] **[Opus 4.5]** Show progress indicator during generation
- [ ] **[Opus 4.5]** Show results preview
- [ ] **[Opus 4.5]** Add download bundle link
- [ ] **[Gemini 3 Pro]** TEST: Playwright E2E test for happy path

---

## Phase 8 — Tool: "Interview Me Now" (career-only chat)

### 8.1 Career-only policy + guardrails

- [ ] **[Codex/Opus]** Define allowed/disallowed topics (career-only scope)
- [ ] **[Codex/Opus]** Implement lightweight topic classifier (simple rules + optional LLM)
- [ ] **[Codex/Opus]** Create standard refusal/redirect response for off-topic queries
- [ ] **[Codex/Opus]** Add unit tests for several disallowed examples
- [ ] **[Codex/Opus]** TEST: Run unit tests — all guardrail tests pass

### 8.2 Chat endpoint + transcript artifact

- [ ] **[Codex/Opus]** Create `POST /api/tools/interview` route
- [ ] **[Codex/Opus]** Accept user message + conversation id
- [ ] **[Codex/Opus]** Retrieve resume context (RAG V0)
- [ ] **[Codex/Opus]** Apply guardrails before LLM call
- [ ] **[Codex/Opus]** Call Gemini and return assistant response
- [ ] **[Codex/Opus]** Persist transcript to GCS
- [ ] **[Codex/Opus]** Include citations at end of transcript export
- [ ] **[Gemini 3 Pro]** TEST: Smoke test with real Vertex call (env present)

### 8.3 UI wiring for Interview tool

- [ ] **[Opus 4.5]** Build `/tools/interview` page
- [ ] **[Opus 4.5]** Create chat transcript view (message history)
- [ ] **[Opus 4.5]** Create input box for user messages
- [ ] **[Opus 4.5]** Wire up to interview endpoint
- [ ] **[Opus 4.5]** Add download transcript bundle button
- [ ] **[Gemini 3 Pro]** TEST: Playwright E2E test for short allowed conversation

---

## Phase 9 — Retention Cleanup + Admin Submissions Viewer

### 9.1 Admin submissions list + details view

- [ ] **[Opus 4.5]** Create `/admin/submissions` page with list view
- [ ] **[Codex/Opus]** Server-side fetch recent submissions from Firestore
- [ ] **[Opus 4.5]** Create detail view page for individual submission
- [ ] **[Codex/Opus]** Ensure admin auth protection on routes
- [ ] **[Codex/Opus]** Add component tests for list rendering
- [ ] **[Codex/Opus]** TEST: Run unit tests — submissions UI tests pass

### 9.2 Retention deletion route (90-day) + scheduler integration

- [ ] **[Codex/Opus]** Create `POST /api/maintenance/retention` route
- [ ] **[Codex/Opus]** Query Firestore for submissions where `expiresAt <= now`
- [ ] **[Codex/Opus]** Delete associated GCS objects/prefix
- [ ] **[Codex/Opus]** Delete Firestore docs after GCS cleanup
- [ ] **[Codex/Opus]** Make idempotent and safe on retries
- [ ] **[Codex/Opus]** Log minimally (no secrets)
- [ ] **[Codex/Opus]** Add unit tests for expiry filtering logic
- [ ] **[Gemini 3 Pro]** TEST: Manual run in dev project with real data

---

## Phase 10 — Hardening + Deployment Checklist (Cloud Run)

### 10.1 Observability and error handling

- [ ] **[Codex/Opus]** Define typed errors: blocked(rate limit), blocked(spend cap), validation, upstream fetch failed, LLM failed
- [ ] **[Codex/Opus]** Create standard JSON error response shape
- [ ] **[Codex/Opus]** Add correlation id per request (optional)
- [ ] **[Codex/Opus]** Ensure no secrets logged in error messages
- [ ] **[Codex/Opus]** Add unit tests for error serialization
- [ ] **[Codex/Opus]** TEST: Run unit tests — all error handling tests pass

### 10.2 Cloud Run configuration (non-code checklist)

- [ ] **[You]** Configure service account permissions for Firestore + Storage
- [ ] **[You]** Set env vars in Cloud Run / Secret Manager (no secrets in repo)
- [ ] **[You]** Set `www` redirect at DNS/load balancer layer
- [ ] **[You]** Configure GCP Billing Budget email alerts to `sam@samkirk.com`
- [ ] **[You]** Configure Cloud Scheduler to call retention endpoint daily
- [ ] **[Gemini 3 Pro]** TEST: Full E2E test of deployed application

---

## Summary

| Phase | Focus | Primary Model |
|-------|-------|---------------|
| 0 | Project foundation | Codex/Opus + Opus 4.5 (UI) |
| 1 | Static content | Opus 4.5 (UI) + Codex/Opus |
| 2 | GCP primitives | Codex/Opus |
| 3 | Admin + uploads | Codex/Opus + Opus 4.5 (UI) |
| 4 | Artifact plumbing | Codex/Opus |
| 5 | Guardrails | Codex/Opus |
| 6 | "How Do I Fit?" | Codex/Opus + Opus 4.5 (UI) |
| 7 | "Custom Resume" | Codex/Opus + Opus 4.5 (UI) |
| 8 | "Interview Me" | Codex/Opus + Opus 4.5 (UI) |
| 9 | Retention + admin | Codex/Opus + Opus 4.5 (UI) |
| 10 | Hardening | Codex/Opus + Gemini 3 Pro (E2E) |

---

**Workflow reminder:** After completing each step, check off items here. Start fresh chats between steps using `/start-step` or `/continue-step` to maintain context quality.
