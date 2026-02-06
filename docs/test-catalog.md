# Test Catalog — samkirk-v3

> Authoritative catalog of all automated tests. Each entry represents one top-level `describe` block (unit tests) or test group (E2E/scripts). Individual `it`/`test` counts are listed per entry.

## Overview

| Suite | Entries | Individual Tests | How to Run | GCP Required |
|-------|---------|-----------------|------------|--------------|
| Unit (Vitest) | 25 | 1,149 | `cd web && npm test` | No (2 tests in public-proxy need GCP) |
| E2E (Playwright) | 14 | 47 | `cd web && npx playwright test` | Partial (some tests need GCP/LLM) |
| E2E Real LLM | 3 | 3 | `cd web && npm run test:e2e:real` | Yes |
| GCP Smoke | 13 | 13 | `cd web && npm run smoke:gcp` | Yes |
| **Total** | **55** | **1,212** | `cd web && npm run test:all` | — |

---

## 1. Unit Tests (Vitest)

All unit tests run with `cd web && npm test`. No GCP credentials required unless noted.

### 1.1 Session Management

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-001 | Session module | Tests session ID generation (base64url, uniqueness, entropy), validation (length, charset, edge cases), cookie options (httpOnly, secure per env, sameSite, maxAge), timestamp creation (Firestore Timestamp, TTL offset), IP hashing (deterministic, hex output, IPv6), and exported constants. | Test | Unit | 10.1 | `web/src/lib/session.test.ts` | 34 | `npm test -- session.test` | No |

### 1.2 Authentication

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-002 | Admin email allowlist | Tests email allowlist matching: null/undefined/empty rejection, case-insensitive comparison, exact-match-only semantics, prefix/suffix attack resistance, and missing env var warning. | Test | Unit | 9 | `web/src/lib/auth.test.ts` | 11 | `npm test -- auth.test` | No |

### 1.3 Environment

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-003 | Environment parsing | Tests Zod-based env parsing: valid environment acceptance, missing required value rejection, and empty string rejection with descriptive error messages. | Test | Unit | 6 | `web/src/lib/env.test.ts` | 3 | `npm test -- env.test` | No |

### 1.4 CAPTCHA

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-004 | CAPTCHA verification helpers | Tests reCAPTCHA request body construction (secret, token, optional remoteip, special chars) and error code mapping (missing-input, invalid-input, timeout, bad-request, server config, unknown codes, multi-code priority). | Test | Unit | 10.1 | `web/src/lib/captcha.test.ts` | 11 | `npm test -- captcha.test` | No |

### 1.5 Rate Limiting

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-005 | Rate limit module | Tests constants, RateLimitError class, client IP extraction from headers (x-forwarded-for, x-real-ip, fallback), rate limit key derivation, sliding window creation and expiration, remaining-time calculation, window behavior across boundaries, key-to-window integration, counter increment simulation, and error message formatting. | Test | Unit | 10.2 | `web/src/lib/rate-limit.test.ts` | 50 | `npm test -- rate-limit.test` | No |

### 1.6 Spend Cap

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-006 | Monthly spend cap module | Tests constants, SpendCapError class, month key generation/parsing/rollover, LLM cost estimation (input/output tokens, mixed, edge cases), text-to-token estimation, monthly doc creation, cap exceeded logic (under/at/over budget, no doc), remaining budget calculation, month boundary scenarios, cost estimation scenarios, and integration flows. | Test | Unit | 10.3 | `web/src/lib/spend-cap.test.ts` | 60 | `npm test -- spend-cap.test` | No |

### 1.7 Firestore Paths

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-007 | Firestore path helpers | Tests Firestore document reference construction for sessions, submissions, rate limits, spend caps, resume index, and resume chunks — verifying correct collection paths and document IDs. | Test | Unit | 11 | `web/src/lib/firestore.test.ts` | 10 | `npm test -- firestore.test` | No |

### 1.8 Storage Paths

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-008 | Storage path helpers | Tests GCS path construction for submission artifacts, resume uploads, dance menu files, and public assets — verifying correct bucket selection and prefix patterns. | Test | Unit | 11 | `web/src/lib/storage.test.ts` | 10 | `npm test -- storage.test` | No |

