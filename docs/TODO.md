# samkirk.com v3 — Implementation TODO

> Generated from `docs/BLUEPRINT.md` per the Dylan Davis methodology.
> 
> **Model labels** follow the heuristics:
> - **[Codex/Opus]** — Backend logic, APIs, data models
> - **[Opus 4.5]** — UI/Frontend components, layout, styling
> - **[Gemini 3 Pro]** — Debugging, visual testing, E2E tests with browser
> - **[Sonnet 4]** — Quick fixes, minor tweaks
>
> **Smoke test note:** There is a single GCP smoke test script (`web/scripts/smoke-gcp.ts`) that is progressively extended as new features are implemented. Each phase adds new test sections to this script rather than creating separate test files. Run with `npm run smoke:gcp` from the `web/` folder.

---

## Table of Contents

- [Phase 0 — Project Foundation](#phase-0--project-foundation-tests-env-ui-shell)
  - [0.1 Add test tooling](#01-add-test-tooling-vitest--react-testing-library)
  - [0.2 Add typed env validation](#02-add-typed-env-validation-server-only-secrets)
  - [0.3 Create site layout + navigation skeleton](#03-create-site-layout--navigation-skeleton)
- [Phase 1 — Static Content Pages](#phase-1--static-content-pages-song--explorations)
  - [1.1 Add exploration pages](#11-add-exploration-pages-with-static-html-content)
  - [1.2 Add song dedication page](#12-add-song-dedication-page)
- [Phase 2 — GCP Integration Primitives](#phase-2--gcp-integration-primitives-firestore--gcs--sessions)
  - [2.1 Create server utilities](#21-create-server-utilities-for-firestore--gcs-access)
  - [2.2 Implement session cookie](#22-implement-session-cookie--session-doc)
- [Phase 3 — Admin Auth + Uploads](#phase-3--admin-auth--uploads-resume--dance-menu)
  - [3.1 Add admin authentication](#31-add-admin-authentication-google-oauth-email-allowlist)
  - [3.2 Admin: upload master resume](#32-admin-uploadreplace-master-resume-markdown)
  - [3.3 Resume indexing V0](#33-resume-indexing-v0-chunking--citations-metadata)
  - [3.4 Admin: upload Dance Menu](#34-admin-uploadpublish-dance-menu-bundle)
- [Phase 4 — Shared "Artifact" Plumbing](#phase-4--shared-artifact-plumbing-submissions--downloads)
  - [4.1 Define submission schema](#41-define-submission-schema--firestore-helpers)
  - [4.2 Implement artifact writer](#42-implement-artifact-writer--bundle-download)
- [Phase 5 — Guardrails](#phase-5--guardrails-captcha-rate-limit-spend-cap)
  - [5.1 reCAPTCHA verification](#51-recaptcha-verification-endpoint--client-widget)
  - [5.2 Rate limiting utility](#52-rate-limiting-utility-10-requests--10-minutes)
  - [5.3 Spend cap enforcement](#53-spend-cap-enforcement-20month)
- [Phase 6 — Tool: "How Do I Fit?"](#phase-6--tool-how-do-i-fit-multi-turn)
  - [6.1 Job ingestion](#61-job-ingestion-pasteurlfile--normalized-job-text)
  - [6.2 Fit flow state machine](#62-fit-flow-state-machine-up-to-5-follow-ups)
  - [6.3 LLM prompt + report generation](#63-llm-prompt--structured-report-generation--citations)
  - [6.4 UI wiring for Fit tool](#64-ui-wiring-for-fit-tool-multi-turn-ux--downloads)
- [Phase 7 — Tool: "Get a Custom Resume"](#phase-7--tool-get-a-custom-resume)
  - [7.1 Job ingestion reuse + RAG](#71-job-ingestion-reuse--resume-context-retrieval-rag-v0)
  - [7.2 Resume generation](#72-resume-generation-2-page-factual-only--artifacts)
  - [7.3 UI wiring for Custom Resume](#73-ui-wiring-for-custom-resume)
- [Phase 8 — Tool: "Interview Me Now"](#phase-8--tool-interview-me-now-career-only-chat)
  - [8.1 Career-only policy + guardrails](#81-career-only-policy--guardrails)
  - [8.2 Chat endpoint + transcript](#82-chat-endpoint--transcript-artifact)
  - [8.3 UI wiring for Interview tool](#83-ui-wiring-for-interview-tool)
- [Phase 9 — Retention Cleanup + Admin](#phase-9--retention-cleanup--admin-submissions-viewer)
  - [9.1 Admin submissions list](#91-admin-submissions-list--details-view)
  - [9.2 Retention deletion route](#92-retention-deletion-route-90-day--scheduler-integration)
- [Phase 10 — Hardening + Deployment](#phase-10--hardening--deployment-checklist-cloud-run)
  - [10.1 Observability and error handling](#101-observability-and-error-handling)
  - [10.2 Cloud Run configuration](#102-cloud-run-configuration-non-code-checklist)
- [Summary](#summary)

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
- [x] **[Gemini 3 Pro]** TEST: Run smoke script with real GCP credentials to verify integration
  - [x] Complete GCP setup checklist in `docs/GCP-SETUP.md`
- [x] **[You]** Full MacBook Pro backup with TimeMachine

### 2.2 Implement session cookie + session doc

- [x] **[Codex/Opus]** Create `POST /api/session/init` route
- [x] **[Codex/Opus]** Implement session id generation (cryptographically random)
- [x] **[Codex/Opus]** Set httpOnly, secure (prod), sameSite cookie
- [x] **[Codex/Opus]** Create session doc in Firestore with `createdAt`, `expiresAt`
- [x] **[Codex/Opus]** Add unit tests for session id/cookie logic
- [x] **[Gemini 3 Pro]** TEST: Smoke test session creation with real Firestore (env present)

---

## Phase 3 — Admin Auth + Uploads (resume + dance menu)

### 3.1 Add admin authentication (Google OAuth, email allowlist)

- [x] **[Codex/Opus]** Configure NextAuth.js (or similar) with Google OAuth provider
- [x] **[Codex/Opus]** Implement email allowlist check (allowed email from env)
- [x] **[Codex/Opus]** Protect `/admin/**` pages with auth middleware
- [x] **[Codex/Opus]** Protect `/api/admin/**` routes with auth check
- [x] **[Codex/Opus]** Add unit tests for allowlist logic
- [x] **[Gemini 3 Pro]** TEST: Manual smoke test OAuth flow in dev with real credentials

### 3.2 Admin: upload/replace master resume markdown

- [x] **[Opus 4.5]** Create `/admin/resume` page with file input for `.md` files
- [x] **[Codex/Opus]** Create `POST /api/admin/resume` route
- [x] **[Codex/Opus]** Validate file type (markdown) and size (max 10MB)
- [x] **[Codex/Opus]** Store uploaded file to private GCS as `resume/master.md`
- [x] **[Codex/Opus]** Update Firestore `resumeIndex/current` metadata
- [x] **[Codex/Opus]** Add unit tests for validation + storage path building
- [x] **[Gemini 3 Pro]** TEST: Smoke test with real GCS + Firestore (env present)
  - Run from `web/` folder: `npm run smoke:gcp`
  - Verifies: write resume.md to GCS, update resumeIndex/current in Firestore
  - Restores original data if resume already exists

### 3.3 Resume indexing V0 (chunking + citations metadata)

- [x] **[Codex/Opus]** Write markdown chunker that splits by headings + size limits
- [x] **[Codex/Opus]** Define chunk schema: `{chunkId, title, sourceRef, content}`
- [x] **[Codex/Opus]** Persist chunks to Firestore `resumeChunks` collection (keyed by version)
- [x] **[Codex/Opus]** Update `resumeIndex/current` with version + chunk count
- [x] **[Codex/Opus]** Add thorough unit tests for chunking + stable chunk ids
- [x] **[Codex/Opus]** TEST: Run unit tests — all chunking tests pass

### 3.4 Admin: upload/publish Dance Menu bundle

- [x] **[Opus 4.5]** Create `/admin/dance-menu` page with multi-file upload UI
- [x] **[Codex/Opus]** Create `POST /api/admin/dance-menu` route
- [x] **[Codex/Opus]** Validate bundle contains required extensions: `.md`, `.txt`, `.html`
- [x] **[Codex/Opus]** Store files to public GCS bucket under `dance-menu/current/`
- [x] **[Opus 4.5]** Update `/dance-menu` page to render HTML version + download links
  - Implemented `/api/public/[...path]` proxy to bypass org-level public access prevention
- [x] **[Codex/Opus]** Add unit tests for bundle validation rules
- [x] **[Gemini 3 Pro]** TEST: Manual smoke test for public bucket permissions
  - Verified SDK access works via `npm run smoke:gcp`
  - Verified public HTTP access is blocked (as expected)
  - Proxy integration tests pass (3/3): serve file, 404 handling, directory traversal blocking
  - Re-verified during Step 5.2: `npm test -- --run --testNamePattern="Public Proxy"` passes all 3 tests

---

## Phase 4 — Shared "Artifact" Plumbing (submissions + downloads)

### 4.1 Define submission schema + Firestore helpers

- [x] **[Codex/Opus]** Define typed `Submission` interface (tool, createdAt, expiresAt, status, inputs, extracted, outputs, citations, artifactGcsPrefix)
- [x] **[Codex/Opus]** Implement `createSubmission()` helper (sets expiresAt = now + 90 days)
- [x] **[Codex/Opus]** Implement `updateSubmission()` helper
- [x] **[Codex/Opus]** Implement `completeSubmission()` helper
- [x] **[Codex/Opus]** Add unit tests for TTL computation and schema validation
- [x] **[Codex/Opus]** TEST: Run unit tests — all submission tests pass

### 4.2 Implement artifact writer + bundle download

- [x] **[Codex/Opus]** Create markdown-to-HTML renderer utility (server-side)
- [x] **[Codex/Opus]** Create zip bundler utility (writes bundle.zip to GCS or streams)
- [x] **[Codex/Opus]** Create `GET /api/submissions/[id]/download` route
- [x] **[Codex/Opus]** Return zip containing inputs/extracted/outputs/citations
- [x] **[Codex/Opus]** Add unit tests for markdown rendering
- [x] **[Codex/Opus]** Add unit tests for bundle file list generation
- [x] **[Gemini 3 Pro]** TEST: Smoke test with real GCS write + download + submission CRUD (env present)
  - Run from `web/` folder: `npm run smoke:gcp`
  - Verifies: Submission CRUD in Firestore (create, read, update, delete)
  - Verifies: Artifact files write/read to GCS private bucket
  - Verifies: 90-day TTL correctly calculated on submission docs

---

## Phase 5 — Guardrails (captcha, rate limit, spend cap)

### 5.1 reCAPTCHA verification endpoint + client widget

- [x] **[Opus 4.5]** Create reCAPTCHA v2 checkbox client component (uses site key env var)
- [x] **[Codex/Opus]** Create `POST /api/captcha/verify` route
- [x] **[Codex/Opus]** Verify token with Google reCAPTCHA API (server-only secret)
- [x] **[Codex/Opus]** Store `captchaPassedAt` on session doc in Firestore
- [x] **[Codex/Opus]** Wire tool pages to require captcha before calling tool endpoints
- [x] **[Codex/Opus]** Add unit tests for verification request formatting
- [x] **[Gemini 3 Pro]** TEST: Manual E2E test with real reCAPTCHA keys
  - See [GCP-SETUP.md § 8.3 Manual E2E Test Procedure](GCP-SETUP.md#83-manual-e2e-test-procedure)

### 5.2 Rate limiting utility (10 requests / 10 minutes)

- [x] **[Codex/Opus]** Create rate limit key derivation (session+ip hash)
- [x] **[Codex/Opus]** Implement Firestore-backed counter with `windowStart`, `count`, `expiresAt`
- [x] **[Codex/Opus]** Create `enforceRateLimit(req)` utility — throws typed error when blocked
- [x] **[Codex/Opus]** Apply to all `/api/tools/**` endpoints
- [x] **[Codex/Opus]** Return friendly "contact sam@samkirk.com" error payload when blocked
- [x] **[Codex/Opus]** Add unit tests for counter increments and window behavior
- [x] **[Codex/Opus]** TEST: Run unit tests — all rate limit tests pass
  - 50 unit tests in `src/lib/rate-limit.test.ts` covering:
    - Constants validation (4 tests)
    - `RateLimitError` class behavior and JSON serialization (6 tests)
    - IP extraction from `X-Forwarded-For`, `X-Real-IP`, and fallback (9 tests)
    - Key derivation consistency and format (7 tests)
    - Window creation and timestamp calculation (7 tests)
    - Window expiration detection edge cases (6 tests)
    - Remaining time calculation (5 tests)
    - Integration scenarios and counter simulation (6 tests)

### 5.3 Spend cap enforcement ($20/month)

- [x] **[Codex/Opus]** Create monthly spend doc schema in Firestore (`spendMonthly/{YYYY-MM}`)
- [x] **[Codex/Opus]** Implement `enforceSpendCap()` utility — checks spend before LLM call
- [x] **[Codex/Opus]** Implement `recordSpend(deltaUsd)` utility — updates after LLM call
- [x] **[Codex/Opus]** Integrate with LLM wrapper to record usage (token-based estimate)
  - Created `recordSpendFromTokens()` and cost estimation functions
  - Also includes `estimateLlmCost()` and `estimateTokensFromText()` helpers
- [x] **[Codex/Opus]** Add unit tests for cap behavior and month key calculation
  - 60 unit tests in `src/lib/spend-cap.test.ts` covering:
    - Constants validation (7 tests)
    - `SpendCapError` class and JSON serialization (5 tests)
    - Month key calculation and UTC handling (12 tests)
    - Cost estimation for LLM calls (8 tests)
    - Token estimation from text (5 tests)
    - Spend doc creation and budget checking (13 tests)
    - Integration scenarios (4 tests)
- [x] **[Gemini 3 Pro]** TEST: Smoke test with real Vertex usage (env present)
  - Added Section 9 ("Spend Cap Test") to `web/scripts/smoke-gcp.ts`
  - Run with: `cd web && npm run smoke:gcp`
  - Verifies: doc creation at `spendMonthly/{YYYY-MM}`, atomic spend increment via Firestore transactions, cap detection at $20
  - Unit tests: `npm test -- --run --testNamePattern="spend-cap"` → 60/60 passed
  - Lint: `npm run lint` → clean (0 errors, 0 warnings)

---

## Phase 6 — Tool: "How Do I Fit?" (multi-turn)

### 6.1 Job ingestion (paste/url/file) → normalized job text

- [x] **[Codex/Opus]** Implement text normalization from pasted content
- [x] **[Codex/Opus]** Implement server-side URL fetch with typed failure response
- [x] **[Codex/Opus]** Implement file extraction for PDF/DOCX/TXT/MD (max 10MB)
- [x] **[Codex/Opus]** Validate allowed extensions and file size
- [x] **[Codex/Opus]** Return typed failure that triggers "please paste" UI on fetch failure
- [x] **[Codex/Opus]** Add unit tests for TXT/MD extraction
- [x] **[Codex/Opus]** Add unit tests for input validation
- [x] **[Gemini 3 Pro]** TEST: Optional smoke test for URL fetch on known public URL
  - Added as Section 9 to `npm run smoke:gcp`
  - Tests httpbin.org/html and example.com
  - Run with: `npm run smoke:gcp -- --section=9`

### 6.2 Fit flow state machine (up to 5 follow-ups)

- [x] **[Codex/Opus]** Define Fit state schema: jobText, extracted fields, followUpsAsked, history
- [x] **[Codex/Opus]** Implement `nextQuestion(state)` function — returns question or "ready"
- [x] **[Codex/Opus]** Apply location rules: assume worst-case if unclear and user can't clarify
- [x] **[Codex/Opus]** Limit to max 5 follow-up questions
- [x] **[Codex/Opus]** Add unit tests: 0..5 follow-ups, missing fields, worst-case location
- [x] **[Codex/Opus]** TEST: Run unit tests — all state machine tests pass
  - 96 unit tests — see [TEST-RESULTS.md § Fit Flow State Machine](TEST-RESULTS.md#fit-flow-state-machine-step-62)

### 6.3 LLM prompt + structured report generation (+ citations)

- [x] **[Codex/Opus]** Create server-only prompt builder using extracted job fields + rules
- [x] **[Codex/Opus]** Create LLM wrapper module for Vertex AI Gemini calls
- [x] **[Codex/Opus]** Request structured markdown report (Well/Average/Poorly, rationales, unknowns, recommendation)
- [x] **[Codex/Opus]** Append citations section at end
- [x] **[Codex/Opus]** Store artifacts (.md, .html) in GCS
- [x] **[Codex/Opus]** Store submission metadata in Firestore
- [x] **[Gemini 3 Pro]** TEST: Smoke test with real Vertex call (env present)
  - Added Section 10 ("Vertex AI Gemini Test") to `web/scripts/smoke-gcp.ts`
  - Run with: `npm run smoke:gcp -- --section=10`
  - Tests: simple generation, structured JSON output, spend tracking integration
  - Unit tests: 36 tests in `src/lib/fit-report.test.ts`, 19 tests in `src/lib/vertex-ai.test.ts`
  - See [TEST-RESULTS.md § Vertex AI LLM Wrapper](TEST-RESULTS.md#vertex-ai-llm-wrapper-step-63) and [TEST-RESULTS.md § Fit Report Generator](TEST-RESULTS.md#fit-report-generator-step-63)

### 6.4 UI wiring for Fit tool (multi-turn UX + downloads)

- [x] **[Opus 4.5]** Build `/tools/fit` input form (paste/url/file modes)
  - Paste mode: full textarea for job text
  - URL mode: input field with server-side fetch
  - File mode: upload UI (stub - redirects to paste for now)
- [x] **[Opus 4.5]** Build follow-up Q&A UI (up to 5 questions)
  - Radio button options for predefined answers
  - Free text input for open questions
  - Progress indicator showing question X of 5
- [x] **[Opus 4.5]** Build results page with report preview
  - Overall score badge (Well/Average/Poorly with icons)
  - Category breakdown cards with individual scores
  - Unknowns/assumptions section
- [x] **[Opus 4.5]** Add download button for artifact bundle
  - Downloads zip via `/api/submissions/[id]/download`
- [x] **[Opus 4.5]** Ensure no dead ends in UI flow
  - Error states have "Try Again" button
  - Complete state has "Analyze Another Job" button
  - Loading states show spinners with descriptive text
- [x] **[Gemini 3 Pro]** TEST: Playwright E2E test for happy path (use dev toggles if needed for reCAPTCHA)
  - 5 E2E tests pass: full flow, starting over, URL mode, validation, error handling
  - Uses E2E test mode for captcha bypass (`E2E_TESTING=true`)
  - Uses mock fit report when no resume chunks available in E2E mode
  - Run with: `cd web && npx playwright test --headed`

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
