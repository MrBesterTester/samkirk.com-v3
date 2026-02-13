# Test Catalog — samkirk-v3

> Authoritative catalog of all automated tests. Each entry represents one top-level `describe` block (unit tests) or test group (E2E/scripts). Individual `it`/`test` counts are listed per entry.

**Entries vs Individual Tests:** Each catalog entry (e.g., TEST-001) corresponds to a top-level `describe` block or test group — a logical grouping of related assertions. The "Tests" count on each entry is the number of individual `it()` / `test()` calls inside that group — each one a single assertion or scenario that produces its own pass/fail result. So 68 entries contain 1,295 individual test cases.

## Table of Contents

- [Overview](#overview)
- [1. Unit Tests (Vitest)](#1-unit-tests-vitest)
  - [TEST-001 — Session module](#test-001--session-module)
  - [TEST-002 — Admin email allowlist](#test-002--admin-email-allowlist)
  - [TEST-003 — Environment parsing](#test-003--environment-parsing)
  - [TEST-004 — CAPTCHA verification helpers](#test-004--captcha-verification-helpers)
  - [TEST-005 — Rate limit module](#test-005--rate-limit-module)
  - [TEST-006 — Monthly spend cap module](#test-006--monthly-spend-cap-module)
  - [TEST-007 — Firestore path helpers](#test-007--firestore-path-helpers)
  - [TEST-008 — Storage path helpers](#test-008--storage-path-helpers)
  - [TEST-009 — API error handling framework](#test-009--api-error-handling-framework)
  - [TEST-010 — Job ingestion pipeline](#test-010--job-ingestion-pipeline)
  - [TEST-011 — Fit tool flow state machine](#test-011--fit-tool-flow-state-machine)
  - [TEST-012 — Fit report generation](#test-012--fit-report-generation)
  - [TEST-013 — Resume RAG context assembly](#test-013--resume-rag-context-assembly)
  - [TEST-014 — Resume generation logic](#test-014--resume-generation-logic)
  - [TEST-015 — Resume upload validation](#test-015--resume-upload-validation)
  - [TEST-016 — Resume markdown chunking](#test-016--resume-markdown-chunking)
  - [TEST-017 — Interview chat module](#test-017--interview-chat-module)
  - [TEST-018 — Interview guardrails classification](#test-018--interview-guardrails-classification)
  - [TEST-019 — Submission module](#test-019--submission-module)
  - [TEST-020 — Retention cleanup module](#test-020--retention-cleanup-module)
  - [TEST-021 — Markdown renderer](#test-021--markdown-renderer)
  - [TEST-022 — Dance menu upload validation](#test-022--dance-menu-upload-validation)
  - [TEST-023 — Artifact bundler](#test-023--artifact-bundler)
  - [TEST-024 — Vertex AI error classes](#test-024--vertex-ai-error-classes)
  - [TEST-025 — Public proxy API route](#test-025--public-proxy-api-route)
  - [TEST-026 — Footer component](#test-026--footer-component)
  - [TEST-027 — Category Theory page](#test-027--category-theory-page)
  - [TEST-028 — Dance Instruction page](#test-028--dance-instruction-page)
  - [TEST-029 — Pocket Flow page](#test-029--pocket-flow-page)
  - [TEST-030 — Uber Level AI Skills page](#test-030--uber-level-ai-skills-page)
  - [TEST-031 — Explorations hub page](#test-031--explorations-hub-page)
  - [TEST-032 — Home page](#test-032--home-page)
  - [TEST-033 — Header component](#test-033--header-component)
  - [TEST-034 — ReCaptcha component](#test-034--recaptcha-component)
  - [TEST-035 — Song Dedication page](#test-035--song-dedication-page)
  - [TEST-036 — StaticHtmlViewer component](#test-036--statichtmlviewer-component)
  - [TEST-037 — ToolGate component](#test-037--toolgate-component)
  - [TEST-038 — ToolPreview component](#test-038--toolpreview-component)
- [2. E2E Tests (Playwright)](#2-e2e-tests-playwright)
  - [TEST-600 — Full app — Public pages](#test-600--full-app--public-pages)
  - [TEST-601 — Full app — Exploration pages](#test-601--full-app--exploration-pages)
  - [TEST-602 — Full app — Admin auth required](#test-602--full-app--admin-auth-required)
  - [TEST-603 — Full app — Navigation](#test-603--full-app--navigation)
  - [TEST-604 — Full app — API health](#test-604--full-app--api-health)
  - [TEST-605 — Full app — Error handling](#test-605--full-app--error-handling)
  - [TEST-606 — Full app — Accessibility](#test-606--full-app--accessibility)
  - [TEST-610 — Fit tool — Happy path](#test-610--fit-tool--happy-path)
  - [TEST-611 — Fit tool — Error handling](#test-611--fit-tool--error-handling)
  - [TEST-620 — Resume tool — Happy path](#test-620--resume-tool--happy-path)
  - [TEST-621 — Resume tool — Error handling](#test-621--resume-tool--error-handling)
  - [TEST-630 — Interview tool — UI](#test-630--interview-tool--ui)
  - [TEST-631 — Interview tool — Input behavior](#test-631--interview-tool--input-behavior)
  - [TEST-632 — Interview tool — Conversation](#test-632--interview-tool--conversation)
- [3. E2E Real LLM Tests (Custom Script)](#3-e2e-real-llm-tests-custom-script)
  - [TEST-650 — Real LLM — Fit tool](#test-650--real-llm--fit-tool)
  - [TEST-651 — Real LLM — Resume tool](#test-651--real-llm--resume-tool)
  - [TEST-652 — Real LLM — Interview tool](#test-652--real-llm--interview-tool)
- [4. GCP Smoke Tests (Custom Script)](#4-gcp-smoke-tests-custom-script)
  - [TEST-670 — Smoke — Cloud Storage](#test-670--smoke--cloud-storage)
  - [TEST-671 — Smoke — Firestore](#test-671--smoke--firestore)
  - [TEST-672 — Smoke — Session](#test-672--smoke--session)
  - [TEST-673 — Smoke — Resume Upload](#test-673--smoke--resume-upload)
  - [TEST-674 — Smoke — Resume Chunking](#test-674--smoke--resume-chunking)
  - [TEST-675 — Smoke — Dance Menu Upload](#test-675--smoke--dance-menu-upload)
  - [TEST-676 — Smoke — Submission & Artifact Bundle](#test-676--smoke--submission--artifact-bundle)
  - [TEST-677 — Smoke — Spend Cap](#test-677--smoke--spend-cap)
  - [TEST-678 — Smoke — Job Ingestion URL Fetch](#test-678--smoke--job-ingestion-url-fetch)
  - [TEST-679 — Smoke — Vertex AI Gemini](#test-679--smoke--vertex-ai-gemini)
  - [TEST-680 — Smoke — Resume Generation](#test-680--smoke--resume-generation)
  - [TEST-681 — Smoke — Interview Chat](#test-681--smoke--interview-chat)
  - [TEST-682 — Smoke — Retention Cleanup](#test-682--smoke--retention-cleanup)
- [Feature Coverage Reference](#feature-coverage-reference)

## Overview

| Suite | Entries | Individual Tests | How to Run | GCP Required |
|-------|---------|-----------------|------------|--------------|
| Unit (Vitest) | 38 | 1,232 | `cd web && npm test` | No (2 tests in public-proxy need GCP) |
| E2E (Playwright) | 14 | 47 | `cd web && npx playwright test` | Partial (some tests need GCP/LLM) |
| E2E Real LLM | 3 | 3 | `cd web && npm run test:e2e:real` | Yes |
| GCP Smoke | 13 | 13 | `cd web && npm run smoke:gcp` | Yes |
| **Total** | **68** | **1,295** | `cd web && npm run test:all` | — |

---

## 1. Unit Tests (Vitest)

All unit tests run with `cd web && npm test`. No GCP credentials required unless noted.

### TEST-001 — Session module

- **Suite:** Unit | **Tests:** 34 | **GCP:** No
- **Features:** 10.1
- **Implementation:** `web/src/lib/session.test.ts`
- **Run:** `npm test -- session.test`

Tests session ID generation (base64url, uniqueness, entropy), validation (length, charset, edge cases), cookie options (httpOnly, secure per env, sameSite, maxAge), timestamp creation (Firestore Timestamp, TTL offset), IP hashing (deterministic, hex output, IPv6), and exported constants.

### TEST-002 — Admin email allowlist

- **Suite:** Unit | **Tests:** 11 | **GCP:** No
- **Features:** 9
- **Implementation:** `web/src/lib/auth.test.ts`
- **Run:** `npm test -- auth.test`

Tests email allowlist matching: null/undefined/empty rejection, case-insensitive comparison, exact-match-only semantics, prefix/suffix attack resistance, and missing env var warning.

### TEST-003 — Environment parsing

- **Suite:** Unit | **Tests:** 3 | **GCP:** No
- **Features:** 6
- **Implementation:** `web/src/lib/env.test.ts`
- **Run:** `npm test -- env.test`

Tests Zod-based env parsing: valid environment acceptance, missing required value rejection, and empty string rejection with descriptive error messages.

### TEST-004 — CAPTCHA verification helpers

- **Suite:** Unit | **Tests:** 14 | **GCP:** No
- **Features:** 10.1
- **Implementation:** `web/src/lib/captcha.test.ts`
- **Run:** `npm test -- captcha.test`

Tests `buildVerifyRequestBody`: constructs URLSearchParams with secret and response token, includes remoteip when provided, preserves special characters in tokens, omits remoteip when empty string (4 tests). Tests `mapRecaptchaErrorCodes` with 10 cases: returns default "Captcha verification failed" for undefined and empty arrays, maps missing-input-response, invalid-input-response, timeout-or-duplicate, missing/invalid-input-secret (server config), bad-request, returns first match when multiple codes present, and returns default for unknown codes.

### TEST-005 — Rate limit module

- **Suite:** Unit | **Tests:** 50 | **GCP:** No
- **Features:** 10.2
- **Implementation:** `web/src/lib/rate-limit.test.ts`
- **Run:** `npm test -- rate-limit.test`

Tests constants, RateLimitError class, client IP extraction from headers (x-forwarded-for, x-real-ip, fallback), rate limit key derivation, sliding window creation and expiration, remaining-time calculation, window behavior across boundaries, key-to-window integration, counter increment simulation, and error message formatting.

### TEST-006 — Monthly spend cap module

- **Suite:** Unit | **Tests:** 60 | **GCP:** No
- **Features:** 10.3
- **Implementation:** `web/src/lib/spend-cap.test.ts`
- **Run:** `npm test -- spend-cap.test`

Tests constants, SpendCapError class, month key generation/parsing/rollover, LLM cost estimation (input/output tokens, mixed, edge cases), text-to-token estimation, monthly doc creation, cap exceeded logic (under/at/over budget, no doc), remaining budget calculation, month boundary scenarios, cost estimation scenarios, and integration flows.

### TEST-007 — Firestore path helpers

- **Suite:** Unit | **Tests:** 10 | **GCP:** No
- **Features:** 11
- **Implementation:** `web/src/lib/firestore.test.ts`
- **Run:** `npm test -- firestore.test`

Tests Firestore document reference construction for sessions, submissions, rate limits, spend caps, resume index, and resume chunks — verifying correct collection paths and document IDs.

### TEST-008 — Storage path helpers

- **Suite:** Unit | **Tests:** 10 | **GCP:** No
- **Features:** 11
- **Implementation:** `web/src/lib/storage.test.ts`
- **Run:** `npm test -- storage.test`

Tests GCS path construction for submission artifacts, resume uploads, dance menu files, and public assets — verifying correct bucket selection and prefix patterns.

### TEST-009 — API error handling framework

- **Suite:** Unit | **Tests:** 107 | **GCP:** No
- **Features:** 13
- **Implementation:** `web/src/lib/api-errors.test.ts`
- **Run:** `npm test -- api-errors.test`

Tests ERROR_STATUS_CODES mapping, correlation ID generation/extraction/header, createErrorResponse (status codes, JSON body, headers, correlation IDs), error serialization, sensitive data detection and redaction, error sanitization for logging, logError/logWarning helpers, AppError class (codes, status, toResponse, toJSON, chaining), factory functions (sessionError, captchaRequiredError, validationError, internalError), type guards (isAppError, hasErrorCode, hasToResponse, hasToJSON), and integration scenarios.

### TEST-010 — Job ingestion pipeline

- **Suite:** Unit | **Tests:** 74 | **GCP:** No
- **Features:** 8.1
- **Implementation:** `web/src/lib/job-ingestion.test.ts`
- **Run:** `npm test -- job-ingestion.test`

Tests constants, JobIngestionError class, file extension detection, allowed extension validation, text normalization, word counting, ingestion result creation, paste ingestion (valid text, whitespace, empty, too short/long), HTML entity decoding, HTML text extraction, URL ingestion (HTML fetch, content-type handling, error cases), file metadata validation (size, extension, MIME type), text file extraction, file ingestion flow, unified ingestJob dispatcher, edge cases, and real-world HTML examples.

### TEST-011 — Fit tool flow state machine

- **Suite:** Unit | **Tests:** 96 | **GCP:** No
- **Features:** 8.1
- **Implementation:** `web/src/lib/fit-flow.test.ts`
- **Run:** `npm test -- fit-flow.test`

Tests constants (MAX_FOLLOW_UPS, HOME_LOCATION, MAX_COMMUTE_MINUTES, MAX_ONSITE_DAYS), initial state/field creation, seniority extraction (all levels + priority), location type extraction (remote/hybrid/onsite/ambiguous), location fit evaluation (remote, onsite commute, hybrid days+commute), worst-case location application, follow-up question generation (priority ordering, max limit), nextQuestion state machine (error/ready/question transitions), follow-up counting (0-5 boundary), answer processing (validation, type matching, history tracking), applyAnswerToExtracted (location/frequency/seniority/skills), commute estimation by city, flow initialization with job text parsing, finalization for report, readiness checks, unknown field listing, and full flow integration scenarios (remote, hybrid multi-follow-up, worst-case, 5-follow-up limit).

### TEST-012 — Fit report generation

- **Suite:** Unit | **Tests:** 36 | **GCP:** No
- **Features:** 8.1, 8.4
- **Implementation:** `web/src/lib/fit-report.test.ts`
- **Run:** `npm test -- fit-report.test`

Tests system prompt structure, extracted field formatting (all permutations of known/unknown fields), fit analysis prompt construction (job text, resume context, extracted data), LLM response parsing (valid JSON, malformed, missing fields, markdown-wrapped), markdown report generation (headings, scores, categories, citations, unknowns), citation generation from chunk references, and FitReportError class.

### TEST-013 — Resume RAG context assembly

- **Suite:** Unit | **Tests:** 50 | **GCP:** No
- **Features:** 8.2, 8.4
- **Implementation:** `web/src/lib/resume-context.test.ts`
- **Run:** `npm test -- resume-context.test`

Tests chunk formatting (title, content, source ref), context assembly from multiple chunks (ordering, deduplication, size limits), getResumeContext with Firestore integration, citation generation from chunks, citation generation for referenced chunks, citation map creation, context summary statistics, resume context availability check, context size calculation, context-and-citation integration, and edge cases (empty chunks, missing fields, very large content).

### TEST-014 — Resume generation logic

- **Suite:** Unit | **Tests:** 62 | **GCP:** No
- **Features:** 8.2
- **Implementation:** `web/src/lib/resume-generator.test.ts`
- **Run:** `npm test -- resume-generator.test`

Tests constants (word limits, section limits), system prompt structure and constraints, prompt construction (job text, resume context, format instructions), response parsing (valid JSON, malformed, missing sections, markdown-wrapped, experience/skills/education validation), markdown resume generation (header, summary, skills, experience bullets, education, formatting), word counting (per-section and total), ResumeGeneratorError class, and type definition validation.

### TEST-015 — Resume upload validation

- **Suite:** Unit | **Tests:** 22 | **GCP:** No
- **Features:** 8.2
- **Implementation:** `web/src/lib/resume-upload.test.ts`
- **Run:** `npm test -- resume-upload.test`

Tests file extension detection, allowed extension checking (pdf, doc, docx, txt, md), file metadata validation (size limits, extension, MIME type mismatches, zero-byte files), file content validation (magic bytes, encoding), bundle validation (complete bundles, missing required files), format display name mapping, and upload constants.

### TEST-016 — Resume markdown chunking

- **Suite:** Unit | **Tests:** 49 | **GCP:** No
- **Features:** 8.2
- **Implementation:** `web/src/lib/resume-chunker.test.ts`
- **Run:** `npm test -- resume-chunker.test`

Tests line parsing, heading extraction (levels, nested), section parsing from markdown, chunk ID generation (deterministic, unique), content hashing (SHA-256, stability), title generation from section content, source reference generation, large section splitting (by paragraph and line), full markdown chunking pipeline (section boundaries, metadata, ordering), chunk ID stability across runs, and edge cases (empty input, single line, no headings, deeply nested).

### TEST-017 — Interview chat module

- **Suite:** Unit | **Tests:** 44 | **GCP:** No
- **Features:** 8.3
- **Implementation:** `web/src/lib/interview-chat.test.ts`
- **Run:** `npm test -- interview-chat.test`

Tests constants (max turns, token limits), system prompt construction (resume context injection, behavioral guidelines), transcript generation (markdown formatting, turn labeling, timestamps), message processing (input validation, turn counting, history management, error handling, empty/oversized messages), getOrCreateConversation (new creation, existing retrieval, expiration), and InterviewChatError class.

### TEST-018 — Interview guardrails classification

- **Suite:** Unit | **Tests:** 196 | **GCP:** No
- **Features:** 8.3
- **Implementation:** `web/src/lib/interview-guardrails.test.ts`
- **Run:** `npm test -- interview-guardrails.test`

Tests the topic classifier that keeps interviews career-focused. Constants: subject name, contact email, LLM classification prompt (3 tests). Allowed topic classification via `it.each` (59 parameterized tests): work_history (8), projects (8), skills (8), education (7), availability (6), location_remote (7), compensation (5), career_goals (6), interview_meta (4). Disallowed topic classification via `it.each` (53 parameterized tests): personal_life (8), politics (7), medical (7), religion (6), financial_private (6), general_assistant (9), prompt_injection (6), inappropriate (4). Edge cases: empty/whitespace/very-short messages, ambiguous messages, mixed-case, priority resolution (8 tests). `checkGuardrails` integration: pass-through, redirect, LLM verification suggestion (6 tests). Redirect responses: per-category, generic, persistent off-topic with contact email (9 tests). `isPersistentlyOffTopic`: threshold logic, consecutive detection, last-N-only (6 tests). LLM helpers: prompt building, ALLOWED/DISALLOWED parsing with case and whitespace handling (7 tests). Category accessors (4 tests). Confidence levels (3 tests). Real-world interview examples: 10 allowed + 7 disallowed (2 parameterized tests). Prompt injection resistance: 8 attempts (1 parameterized test). General assistant rejection: 10 requests (1 parameterized test). Result structure validation (4 tests). Uses `it.each` for parameterized coverage across 147 message samples.

### TEST-019 — Submission module

- **Suite:** Unit | **Tests:** 53 | **GCP:** No
- **Features:** 11
- **Implementation:** `web/src/lib/submission.test.ts`
- **Run:** `npm test -- submission.test`

Tests constants (TTL, collection names), submission ID generation (format, uniqueness), ID validation (length, charset, edge cases), timestamp creation (createdAt, expiresAt, TTL offset), timestamp creation from specific dates, expiration calculation, submission expiration check (before/at/after expiry, no expiresAt), artifact GCS prefix construction, tool validation, status validation, citation validation (structure, required fields, URL format, edge cases), citations array validation, TTL computation edge cases, ListSubmissionsOptions type, and SubmissionWithId type.

### TEST-020 — Retention cleanup module

- **Suite:** Unit | **Tests:** 55 | **GCP:** No
- **Features:** 11
- **Implementation:** `web/src/lib/retention.test.ts`
- **Run:** `npm test -- retention.test`

Tests constants (retention period, batch sizes), expiration check logic (before/at/after expiry, timestamps), submission prefix validation (format, edge cases), submission ID extraction from GCS prefixes, cleanup summary building (counts, status aggregation, error tracking, empty results), ExpiredSubmission type structure, DeletionResult type structure, RetentionCleanupResult type structure, retention policy edge cases (exactly at boundary, leap years, timezone), idempotency scenarios, and security considerations (prefix injection, traversal).

### TEST-021 — Markdown renderer

- **Suite:** Unit | **Tests:** 56 | **GCP:** No
- **Features:** 8.4
- **Implementation:** `web/src/lib/markdown-renderer.test.ts`
- **Run:** `npm test -- markdown-renderer.test`

Tests renderMarkdown (headings, paragraphs, lists, code blocks, links, emphasis, tables, nested structures), renderMarkdown with fullDocument option (HTML wrapper, CSS injection), renderMarkdownSync, sanitizeHtml (XSS prevention, script/iframe/event handler removal, safe tags preserved), escapeHtml (entity encoding), wrapInDocument (HTML5 structure, custom CSS), renderCitationsHtml (citation list, links, empty array), renderCitationsMarkdown, appendCitationsToMarkdown, renderMarkdownWithCitations (combined output), and DEFAULT_MARKDOWN_CSS constants.

### TEST-022 — Dance menu upload validation

- **Suite:** Unit | **Tests:** 29 | **GCP:** No
- **Features:** 8.5
- **Implementation:** `web/src/lib/dance-menu-upload.test.ts`
- **Run:** `npm test -- dance-menu-upload.test`

Tests file extension detection, allowed extension checking (pdf, jpg, png, webp), file metadata validation (size, extension, MIME type), file content validation (magic bytes, encoding detection), bundle validation (complete upload, missing files), format display name mapping, and upload constants.

### TEST-023 — Artifact bundler

- **Suite:** Unit | **Tests:** 30 | **GCP:** No
- **Features:** 11
- **Implementation:** `web/src/lib/artifact-bundler.test.ts`
- **Run:** `npm test -- artifact-bundler.test`

Tests createBundle (fit/resume/interview tool bundles, file paths, metadata, content types, error cases), getExpectedBundleFiles (per-tool file manifests, required vs optional, unknown tools), validateBundleFiles (completeness checks, missing file detection), and bundle structure validation for each tool type.

### TEST-024 — Vertex AI error classes

- **Suite:** Unit | **Tests:** 19 | **GCP:** No
- **Features:** 7
- **Implementation:** `web/src/lib/vertex-ai.test.ts`
- **Run:** `npm test -- vertex-ai.test`

Tests ContentBlockedError (message, code, safety ratings, response metadata), GenerationError (message, code, cause chaining), isSpendCapError type guard, isContentBlockedError type guard, isGenerationError type guard, and error inheritance chains (Error -> AppError -> specific errors).

### TEST-025 — Public proxy API route

- **Suite:** Unit | **Tests:** 3 | **GCP:** Partial (2 of 3)
- **Features:** 11
- **Implementation:** `web/src/app/api/public/[...path]/route.test.ts`
- **Run:** `npm test -- route.test`

Tests GCS file serving via proxy (status 200, content-type, cache-control headers), 404 for missing files (GCP integration), and directory traversal blocking (unit test, no GCP).

### TEST-026 — Footer component

- **Suite:** Unit | **Tests:** 2 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/components/Footer.test.tsx`
- **Run:** `npm test -- Footer.test`

Renders copyright text with dynamically computed current year ("YYYY Sam Kirk"). Renders contact email as a clickable `mailto:sam@samkirk.com` link.

### TEST-027 — Category Theory page

- **Suite:** Unit | **Tests:** 3 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/app/explorations/category-theory/page.test.tsx`
- **Run:** `npm test -- category-theory`

Renders "Category Theory" heading. Renders page description about everyday category theory examples. Renders `StaticHtmlViewer` iframe with `src="/static/category-theory.html"`.

### TEST-028 — Dance Instruction page

- **Suite:** Unit | **Tests:** 3 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/app/explorations/dance-instruction/page.test.tsx`
- **Run:** `npm test -- dance-instruction`

Renders "Dance Instruction" heading. Renders description about teaching and learning dance. Renders `StaticHtmlViewer` iframe with `src="/static/dance-instruction.html"`.

### TEST-029 — Pocket Flow page

- **Suite:** Unit | **Tests:** 3 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/app/explorations/pocket-flow/page.test.tsx`
- **Run:** `npm test -- pocket-flow`

Renders "Pocket Flow" heading. Renders description about the lightweight AI workflow framework. Renders `StaticHtmlViewer` iframe with `src="/static/pocket-flow.html"`.

### TEST-030 — Uber Level AI Skills page

- **Suite:** Unit | **Tests:** 3 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/app/explorations/uber-level-ai-skills/page.test.tsx`
- **Run:** `npm test -- uber-level-ai-skills`

Renders "Uber Level AI Skills" heading. Renders description about advanced AI tool techniques. Renders `StaticHtmlViewer` iframe with `src="/static/uber-level-ai-skills.html"`.

### TEST-031 — Explorations hub page

- **Suite:** Unit | **Tests:** 3 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/app/explorations/page.test.tsx`
- **Run:** `npm test -- explorations/page.test`

Renders "Explorations" heading. Renders links to all 5 exploration topics (Category Theory, Pocket Flow, Dance Instruction, Uber Level AI Skills, Tensor Logic) with correct hrefs. Renders topic descriptions.

### TEST-032 — Home page

- **Suite:** Unit | **Tests:** 5 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/app/page.test.tsx`
- **Run:** `npm test -- src/app/page.test`

Renders "Sam Kirk" welcome heading. Renders "Hiring Manager" section. Renders all three AI tool cards (Fit Analysis, Custom Resume, Interview Me) with correct links to `/hire-me/fit`, `/hire-me/resume`, `/hire-me/interview`. Renders TOC sections (Dance Menu, Photo Fun, Song Dedication, Explorations) with links. Renders Villa Madu Bali section with external link.

### TEST-033 — Header component

- **Suite:** Unit | **Tests:** 6 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/components/Header.test.tsx`
- **Run:** `npm test -- Header.test`

Renders "Sam Kirk" logo link with `href="/"`. Renders all main navigation links (Home, Hire Me, Dance Menu, Song Dedication, Photo Fun, Explorations) for desktop and mobile. Renders mobile menu button with `aria-expanded` attribute. Toggles mobile menu on button click (aria-expanded false→true). Verifies correct href attributes for all nav links. Renders desktop navigation with responsive `md:flex` class.

### TEST-034 — ReCaptcha component

- **Suite:** Unit | **Tests:** 6 | **GCP:** No
- **Features:** 10.1
- **Implementation:** `web/src/components/ReCaptcha.test.tsx`
- **Run:** `npm test -- ReCaptcha.test`

`ReCaptcha` component (4 tests): shows error when site key not configured, renders `recaptcha-container` element when key provided, shows loading placeholder with `animate-pulse`, applies custom className. `CaptchaGate` wrapper (2 tests): shows captcha initially while hiding children, renders custom title and description props.

### TEST-035 — Song Dedication page

- **Suite:** Unit | **Tests:** 6 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/app/song-dedication/page.test.tsx`
- **Run:** `npm test -- song-dedication`

Renders "Resilience in the Storm" heading. Renders about section ("A song created for my mother"). Renders audio/listen section with audio element. Renders external listening links ("View ChatGPT thread"). Renders lyrics section with Verse 1, Chorus, Verse 2 labels. Renders song info footer with ChatGPT and Udio.com credits.

### TEST-036 — StaticHtmlViewer component

- **Suite:** Unit | **Tests:** 6 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/components/StaticHtmlViewer.test.tsx`
- **Run:** `npm test -- StaticHtmlViewer.test`

Renders iframe with correct `/static/` prefixed src path. Applies `sandbox="allow-same-origin allow-scripts"` for security. Uses provided minHeight value. Uses default 400px minHeight when not specified. Renders "Loading content" indicator initially. Wraps iframe in styled container with `rounded-xl`, `border`, `overflow-hidden` classes.

### TEST-037 — ToolGate component

- **Suite:** Unit | **Tests:** 6 | **GCP:** No
- **Features:** 10.1
- **Implementation:** `web/src/components/ToolGate.test.tsx`
- **Run:** `npm test -- ToolGate.test`

Shows "Initializing..." loading state during session init fetch. Shows error state when session init returns HTTP 500. Shows captcha verification screen when `captchaPassed=false` in session response. Skips captcha and renders protected children when `captchaPassed=true`. Uses default "Please verify you're human" title when no `toolName` prop. Shows connection error when fetch rejects (network failure).

### TEST-038 — ToolPreview component

- **Suite:** Unit | **Tests:** 7 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/src/components/ToolPreview.test.tsx`
- **Run:** `npm test -- ToolPreview.test`

Renders title and description text. Renders CTA link with correct href and label. Renders icon element when provided via props. Omits icon container when no icon prop. Renders previewContent when provided. Omits preview section when no previewContent. Applies card styling classes (`rounded-xl`, `border`, `shadow-sm`).

---

## 2. E2E Tests (Playwright)

All E2E tests run with `cd web && npx playwright test`. Requires the dev server running on port 3000.

### TEST-600 — Full app — Public pages

- **Suite:** E2E | **Tests:** 5 | **GCP:** No
- **Features:** 8.5, 8.6
- **Implementation:** `web/e2e/full-app.spec.ts` (Public Pages)
- **Run:** `npx playwright test full-app`

Verifies all public pages render correctly: home page (h1, navigation, tools link), tools hub (heading, links to all three tools), dance menu page, song dedication page, and explorations hub (heading, category theory link).

### TEST-601 — Full app — Exploration pages

- **Suite:** E2E | **Tests:** 4 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/e2e/full-app.spec.ts` (Exploration Pages)
- **Run:** `npx playwright test full-app`

Verifies exploration sub-pages render correctly: category theory, pocket flow, dance instruction, and uber-level AI skills pages each load with a visible h1.

### TEST-602 — Full app — Admin auth required

- **Suite:** E2E | **Tests:** 4 | **GCP:** No
- **Features:** 9
- **Implementation:** `web/e2e/full-app.spec.ts` (Admin Pages)
- **Run:** `npx playwright test full-app`

Verifies admin pages redirect to login when unauthenticated: admin landing, admin resume, admin dance-menu, and admin submissions all redirect to login or show access denied.

### TEST-603 — Full app — Navigation

- **Suite:** E2E | **Tests:** 5 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/e2e/full-app.spec.ts` (Navigation)
- **Run:** `npx playwright test full-app`

Verifies navigation links work: home to tools, tools to fit tool, tools to resume tool, tools to interview tool, and home to explorations.

### TEST-604 — Full app — API health

- **Suite:** E2E | **Tests:** 2 | **GCP:** Partial (1 of 2)
- **Features:** 10.1, 11
- **Implementation:** `web/e2e/full-app.spec.ts` (API Endpoints)
- **Run:** `npx playwright test full-app`

Verifies API endpoint health: session init endpoint returns valid payload (sessionId, expiresAt, isNew) and maintenance retention endpoint responds without 500.

### TEST-605 — Full app — Error handling

- **Suite:** E2E | **Tests:** 2 | **GCP:** No
- **Features:** 13
- **Implementation:** `web/e2e/full-app.spec.ts` (Error Handling)
- **Run:** `npx playwright test full-app`

Verifies 404 behavior: non-existent page returns 404 status and non-existent API route returns 404.

### TEST-606 — Full app — Accessibility

- **Suite:** E2E | **Tests:** 3 | **GCP:** No
- **Features:** 8.6
- **Implementation:** `web/e2e/full-app.spec.ts` (Accessibility)
- **Run:** `npx playwright test full-app`

Verifies basic accessibility: home page has exactly one h1, tool pages have proper heading structure, and pages have a main landmark element.

### TEST-610 — Fit tool — Happy path

- **Suite:** E2E | **Tests:** 4 | **GCP:** Yes
- **Features:** 8.1, 7, 8.4
- **Implementation:** `web/e2e/fit-tool.spec.ts` (Happy Path)
- **Run:** `npx playwright test fit-tool`

Complete end-to-end fit analysis: pastes a sample job posting, clicks analyze, handles follow-up questions if any, waits for LLM analysis, and verifies results page shows fit score, recommendation, and category breakdown. Verifies all three input modes (paste/URL/upload) are available after completion. Clicks "enter url" and verifies URL input field appears. Validates analyze button is disabled when input is empty, enabled when text is entered, and disabled again when cleared.

### TEST-611 — Fit tool — Error handling

- **Suite:** E2E | **Tests:** 1 | **GCP:** No
- **Features:** 8.1, 13
- **Implementation:** `web/e2e/fit-tool.spec.ts` (Error Handling)
- **Run:** `npx playwright test fit-tool`

Submits minimal invalid input ("x") via the fit tool form, clicks analyze, and waits for either an error message or a processing state to render — verifying the UI handles bad input without crashing.

### TEST-620 — Resume tool — Happy path

- **Suite:** E2E | **Tests:** 5 | **GCP:** Yes
- **Features:** 8.2, 7, 8.4
- **Implementation:** `web/e2e/resume-tool.spec.ts` (Happy Path)
- **Run:** `npx playwright test resume-tool`

Complete end-to-end resume generation: pastes a sample job posting, clicks "generate custom resume", waits for generating state, and verifies results show professional summary, experience entries, skill categories, factual accuracy note, and download/generate-another buttons. Verifies all three input modes available after completion. Clicks "enter url" and verifies URL input field. Validates generate button disabled/enabled with empty/filled input. Checks "100% factual", "2-page format", "multiple formats" feature cards are visible.

### TEST-621 — Resume tool — Error handling

- **Suite:** E2E | **Tests:** 1 | **GCP:** No
- **Features:** 8.2, 13
- **Implementation:** `web/e2e/resume-tool.spec.ts` (Error Handling)
- **Run:** `npx playwright test resume-tool`

Submits minimal invalid input ("x") via the resume tool form, clicks generate, and waits for either an error message, generating state, or ready state to render — verifying the UI handles bad input gracefully.

### TEST-630 — Interview tool — UI

- **Suite:** E2E | **Tests:** 5 | **GCP:** No
- **Features:** 8.3
- **Implementation:** `web/e2e/interview-tool.spec.ts` (UI)
- **Run:** `npx playwright test interview-tool`

Verifies "Interview Me NOW" heading and description text. Waits for captcha pass and verifies welcome message with topic list (work history, technical skills, etc.). Checks chat input field, send button, and "press Enter to send" hint are visible. Verifies "real-time chat", "career-focused", "download transcript" feature cards. Checks new conversation button exists.

### TEST-631 — Interview tool — Input behavior

- **Suite:** E2E | **Tests:** 5 | **GCP:** No
- **Features:** 8.3
- **Implementation:** `web/e2e/interview-tool.spec.ts` (Input Behavior)
- **Run:** `npx playwright test interview-tool`

Types a question and clicks send — verifies user message appears in chat. Types a message and presses Enter — verifies it sends. Sends a message and verifies input becomes disabled with "waiting for response" placeholder while AI responds. Sends a message and checks for typing indicator during wait. Clicks "new conversation" after sending a message and verifies the chat resets (message disappears, welcome message returns).

### TEST-632 — Interview tool — Conversation

- **Suite:** E2E | **Tests:** 1 | **GCP:** Yes
- **Features:** 8.3, 7
- **Implementation:** `web/e2e/interview-tool.spec.ts` (Conversation)
- **Run:** `npx playwright test interview-tool`

Sends "What programming languages do you know?" in the interview chat, waits for AI response, verifies 2-message chat history is visible (user + assistant), clicks the download transcript button, and saves the response fixture to `test-fixtures/` for regression testing.

---

## 3. E2E Real LLM Tests (Custom Script)

Run with `cd web && npm run test:e2e:real`. Requires GCP credentials and seeded resume data (`npm run seed:resume`).

### TEST-650 — Real LLM — Fit tool

- **Suite:** E2E Real LLM | **Tests:** 1 | **GCP:** Yes
- **Features:** 8.1, 7, 8.4, 11
- **Implementation:** `web/scripts/e2e-real-llm.ts` (testFitTool)
- **Run:** `npm run test:e2e:real`

End-to-end fit tool test with real Vertex AI: creates test session and submission in Firestore, extracts job fields from sample posting, builds fit analysis prompt with resume context, calls Vertex AI, validates JSON response structure (overallScore, recommendation, categories with scores/rationale/citations), stores report artifacts in GCS, and updates submission status.

### TEST-651 — Real LLM — Resume tool

- **Suite:** E2E Real LLM | **Tests:** 1 | **GCP:** Yes
- **Features:** 8.2, 7, 8.4, 11
- **Implementation:** `web/scripts/e2e-real-llm.ts` (testResumeTool)
- **Run:** `npm run test:e2e:real`

End-to-end resume tool test with real Vertex AI: creates test session and submission, builds resume generation prompt with resume context and job posting, calls Vertex AI, validates JSON response structure (header, summary, skills, experience with bullets, education), generates markdown resume, stores artifacts in GCS, and verifies word count is within limits.

### TEST-652 — Real LLM — Interview tool

- **Suite:** E2E Real LLM | **Tests:** 1 | **GCP:** Yes
- **Features:** 8.3, 7, 8.4, 11
- **Implementation:** `web/scripts/e2e-real-llm.ts` (testInterviewTool)
- **Run:** `npm run test:e2e:real`

End-to-end interview tool test with real Vertex AI: creates test session and submission, builds interview system prompt with resume context, simulates multi-turn conversation (2 questions), validates response structure, generates transcript with citations, stores transcript artifacts in GCS, and saves fixture for regression testing.

---

## 4. GCP Smoke Tests (Custom Script)

Run with `cd web && npm run smoke:gcp`. All sections require GCP credentials. Individual sections can be run with `npm run smoke:gcp -- --section=N`.

### TEST-670 — Smoke — Cloud Storage

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 11
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 1)
- **Run:** `npm run smoke:gcp -- --section=1`

Verifies GCS connectivity: writes a test file to the private bucket, reads it back, verifies content matches, and deletes the test file.

### TEST-671 — Smoke — Firestore

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 11
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 2)
- **Run:** `npm run smoke:gcp -- --section=2`

Verifies Firestore connectivity: writes a test document, reads it back, verifies fields match, and deletes the test document.

### TEST-672 — Smoke — Session

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 10.1, 11
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 3)
- **Run:** `npm run smoke:gcp -- --section=3`

Verifies session lifecycle: creates a session document in Firestore with timestamps and IP hash, reads it back, verifies TTL calculation, and cleans up.

### TEST-673 — Smoke — Resume Upload

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 8.2, 11
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 4)
- **Run:** `npm run smoke:gcp -- --section=4`

Verifies resume upload pipeline: uploads a test PDF to GCS, verifies it exists in the correct path, checks content-type metadata, and cleans up.

### TEST-674 — Smoke — Resume Chunking

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 8.2, 11
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 5)
- **Run:** `npm run smoke:gcp -- --section=5`

Verifies resume chunking with Firestore: reads seeded resume chunks, verifies chunk structure (chunkId, title, sourceRef, content), checks chunk count matches index, and validates version consistency.

### TEST-675 — Smoke — Dance Menu Upload

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 8.5, 11
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 6)
- **Run:** `npm run smoke:gcp -- --section=6`

Verifies dance menu upload pipeline: uploads a test image to GCS, verifies it exists in the correct public bucket path, checks content-type, and cleans up.

### TEST-676 — Smoke — Submission & Artifact Bundle

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 11
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 7)
- **Run:** `npm run smoke:gcp -- --section=7`

Verifies submission creation and artifact bundling: creates a submission in Firestore, uploads artifact files to GCS under the submission prefix, verifies bundle completeness, and cleans up both Firestore and GCS.

### TEST-677 — Smoke — Spend Cap

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 10.3, 11
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 8)
- **Run:** `npm run smoke:gcp -- --section=8`

Verifies spend cap tracking: creates/reads a monthly spend document in Firestore, increments token counts, verifies budget remaining calculation, and cleans up.

### TEST-678 — Smoke — Job Ingestion URL Fetch

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 8.1
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 9)
- **Run:** `npm run smoke:gcp -- --section=9`

Verifies URL-based job ingestion: fetches a real web page, extracts text content, verifies character and word counts are within expected ranges, and validates the ingestion result structure.

### TEST-679 — Smoke — Vertex AI Gemini

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 7, 8.1
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 10)
- **Run:** `npm run smoke:gcp -- --section=10`

Verifies Vertex AI connectivity and fit report generation: sends a prompt to Gemini, receives a response, validates JSON structure (overallScore, categories, citations), and logs token usage and cost estimate.

### TEST-680 — Smoke — Resume Generation

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 7, 8.2
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 11)
- **Run:** `npm run smoke:gcp -- --section=11`

Verifies resume generation with Vertex AI: sends resume generation prompt with job posting and resume context, validates JSON response (header, summary, skills, experience, education), checks word count is within 2-page limit, and logs token usage.

### TEST-681 — Smoke — Interview Chat

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 7, 8.3
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 12)
- **Run:** `npm run smoke:gcp -- --section=12`

Verifies interview chat with Vertex AI: sends a multi-turn conversation, validates response structure and content relevance, verifies career-focused guardrails, and logs token usage across turns.

### TEST-682 — Smoke — Retention Cleanup

- **Suite:** GCP Smoke | **Tests:** 1 | **GCP:** Yes
- **Features:** 11
- **Implementation:** `web/scripts/smoke-gcp.ts` (Section 13)
- **Run:** `npm run smoke:gcp -- --section=13`

Verifies retention cleanup logic with real GCP: creates expired test submissions in Firestore and GCS, runs cleanup, verifies expired data is deleted while non-expired data is preserved, and validates the cleanup summary.

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
| 8.6 | Static Pages | TEST-026, TEST-027, TEST-028, TEST-029, TEST-030, TEST-031, TEST-032, TEST-033, TEST-035, TEST-036, TEST-038, TEST-600, TEST-601, TEST-603, TEST-606 |
| 9 | Authentication | TEST-002, TEST-602 |
| 10.1 | Session Management | TEST-001, TEST-004, TEST-034, TEST-037, TEST-604, TEST-672 |
| 10.2 | Rate Limiting | TEST-005 |
| 10.3 | Spend Cap | TEST-006, TEST-677 |
| 11 | Storage / Firestore / Retention | TEST-007, TEST-008, TEST-019, TEST-020, TEST-023, TEST-025, TEST-604, TEST-650, TEST-651, TEST-652, TEST-670, TEST-671, TEST-672, TEST-673, TEST-674, TEST-675, TEST-676, TEST-677, TEST-682 |
| 13 | Error Handling | TEST-009, TEST-605, TEST-611, TEST-621 |