### 1.9 API Error Handling

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-009 | API error handling framework | Tests ERROR_STATUS_CODES mapping, correlation ID generation/extraction/header, createErrorResponse (status codes, JSON body, headers, correlation IDs), error serialization, sensitive data detection and redaction, error sanitization for logging, logError/logWarning helpers, AppError class (codes, status, toResponse, toJSON, chaining), factory functions (sessionError, captchaRequiredError, validationError, internalError), type guards (isAppError, hasErrorCode, hasToResponse, hasToJSON), and integration scenarios. | Test | Unit | 13 | `web/src/lib/api-errors.test.ts` | 107 | `npm test -- api-errors.test` | No |

### 1.10 Job Ingestion

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-010 | Job ingestion pipeline | Tests constants, JobIngestionError class, file extension detection, allowed extension validation, text normalization, word counting, ingestion result creation, paste ingestion (valid text, whitespace, empty, too short/long), HTML entity decoding, HTML text extraction, URL ingestion (HTML fetch, content-type handling, error cases), file metadata validation (size, extension, MIME type), text file extraction, file ingestion flow, unified ingestJob dispatcher, edge cases, and real-world HTML examples. | Test | Unit | 8.1 | `web/src/lib/job-ingestion.test.ts` | 74 | `npm test -- job-ingestion.test` | No |

### 1.11 Fit Tool Flow

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-011 | Fit tool flow state machine | Tests constants (MAX_FOLLOW_UPS, HOME_LOCATION, MAX_COMMUTE_MINUTES, MAX_ONSITE_DAYS), initial state/field creation, seniority extraction (all levels + priority), location type extraction (remote/hybrid/onsite/ambiguous), location fit evaluation (remote, onsite commute, hybrid days+commute), worst-case location application, follow-up question generation (priority ordering, max limit), nextQuestion state machine (error/ready/question transitions), follow-up counting (0-5 boundary), answer processing (validation, type matching, history tracking), applyAnswerToExtracted (location/frequency/seniority/skills), commute estimation by city, flow initialization with job text parsing, finalization for report, readiness checks, unknown field listing, and full flow integration scenarios (remote, hybrid multi-follow-up, worst-case, 5-follow-up limit). | Test | Unit | 8.1 | `web/src/lib/fit-flow.test.ts` | 96 | `npm test -- fit-flow.test` | No |

### 1.12 Fit Report Generation

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-012 | Fit report generation | Tests system prompt structure, extracted field formatting (all permutations of known/unknown fields), fit analysis prompt construction (job text, resume context, extracted data), LLM response parsing (valid JSON, malformed, missing fields, markdown-wrapped), markdown report generation (headings, scores, categories, citations, unknowns), citation generation from chunk references, and FitReportError class. | Test | Unit | 8.1, 8.4 | `web/src/lib/fit-report.test.ts` | 36 | `npm test -- fit-report.test` | No |

### 1.13 Resume RAG Context

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-013 | Resume RAG context assembly | Tests chunk formatting (title, content, source ref), context assembly from multiple chunks (ordering, deduplication, size limits), getResumeContext with Firestore integration, citation generation from chunks, citation generation for referenced chunks, citation map creation, context summary statistics, resume context availability check, context size calculation, context-and-citation integration, and edge cases (empty chunks, missing fields, very large content). | Test | Unit | 8.2, 8.4 | `web/src/lib/resume-context.test.ts` | 50 | `npm test -- resume-context.test` | No |

### 1.14 Resume Generation

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-014 | Resume generation logic | Tests constants (word limits, section limits), system prompt structure and constraints, prompt construction (job text, resume context, format instructions), response parsing (valid JSON, malformed, missing sections, markdown-wrapped, experience/skills/education validation), markdown resume generation (header, summary, skills, experience bullets, education, formatting), word counting (per-section and total), ResumeGeneratorError class, and type definition validation. | Test | Unit | 8.2 | `web/src/lib/resume-generator.test.ts` | 62 | `npm test -- resume-generator.test` | No |

### 1.15 Resume Upload Validation

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-015 | Resume upload validation | Tests file extension detection, allowed extension checking (pdf, doc, docx, txt, md), file metadata validation (size limits, extension, MIME type mismatches, zero-byte files), file content validation (magic bytes, encoding), bundle validation (complete bundles, missing required files), format display name mapping, and upload constants. | Test | Unit | 8.2 | `web/src/lib/resume-upload.test.ts` | 22 | `npm test -- resume-upload.test` | No |

### 1.16 Resume Chunking

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-016 | Resume markdown chunking | Tests line parsing, heading extraction (levels, nested), section parsing from markdown, chunk ID generation (deterministic, unique), content hashing (SHA-256, stability), title generation from section content, source reference generation, large section splitting (by paragraph and line), full markdown chunking pipeline (section boundaries, metadata, ordering), chunk ID stability across runs, and edge cases (empty input, single line, no headings, deeply nested). | Test | Unit | 8.2 | `web/src/lib/resume-chunker.test.ts` | 49 | `npm test -- resume-chunker.test` | No |

### 1.17 Interview Chat

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-017 | Interview chat module | Tests constants (max turns, token limits), system prompt construction (resume context injection, behavioral guidelines), transcript generation (markdown formatting, turn labeling, timestamps), message processing (input validation, turn counting, history management, error handling, empty/oversized messages), getOrCreateConversation (new creation, existing retrieval, expiration), and InterviewChatError class. | Test | Unit | 8.3 | `web/src/lib/interview-chat.test.ts` | 44 | `npm test -- interview-chat.test` | No |

### 1.18 Interview Guardrails

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-018 | Interview guardrails classification | Tests constants (confidence thresholds, category lists), topic classification for allowed categories (work_history, projects, skills, education, availability, location_remote, compensation, career_goals, interview_meta), topic classification for disallowed categories (personal_life, politics, medical, religion, financial_private, general_assistant, prompt_injection, inappropriate), edge cases (empty input, very long input, mixed topics), checkGuardrails integration (allowed pass-through, blocked with redirect), redirect response generation (topic-specific, generic, persistent off-topic), persistent off-topic detection, classification prompt building, LLM response parsing, allowed/disallowed category accessors, confidence level handling, real-world interview questions, prompt injection resistance, general assistant rejection, and result structure validation. Uses `it.each` for parameterized coverage across 147 message samples. | Test | Unit | 8.3 | `web/src/lib/interview-guardrails.test.ts` | 175 | `npm test -- interview-guardrails.test` | No |

### 1.19 Submission Management

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-019 | Submission module | Tests constants (TTL, collection names), submission ID generation (format, uniqueness), ID validation (length, charset, edge cases), timestamp creation (createdAt, expiresAt, TTL offset), timestamp creation from specific dates, expiration calculation, submission expiration check (before/at/after expiry, no expiresAt), artifact GCS prefix construction, tool validation, status validation, citation validation (structure, required fields, URL format, edge cases), citations array validation, TTL computation edge cases, ListSubmissionsOptions type, and SubmissionWithId type. | Test | Unit | 11 | `web/src/lib/submission.test.ts` | 53 | `npm test -- submission.test` | No |

### 1.20 Data Retention

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-020 | Retention cleanup module | Tests constants (retention period, batch sizes), expiration check logic (before/at/after expiry, timestamps), submission prefix validation (format, edge cases), submission ID extraction from GCS prefixes, cleanup summary building (counts, status aggregation, error tracking, empty results), ExpiredSubmission type structure, DeletionResult type structure, RetentionCleanupResult type structure, retention policy edge cases (exactly at boundary, leap years, timezone), idempotency scenarios, and security considerations (prefix injection, traversal). | Test | Unit | 11 | `web/src/lib/retention.test.ts` | 55 | `npm test -- retention.test` | No |

### 1.21 Markdown Rendering

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-021 | Markdown renderer | Tests renderMarkdown (headings, paragraphs, lists, code blocks, links, emphasis, tables, nested structures), renderMarkdown with fullDocument option (HTML wrapper, CSS injection), renderMarkdownSync, sanitizeHtml (XSS prevention, script/iframe/event handler removal, safe tags preserved), escapeHtml (entity encoding), wrapInDocument (HTML5 structure, custom CSS), renderCitationsHtml (citation list, links, empty array), renderCitationsMarkdown, appendCitationsToMarkdown, renderMarkdownWithCitations (combined output), and DEFAULT_MARKDOWN_CSS constants. | Test | Unit | 8.4 | `web/src/lib/markdown-renderer.test.ts` | 56 | `npm test -- markdown-renderer.test` | No |

### 1.22 Dance Menu Upload

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-022 | Dance menu upload validation | Tests file extension detection, allowed extension checking (pdf, jpg, png, webp), file metadata validation (size, extension, MIME type), file content validation (magic bytes, encoding detection), bundle validation (complete upload, missing files), format display name mapping, and upload constants. | Test | Unit | 8.5 | `web/src/lib/dance-menu-upload.test.ts` | 29 | `npm test -- dance-menu-upload.test` | No |

### 1.23 Artifact Bundling

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-023 | Artifact bundler | Tests createBundle (fit/resume/interview tool bundles, file paths, metadata, content types, error cases), getExpectedBundleFiles (per-tool file manifests, required vs optional, unknown tools), validateBundleFiles (completeness checks, missing file detection), and bundle structure validation for each tool type. | Test | Unit | 11 | `web/src/lib/artifact-bundler.test.ts` | 30 | `npm test -- artifact-bundler.test` | No |

### 1.24 Vertex AI Error Handling

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-024 | Vertex AI error classes | Tests ContentBlockedError (message, code, safety ratings, response metadata), GenerationError (message, code, cause chaining), isSpendCapError type guard, isContentBlockedError type guard, isGenerationError type guard, and error inheritance chains (Error -> AppError -> specific errors). | Test | Unit | 7 | `web/src/lib/vertex-ai.test.ts` | 19 | `npm test -- vertex-ai.test` | No |

### 1.25 Public Proxy API

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-025 | Public proxy API route | Tests GCS file serving via proxy (status 200, content-type, cache-control headers), 404 for missing files (GCP integration), and directory traversal blocking (unit test, no GCP). | Test | Unit | 11 | `web/src/app/api/public/[...path]/route.test.ts` | 3 | `npm test -- route.test` | Partial (2 of 3) |

---

## 2. E2E Tests (Playwright)

All E2E tests run with `cd web && npx playwright test`. Requires the dev server running on port 3000.

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-600 | Full app — Public pages | Verifies all public pages render correctly: home page (h1, navigation, tools link), tools hub (heading, links to all three tools), dance menu page, song dedication page, and explorations hub (heading, category theory link). | Test | E2E | 8.5, 8.6 | `web/e2e/full-app.spec.ts` (Public Pages) | 5 | `npx playwright test full-app` | No |
| TEST-601 | Full app — Exploration pages | Verifies exploration sub-pages render correctly: category theory, pocket flow, dance instruction, and uber-level AI skills pages each load with a visible h1. | Test | E2E | 8.6 | `web/e2e/full-app.spec.ts` (Exploration Pages) | 4 | `npx playwright test full-app` | No |
| TEST-602 | Full app — Admin auth required | Verifies admin pages redirect to login when unauthenticated: admin landing, admin resume, admin dance-menu, and admin submissions all redirect to login or show access denied. | Test | E2E | 9 | `web/e2e/full-app.spec.ts` (Admin Pages) | 4 | `npx playwright test full-app` | No |
| TEST-603 | Full app — Navigation | Verifies navigation links work: home to tools, tools to fit tool, tools to resume tool, tools to interview tool, and home to explorations. | Test | E2E | 8.6 | `web/e2e/full-app.spec.ts` (Navigation) | 5 | `npx playwright test full-app` | No |
| TEST-604 | Full app — API health | Verifies API endpoint health: session init endpoint returns valid payload (sessionId, expiresAt, isNew) and maintenance retention endpoint responds without 500. | Test | E2E | 10.1, 11 | `web/e2e/full-app.spec.ts` (API Endpoints) | 2 | `npx playwright test full-app` | Partial (1 of 2) |
| TEST-605 | Full app — Error handling | Verifies 404 behavior: non-existent page returns 404 status and non-existent API route returns 404. | Test | E2E | 13 | `web/e2e/full-app.spec.ts` (Error Handling) | 2 | `npx playwright test full-app` | No |
| TEST-606 | Full app — Accessibility | Verifies basic accessibility: home page has exactly one h1, tool pages have proper heading structure, and pages have a main landmark element. | Test | E2E | 8.6 | `web/e2e/full-app.spec.ts` (Accessibility) | 3 | `npx playwright test full-app` | No |
| TEST-610 | Fit tool — Happy path | E2E test of the fit tool browser flow: navigates to fit tool page, pastes a job posting, submits, waits for LLM analysis, and verifies the fit report renders with scores, categories, and citations. | Test | E2E | 8.1, 7, 8.4 | `web/e2e/fit-tool.spec.ts` (Happy Path) | 3 | `npx playwright test fit-tool` | Yes |
| TEST-611 | Fit tool — Error handling | E2E test of fit tool error states: verifies behavior with empty input, too-short input, and UI error messaging. | Test | E2E | 8.1, 13 | `web/e2e/fit-tool.spec.ts` (Error Handling) | 2 | `npx playwright test fit-tool` | No |
| TEST-620 | Resume tool — Happy path | E2E test of the resume tool browser flow: navigates to resume tool page, pastes a job posting, submits, waits for LLM generation, and verifies the tailored resume renders with header, summary, skills, experience, and education. | Test | E2E | 8.2, 7, 8.4 | `web/e2e/resume-tool.spec.ts` (Happy Path) | 4 | `npx playwright test resume-tool` | Yes |
| TEST-621 | Resume tool — Error handling | E2E test of resume tool error states: verifies behavior with empty input and invalid submissions. | Test | E2E | 8.2, 13 | `web/e2e/resume-tool.spec.ts` (Error Handling) | 2 | `npx playwright test resume-tool` | No |
| TEST-630 | Interview tool — UI | E2E test of interview tool UI: page loads with heading, chat interface is visible, input field and send button are present, and initial state shows welcome message. | Test | E2E | 8.3 | `web/e2e/interview-tool.spec.ts` (UI) | 4 | `npx playwright test interview-tool` | No |
| TEST-631 | Interview tool — Input behavior | E2E test of interview tool input handling: send button disabled with empty input, character counter works, input clears after send, and Enter key submits. | Test | E2E | 8.3 | `web/e2e/interview-tool.spec.ts` (Input Behavior) | 4 | `npx playwright test interview-tool` | No |
| TEST-632 | Interview tool — Conversation | E2E test of interview tool conversation flow: sends a question, receives an AI response, multi-turn conversation works, and guardrails redirect off-topic questions. | Test | E2E | 8.3, 7 | `web/e2e/interview-tool.spec.ts` (Conversation) | 3 | `npx playwright test interview-tool` | Yes |

---

## 3. E2E Real LLM Tests (Custom Script)

Run with `cd web && npm run test:e2e:real`. Requires GCP credentials and seeded resume data (`npm run seed:resume`).

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-650 | Real LLM — Fit tool | End-to-end fit tool test with real Vertex AI: creates test session and submission in Firestore, extracts job fields from sample posting, builds fit analysis prompt with resume context, calls Vertex AI, validates JSON response structure (overallScore, recommendation, categories with scores/rationale/citations), stores report artifacts in GCS, and updates submission status. | Test | E2E Real LLM | 8.1, 7, 8.4, 11 | `web/scripts/e2e-real-llm.ts` (testFitTool) | 1 | `npm run test:e2e:real` | Yes |
| TEST-651 | Real LLM — Resume tool | End-to-end resume tool test with real Vertex AI: creates test session and submission, builds resume generation prompt with resume context and job posting, calls Vertex AI, validates JSON response structure (header, summary, skills, experience with bullets, education), generates markdown resume, stores artifacts in GCS, and verifies word count is within limits. | Test | E2E Real LLM | 8.2, 7, 8.4, 11 | `web/scripts/e2e-real-llm.ts` (testResumeTool) | 1 | `npm run test:e2e:real` | Yes |
| TEST-652 | Real LLM — Interview tool | End-to-end interview tool test with real Vertex AI: creates test session and submission, builds interview system prompt with resume context, simulates multi-turn conversation (2 questions), validates response structure, generates transcript with citations, stores transcript artifacts in GCS, and saves fixture for regression testing. | Test | E2E Real LLM | 8.3, 7, 8.4, 11 | `web/scripts/e2e-real-llm.ts` (testInterviewTool) | 1 | `npm run test:e2e:real` | Yes |

---

## 4. GCP Smoke Tests (Custom Script)

Run with `cd web && npm run smoke:gcp`. All sections require GCP credentials. Individual sections can be run with `npm run smoke:gcp -- --section=N`.

| ID | Headline | Description | Type | Suite | Features | Implementation | Tests | How to Run | GCP |
|----|----------|-------------|------|-------|----------|----------------|-------|------------|-----|
| TEST-670 | Smoke — Cloud Storage | Verifies GCS connectivity: writes a test file to the private bucket, reads it back, verifies content matches, and deletes the test file. | Test | GCP Smoke | 11 | `web/scripts/smoke-gcp.ts` (Section 1) | 1 | `npm run smoke:gcp -- --section=1` | Yes |
| TEST-671 | Smoke — Firestore | Verifies Firestore connectivity: writes a test document, reads it back, verifies fields match, and deletes the test document. | Test | GCP Smoke | 11 | `web/scripts/smoke-gcp.ts` (Section 2) | 1 | `npm run smoke:gcp -- --section=2` | Yes |
| TEST-672 | Smoke — Session | Verifies session lifecycle: creates a session document in Firestore with timestamps and IP hash, reads it back, verifies TTL calculation, and cleans up. | Test | GCP Smoke | 10.1, 11 | `web/scripts/smoke-gcp.ts` (Section 3) | 1 | `npm run smoke:gcp -- --section=3` | Yes |
| TEST-673 | Smoke — Resume Upload | Verifies resume upload pipeline: uploads a test PDF to GCS, verifies it exists in the correct path, checks content-type metadata, and cleans up. | Test | GCP Smoke | 8.2, 11 | `web/scripts/smoke-gcp.ts` (Section 4) | 1 | `npm run smoke:gcp -- --section=4` | Yes |
| TEST-674 | Smoke — Resume Chunking | Verifies resume chunking with Firestore: reads seeded resume chunks, verifies chunk structure (chunkId, title, sourceRef, content), checks chunk count matches index, and validates version consistency. | Test | GCP Smoke | 8.2, 11 | `web/scripts/smoke-gcp.ts` (Section 5) | 1 | `npm run smoke:gcp -- --section=5` | Yes |
| TEST-675 | Smoke — Dance Menu Upload | Verifies dance menu upload pipeline: uploads a test image to GCS, verifies it exists in the correct public bucket path, checks content-type, and cleans up. | Test | GCP Smoke | 8.5, 11 | `web/scripts/smoke-gcp.ts` (Section 6) | 1 | `npm run smoke:gcp -- --section=6` | Yes |
| TEST-676 | Smoke — Submission & Artifact Bundle | Verifies submission creation and artifact bundling: creates a submission in Firestore, uploads artifact files to GCS under the submission prefix, verifies bundle completeness, and cleans up both Firestore and GCS. | Test | GCP Smoke | 11 | `web/scripts/smoke-gcp.ts` (Section 7) | 1 | `npm run smoke:gcp -- --section=7` | Yes |
| TEST-677 | Smoke — Spend Cap | Verifies spend cap tracking: creates/reads a monthly spend document in Firestore, increments token counts, verifies budget remaining calculation, and cleans up. | Test | GCP Smoke | 10.3, 11 | `web/scripts/smoke-gcp.ts` (Section 8) | 1 | `npm run smoke:gcp -- --section=8` | Yes |
| TEST-678 | Smoke — Job Ingestion URL Fetch | Verifies URL-based job ingestion: fetches a real web page, extracts text content, verifies character and word counts are within expected ranges, and validates the ingestion result structure. | Test | GCP Smoke | 8.1 | `web/scripts/smoke-gcp.ts` (Section 9) | 1 | `npm run smoke:gcp -- --section=9` | Yes |
| TEST-679 | Smoke — Vertex AI Gemini | Verifies Vertex AI connectivity and fit report generation: sends a prompt to Gemini, receives a response, validates JSON structure (overallScore, categories, citations), and logs token usage and cost estimate. | Test | GCP Smoke | 7, 8.1 | `web/scripts/smoke-gcp.ts` (Section 10) | 1 | `npm run smoke:gcp -- --section=10` | Yes |
| TEST-680 | Smoke — Resume Generation | Verifies resume generation with Vertex AI: sends resume generation prompt with job posting and resume context, validates JSON response (header, summary, skills, experience, education), checks word count is within 2-page limit, and logs token usage. | Test | GCP Smoke | 7, 8.2 | `web/scripts/smoke-gcp.ts` (Section 11) | 1 | `npm run smoke:gcp -- --section=11` | Yes |
| TEST-681 | Smoke — Interview Chat | Verifies interview chat with Vertex AI: sends a multi-turn conversation, validates response structure and content relevance, verifies career-focused guardrails, and logs token usage across turns. | Test | GCP Smoke | 7, 8.3 | `web/scripts/smoke-gcp.ts` (Section 12) | 1 | `npm run smoke:gcp -- --section=12` | Yes |
| TEST-682 | Smoke — Retention Cleanup | Verifies retention cleanup logic with real GCP: creates expired test submissions in Firestore and GCS, runs cleanup, verifies expired data is deleted while non-expired data is preserved, and validates the cleanup summary. | Test | GCP Smoke | 11 | `web/scripts/smoke-gcp.ts` (Section 13) | 1 | `npm run smoke:gcp -- --section=13` | Yes |

---

## Feature Coverage Reference

| Feature ID | Feature Name | Test IDs |
|------------|-------------|----------|
| 6 | Deployment | (Verifications only — see verification-registry.md) |
| 7 | LLM / Vertex AI | TEST-024, TEST-610, TEST-620, TEST-632, TEST-650, TEST-651, TEST-652, TEST-679, TEST-680, TEST-681 |
| 8.1 | Fit Tool | TEST-010, TEST-011, TEST-012, TEST-610, TEST-611, TEST-650, TEST-678, TEST-679 |
| 8.2 | Resume Tool | TEST-013, TEST-014, TEST-015, TEST-016, TEST-620, TEST-621, TEST-651, TEST-673, TEST-674, TEST-680 |
| 8.3 | Interview Tool | TEST-017, TEST-018, TEST-630, TEST-631, TEST-632, TEST-652, TEST-681 |
| 8.4 | Citations | TEST-012, TEST-013, TEST-021, TEST-610, TEST-620, TEST-650, TEST-651, TEST-652 |
| 8.5 | Dance Menu | TEST-022, TEST-600, TEST-675 |
| 8.6 | Static Pages | TEST-600, TEST-601, TEST-603, TEST-606 |
| 9 | Authentication | TEST-002, TEST-602 |
| 10.1 | Session Management | TEST-001, TEST-004, TEST-604, TEST-672 |
| 10.2 | Rate Limiting | TEST-005 |
| 10.3 | Spend Cap | TEST-006, TEST-677 |
| 11 | Storage / Firestore / Retention | TEST-007, TEST-008, TEST-019, TEST-020, TEST-023, TEST-025, TEST-604, TEST-650, TEST-651, TEST-652, TEST-670, TEST-671, TEST-672, TEST-673, TEST-674, TEST-675, TEST-676, TEST-677, TEST-682 |
| 13 | Error Handling | TEST-009, TEST-605, TEST-611, TEST-621 |
