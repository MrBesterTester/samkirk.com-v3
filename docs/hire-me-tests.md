# Hire-Me Test Descriptions

> Quick-reference for every test covering the hire-me tools (fit, resume, interview), their supporting modules, and general site tests. Ordered from smallest to largest test coverage — unit tests (isolated functions) through full-stack E2E with real LLMs — the natural CI execution order. See [test-catalog.md](test-catalog.md) for full details.

## Table of Contents

- [Input/Output Modality Coverage](#inputoutput-modality-coverage)
- [Overview](#overview)
- [1. Unit Tests — Library (1,173 hire-me tests of 1,232 total)](#1-unit-tests--library-1173-hire-me-tests-of-1232-total)
  - [TEST-003 — Environment parsing (3)](#test-003--environment-parsing-3-tests)
  - [TEST-025 — Public proxy API route (3)](#test-025--public-proxy-api-route-3-tests)
  - [TEST-007 — Firestore path helpers (10)](#test-007--firestore-path-helpers-10-tests)
  - [TEST-008 — Storage path helpers (10)](#test-008--storage-path-helpers-10-tests)
  - [TEST-002 — Admin email allowlist (11)](#test-002--admin-email-allowlist-11-tests)
  - [TEST-004 — CAPTCHA verification helpers (14)](#test-004--captcha-verification-helpers-14-tests)
  - [TEST-024 — Vertex AI error classes (19)](#test-024--vertex-ai-error-classes-19-tests)
  - [TEST-015 — Resume upload validation (22)](#test-015--resume-upload-validation-22-tests)
  - [TEST-022 — Dance menu upload validation (29)](#test-022--dance-menu-upload-validation-29-tests)
  - [TEST-023 — Artifact bundler (30)](#test-023--artifact-bundler-30-tests)
  - [TEST-001 — Session module (34)](#test-001--session-module-34-tests)
  - [TEST-012 — Fit report generation (36)](#test-012--fit-report-generation-36-tests)
  - [TEST-017 — Interview chat module (44)](#test-017--interview-chat-module-44-tests)
  - [TEST-016 — Resume markdown chunking (49)](#test-016--resume-markdown-chunking-49-tests)
  - [TEST-005 — Rate limit module (50)](#test-005--rate-limit-module-50-tests)
  - [TEST-013 — Resume RAG context assembly (50)](#test-013--resume-rag-context-assembly-50-tests)
  - [TEST-019 — Submission module (53)](#test-019--submission-module-53-tests)
  - [TEST-020 — Retention cleanup module (55)](#test-020--retention-cleanup-module-55-tests)
  - [TEST-021 — Markdown renderer (56)](#test-021--markdown-renderer-56-tests)
  - [TEST-006 — Monthly spend cap module (60)](#test-006--monthly-spend-cap-module-60-tests)
  - [TEST-014 — Resume generation logic (62)](#test-014--resume-generation-logic-62-tests)
  - [TEST-010 — Job ingestion pipeline (74)](#test-010--job-ingestion-pipeline-74-tests)
  - [TEST-011 — Fit tool flow state machine (96)](#test-011--fit-tool-flow-state-machine-96-tests)
  - [TEST-009 — API error handling framework (107)](#test-009--api-error-handling-framework-107-tests)
  - [TEST-018 — Interview guardrails classification (196)](#test-018--interview-guardrails-classification-196-tests)
- [1b. Unit Tests — Components & Pages (59 tests)](#1b-unit-tests--components--pages-59-tests)
  - [Footer (2)](#footer-2-tests)
  - [Explorations — Category Theory page (3)](#explorations--category-theory-page-3-tests)
  - [Explorations — Dance Instruction page (3)](#explorations--dance-instruction-page-3-tests)
  - [Explorations — Pocket Flow page (3)](#explorations--pocket-flow-page-3-tests)
  - [Explorations — Uber Level AI Skills page (3)](#explorations--uber-level-ai-skills-page-3-tests)
  - [Explorations hub page (3)](#explorations-hub-page-3-tests)
  - [Home page (5)](#home-page-5-tests)
  - [Header (6)](#header-6-tests)
  - [ReCaptcha (6)](#recaptcha-6-tests)
  - [Song Dedication page (6)](#song-dedication-page-6-tests)
  - [StaticHtmlViewer (6)](#statichtmlviewer-6-tests)
  - [ToolGate (6)](#toolgate-6-tests)
  - [ToolPreview (7)](#toolpreview-7-tests)
- [2. GCP Smoke Tests (6 hire-me tests of 13 total)](#2-gcp-smoke-tests-6-hire-me-tests-of-13-total)
  - [TEST-670 — Cloud Storage (1)](#test-670--cloud-storage-1-test)
  - [TEST-671 — Firestore (1)](#test-671--firestore-1-test)
  - [TEST-672 — Session (1)](#test-672--session-1-test)
  - [TEST-673 — Resume Upload (1)](#test-673--resume-upload-1-test)
  - [TEST-674 — Resume Chunking (1)](#test-674--resume-chunking-1-test)
  - [TEST-675 — Dance Menu Upload (1)](#test-675--dance-menu-upload-1-test)
  - [TEST-676 — Submission & Artifact Bundle (1)](#test-676--submission--artifact-bundle-1-test)
  - [TEST-677 — Spend Cap (1)](#test-677--spend-cap-1-test)
  - [TEST-678 — Job Ingestion URL Fetch (1)](#test-678--job-ingestion-url-fetch-1-test)
  - [TEST-679 — Vertex AI Gemini (1)](#test-679--vertex-ai-gemini-1-test)
  - [TEST-680 — Resume Generation (1)](#test-680--resume-generation-1-test)
  - [TEST-681 — Interview Chat (1)](#test-681--interview-chat-1-test)
  - [TEST-682 — Retention Cleanup (1)](#test-682--retention-cleanup-1-test)
- [3. E2E Tests — Playwright (22 hire-me tests of 47 total)](#3-e2e-tests--playwright-22-hire-me-tests-of-47-total)
  - [TEST-611 — Fit tool — Error handling (1)](#test-611--fit-tool--error-handling-1-test)
  - [TEST-621 — Resume tool — Error handling (1)](#test-621--resume-tool--error-handling-1-test)
  - [TEST-632 — Interview tool — Conversation (1)](#test-632--interview-tool--conversation-1-test)
  - [TEST-604 — Full app — API health (2)](#test-604--full-app--api-health-2-tests)
  - [TEST-605 — Full app — Error handling (2)](#test-605--full-app--error-handling-2-tests)
  - [TEST-606 — Full app — Accessibility (3)](#test-606--full-app--accessibility-3-tests)
  - [TEST-601 — Full app — Exploration pages (4)](#test-601--full-app--exploration-pages-4-tests)
  - [TEST-602 — Full app — Admin auth required (4)](#test-602--full-app--admin-auth-required-4-tests)
  - [TEST-610 — Fit tool — Happy path (4)](#test-610--fit-tool--happy-path-4-tests)
  - [TEST-600 — Full app — Public pages (5)](#test-600--full-app--public-pages-5-tests)
  - [TEST-603 — Full app — Navigation (5)](#test-603--full-app--navigation-5-tests)
  - [TEST-620 — Resume tool — Happy path (5)](#test-620--resume-tool--happy-path-5-tests)
  - [TEST-630 — Interview tool — UI (5)](#test-630--interview-tool--ui-5-tests)
  - [TEST-631 — Interview tool — Input behavior (5)](#test-631--interview-tool--input-behavior-5-tests)
- [4. E2E Real LLM Tests (3 hire-me tests of 3 total)](#4-e2e-real-llm-tests-3-hire-me-tests-of-3-total)
  - [TEST-650 — Real LLM — Fit tool (1)](#test-650--real-llm--fit-tool-1-test)
  - [TEST-651 — Real LLM — Resume tool (1)](#test-651--real-llm--resume-tool-1-test)
  - [TEST-652 — Real LLM — Interview tool (1)](#test-652--real-llm--interview-tool-1-test)

---

## Input/Output Modality Coverage

Analysis of whether tests cover all user-facing input and output modalities across the three hire-me tools.

### User-Facing Inputs

**Job Description Input (Fit + Resume tools) — 3 modes:**

| Mode | Unit Tests | E2E Tests | Gap? |
|------|-----------|-----------|------|
| **Paste text** | TEST-010: valid text, whitespace, empty, too-short/too-long (5 cases) | TEST-610/620: pastes job posting, full flow completes | Covered |
| **Enter URL** | TEST-010: HTML fetch, content-type detection, non-HTML rejection, redirects, timeout (8 cases) | TEST-610/620: clicks "enter url", verifies input field **appears** | E2E never submits a URL end-to-end |
| **Upload file** | TEST-010: size limits, extension filtering, MIME type checks, text extraction (10+ cases) | TEST-610/620: verifies upload mode **is available** | E2E never uploads a file end-to-end |

**Interview Chat Input:**

| Mode | Unit Tests | E2E Tests | Gap? |
|------|-----------|-----------|------|
| **Type message + Send button** | TEST-017: empty/oversized rejection, turn limits (20+ cases) | TEST-631: types and clicks send, message appears | Covered |
| **Type message + Enter key** | — | TEST-631: types and presses Enter, verifies it sends | Covered |

**Follow-up Questions (Fit tool only):**

| Mode | Unit Tests | E2E Tests | Gap? |
|------|-----------|-----------|------|
| **Answer follow-up Q's** | TEST-011: input validation, type matching, answer history (10 cases) | TEST-610: "handles follow-up questions if any" | Covered (conditionally) |

### User-Facing Outputs

**On-Screen Results:**

| Output | Unit Tests | E2E Tests | Gap? |
|--------|-----------|-----------|------|
| **Fit score + recommendation + categories** | TEST-012: markdown report with score, emoji, breakdowns (36 tests) | TEST-610: verifies score, recommendation, category breakdown visible | Covered |
| **Generated resume** | TEST-014: header, summary, skills, experience, education (62 tests) | TEST-620: verifies summary, experience, skills, factual note visible | Covered |
| **Chat response bubbles** | TEST-017: message formatting with role labels (44 tests) | TEST-631/632: verifies AI response appears, 2-message history | Covered |
| **Typing indicator** | — | TEST-631: checks for typing indicator during AI wait | Covered |

**Downloads:**

| Output | Unit Tests | E2E Tests | Gap? |
|--------|-----------|-----------|------|
| **Download fit report** | TEST-021: HTML/markdown rendering, full document with CSS (56 tests); TEST-023: bundle with report.md, report.json | TEST-610: no download button test mentioned | **No E2E download test** |
| **Download resume** | TEST-014: markdown generation; TEST-021: HTML rendering; TEST-023: bundle with resume.md, resume.json | TEST-620: download button **visible**, not clicked | **Button visibility only — no actual download** |
| **Download interview transcript** | TEST-017: transcript generation with role labels, citations (8 tests); TEST-023: bundle with transcript.md | TEST-632: clicks download button, saves fixture | Closest to covered, but doesn't verify downloaded file content |

### Summary of Gaps

1. **URL input mode is never exercised end-to-end.** Unit tests prove the fetch/parse pipeline works, and E2E confirms the input field renders, but no E2E test pastes a URL, clicks analyze/generate, and verifies results.
2. **File upload input mode is never exercised end-to-end.** Same pattern — unit tests validate metadata/content, E2E confirms the mode exists in the UI, but no test selects a file and submits it.
3. **Fit report download has no E2E coverage at all.** The E2E happy path verifies on-screen results but doesn't mention a download button or action.
4. **Resume download is visibility-only.** The button is confirmed present but never clicked; downloaded content is never verified.
5. **Interview transcript download is the best covered** — the button is clicked and a fixture is saved — but even here the test doesn't verify the downloaded file's content/format matches expectations.

**Bottom line:** Paste-in + on-screen display is well covered across all three tools. URL and file-upload input modes and download output are tested at the unit/library level but have no true end-to-end exercise through the browser UI.

---

## Overview

| Suite | Entries | Individual Tests | Hire-Me Tests | How to Run |
|-------|---------|-----------------|---------------|------------|
| Unit (Vitest) | 38 | 1,232 | 1,126 of 1,232 | `cd web && npm test` |
| GCP Smoke | 13 | 13 | 6 of 13 | `cd web && npm run smoke:gcp` |
| E2E (Playwright) | 14 | 47 | 22 of 47 | `cd web && npx playwright test` |
| E2E Real LLM | 3 | 3 | 3 of 3 | `cd web && npm run test:e2e:real` |
| **Total** | **68** | **1,295** | **1,157 of 1,295** | `cd web && npm run test:all` |

**Hire-me breakdown:** 704 tests exercise fit/resume/interview tool logic directly; 422 cover supporting infrastructure (session, captcha, rate-limit, spend-cap, API errors, submission, retention, artifact-bundler, Vertex AI); 31 cover hire-me E2E and smoke paths. The remaining 138 tests cover general site features (pages, navigation, auth, storage paths, dance-menu uploads).

---

## 1. Unit Tests — Library (1,173 hire-me tests of 1,232 total)

Run with `cd web && npm test`. No GCP credentials required unless noted. Entries ordered by test count ascending.

### TEST-003 — Environment parsing (3 tests)
`web/src/lib/env.test.ts` | [catalog](test-catalog.md#test-003--environment-parsing)
Tests `parseEnv` with Zod schema validation. Inputs: env objects with required fields (GCP_PROJECT_ID, etc.). Asserts valid env accepted, missing required values throw with field name in message, and empty-string values throw with descriptive error.

### TEST-025 — Public proxy API route (3 tests)
`web/src/app/api/public/[...path]/route.test.ts` | [catalog](test-catalog.md#test-025--public-proxy-api-route)
Tests the GCS-to-HTTP proxy route handler. Serves an existing file from the public GCS bucket (asserts 200, correct content-type, cache-control headers), returns 404 for missing files, and blocks directory traversal attempts (`../` in path) with a 400 response. First two tests require GCP credentials; traversal test uses mocks.

### TEST-007 — Firestore path helpers (10 tests)
`web/src/lib/firestore.test.ts` | [catalog](test-catalog.md#test-007--firestore-path-helpers)
Tests Firestore document path construction. Verifies `Collections` constants (sessions, rateLimits, spendMonthly, resumeChunks, submissions), `sessionDocPath` / `rateLimitDocPath` / `spendMonthlyDocPath` / `resumeIndexDocPath` / `resumeChunkDocPath` / `submissionDocPath` all produce correct `collection/documentId` strings. Also tests `getCurrentMonthKey` for YYYY-MM format, zero-padded months, and December handling.

### TEST-008 — Storage path helpers (10 tests)
`web/src/lib/storage.test.ts` | [catalog](test-catalog.md#test-008--storage-path-helpers)
Tests GCS path construction for both buckets. `PrivatePaths`: masterResume (fixed path), resumeIndex (JSON path), submissionPrefix/submissionInput/submissionExtracted/submissionOutput/submissionBundle (parameterized by submissionId and filename). `PublicPaths`: danceMenuCurrent (fixed prefix), danceMenuFile (parameterized), danceMenuVersioned (version-prefixed).

### TEST-002 — Admin email allowlist (11 tests)
`web/src/lib/auth.test.ts` | [catalog](test-catalog.md#test-002--admin-email-allowlist)
Tests `isEmailAllowed` against a single-email allowlist. Inputs: null, undefined, empty string, exact match, uppercase/mixed-case variants, non-matching email, partial match, suffix attack (`admin@example.comevil`), prefix attack (`eviladmin@example.com`), and undefined allowedEmail env var. Asserts exact-match-only semantics with case-insensitive comparison.

### TEST-004 — CAPTCHA verification helpers (14 tests)
`web/src/lib/captcha.test.ts` | [catalog](test-catalog.md#test-004--captcha-verification-helpers)
Tests `buildVerifyRequestBody`: constructs URLSearchParams with secret and response token, includes remoteip when provided, preserves special characters in tokens, omits remoteip when empty string. Tests `mapRecaptchaErrorCodes` with 10 cases: returns default "Captcha verification failed" for undefined and empty arrays, maps missing-input-response → "Please complete the captcha", invalid-input-response → "Invalid captcha response", timeout-or-duplicate → "Captcha expired", missing/invalid-input-secret → "Server configuration error", bad-request → "Invalid request", returns first match when multiple codes present, and returns default for unknown codes.

### TEST-024 — Vertex AI error classes (19 tests)
`web/src/lib/vertex-ai.test.ts` | [catalog](test-catalog.md#test-024--vertex-ai-error-classes)
Tests custom error classes for LLM failures. `ContentBlockedError`: message/code properties, safety ratings array, JSON serialization, undefined ratings handling. `GenerationError`: message/code properties, cause chaining for wrapped errors, JSON serialization. Type guards: `isSpendCapError`, `isContentBlockedError`, `isGenerationError` each tested with true/false/non-error inputs. Error inheritance: verifies Error → AppError → specific error chain and stack trace presence.

### TEST-015 — Resume upload validation (22 tests)
`web/src/lib/resume-upload.test.ts` | [catalog](test-catalog.md#test-015--resume-upload-validation)
Tests resume file upload pipeline. Extension detection from filenames. Allowed extension checking for pdf/doc/docx/txt/md and rejection of others. File metadata validation: size limits (5 MB max), extension filtering, MIME type mismatch detection, zero-byte file rejection. File content validation: valid markdown acceptance, UTF-8 encoding, empty/whitespace-only rejection, binary content detection via magic bytes. Bundle validation for complete uploads with required files. Format display name mapping and upload constants.

### TEST-022 — Dance menu upload validation (29 tests)
`web/src/lib/dance-menu-upload.test.ts` | [catalog](test-catalog.md#test-022--dance-menu-upload-validation)
Tests dance menu file upload pipeline (images and PDFs). `getFileExtension` (5 cases: standard, uppercase, no extension, dotfiles, multi-dot). `isAllowedExtension` for pdf/jpg/png/webp. `validateFileMetadata` (5 cases: valid metadata, content-type mismatch, invalid extension, oversized, zero-byte). `validateFileContent` (4 cases: text, HTML, valid PDF magic bytes, invalid PDF). `validateBundle` (9 cases: complete bundles, optional files, missing required files, duplicates, size calculations, storage filenames, max total size exceeded). Format display names and constants.

### TEST-023 — Artifact bundler (30 tests)
`web/src/lib/artifact-bundler.test.ts` | [catalog](test-catalog.md#test-023--artifact-bundler)
Tests submission artifact packaging. `createBundle`: string and Buffer content, nested paths, UTF-8 encoding, large files, special characters, magic byte preservation (10 cases). `getExpectedBundleFiles`: per-tool file manifests for fit/resume/interview — metadata.json, input files, extracted data, output files, and optional citations (15 cases). `validateBundleFiles`: completeness checks, missing metadata detection, empty file lists (3 cases). Tool-specific bundle structure validation for each tool type (2 cases).

### TEST-001 — Session module (34 tests)
`web/src/lib/session.test.ts` | [catalog](test-catalog.md#test-001--session-module)
Tests session lifecycle utilities. `generateSessionId`: 32-char length, base64url charset, uniqueness across 100 IDs, entropy distribution (4 tests). `isValidSessionId`: valid IDs accepted, rejects empty/too-short/too-long/invalid-char strings, allows underscores and hyphens (10 tests). `getSessionCookieOptions`: httpOnly flag, sameSite=lax, path=/, maxAge=24h, secure flag toggled by NODE_ENV prod/dev/test (6 tests). `createSessionTimestamps`: Firestore Timestamp types for createdAt/expiresAt, 24-hour TTL offset, current-time proximity (4 tests). `hashIp`: 64-char hex output, deterministic for same input, different hashes for different IPs, IPv6 support, empty-string handling (5 tests). Exported constants (5 tests).

### TEST-012 — Fit report generation (36 tests)
`web/src/lib/fit-report.test.ts` | [catalog](test-catalog.md#test-012--fit-report-generation)
Tests the LLM-powered fit analysis pipeline. System prompt structure: location rules, JSON format, score range instructions (3 tests). `formatExtractedFields`: populated fields, null/unknown fields, empty skills array, completely empty object (4 tests). `buildFitAnalysisPrompt`: includes job text, extracted info, resume chunk context, analysis instructions (4 tests). `parseFitAnalysisResponse`: valid JSON, markdown-wrapped JSON, code fences, invalid JSON error, score validation, error cases, missing fields (9 tests). `generateMarkdownReport`: header, job info, overall score with emoji indicators, recommendations, per-category breakdowns, unknown-field section (7 tests). Citation generation from chunk references and empty arrays (2 tests). `FitReportError` class properties and JSON serialization (2 tests).

### TEST-017 — Interview chat module (44 tests)
`web/src/lib/interview-chat.test.ts` | [catalog](test-catalog.md#test-017--interview-chat-module)
Tests conversational interview engine. Constants: max turns, token limits, subject name (3 tests). `buildInterviewSystemPrompt`: injects subject name, resume context, behavioral tags, conversation guidelines, topic instructions (7 tests). `generateTranscript`: empty messages, candidate name header, message formatting with role labels, citation appendix, section dividers (8 tests). `processMessage`: empty/oversized message rejection, turn limit enforcement, guardrails integration (off-topic redirection), successful processing with LLM response, error handling for LLM failures, citation attachment (~20 tests). `getOrCreateConversation`: new conversation creation, existing conversation retrieval, expiration handling (3 tests). `InterviewChatError` class (1 test).

### TEST-016 — Resume markdown chunking (49 tests)
`web/src/lib/resume-chunker.test.ts` | [catalog](test-catalog.md#test-016--resume-markdown-chunking)
Tests the resume-to-chunks pipeline for RAG retrieval. `parseLines`: splits by newlines, handles Windows CRLF, empty string, single line (4 tests). `extractHeadings`: all heading levels, ignores non-headings, empty array, trimming, special characters (6 tests). `parseIntoSections`: simple resume structure, no-heading fallback, content before first heading, parent hierarchy, empty sections (5 tests). `generateChunkId`: deterministic output, different versions/titles/hashes produce different IDs, correct prefix format (5 tests). `hashContent`: SHA-256 consistency, different content, 8-char hex format (3 tests). `generateTitle`/`generateSourceRef`: null heading, single heading, hierarchical titles/refs (7 tests). `splitLargeSection`: content within limits, below minimum, paragraph splitting, part numbering (5 tests). `chunkMarkdown`: simple resume, stable IDs, different versions, no-heading input, empty/whitespace, heading hierarchy, large section merging (7 tests). ID stability across calls and content-change detection (2 tests). Edge cases: heading-only markdown, long lines, unicode, code blocks, bullet lists (5 tests).

### TEST-005 — Rate limit module (50 tests)
`web/src/lib/rate-limit.test.ts` | [catalog](test-catalog.md#test-005--rate-limit-module)
Tests sliding-window rate limiting. Constants: window duration, max requests, key prefix, header names (4 tests). `RateLimitError`: message, retryAfterMs, JSON serialization, HTTP status (4 tests). `getClientIp`: X-Forwarded-For extraction, first IP from comma chain, whitespace trimming, X-Real-IP fallback, missing-header fallback, IPv6 support (8 tests). `deriveRateLimitKey`: default/custom prefix, deterministic for same session+IP, different keys for different sessions/IPs, manageable length, Firestore-safe characters (7 tests). Window creation, expiration checks, remaining-time calculation across multiple time points (17 tests). Integration: complete 10-request scenario with timing, counter simulation (10 requests succeed, 11th blocked, window reset), and error message formatting (6 tests).

### TEST-013 — Resume RAG context assembly (50 tests)
`web/src/lib/resume-context.test.ts` | [catalog](test-catalog.md#test-013--resume-rag-context-assembly)
Tests resume chunk retrieval and formatting for LLM prompts. `formatChunkForContext`: detailed/compact/minimal formats, 1-indexed numbering, with/without chunk IDs (11 tests). `assembleContextFromChunks`: empty chunks, all chunks included, separator characters, maxChunks option, format options, character count reporting (18 tests). `getResumeContext` with Firestore integration: loads chunks, passes options, handles empty chunks (3 tests). Citation generation: all chunks, empty arrays, field preservation, no-content handling, referenced-ID filtering, deduplication, ordering (7 tests). `createCitationMap`: map creation, lookups, non-existent IDs, empty input (4 tests). `getContextSummary`/`isResumeContextAvailable`/`getResumeContextSize` (4 tests). Integration: context + citations combined, maxChunks affecting both, citation map lookups (3 tests).

### TEST-019 — Submission module (53 tests)
`web/src/lib/submission.test.ts` | [catalog](test-catalog.md#test-019--submission-module)
Tests submission lifecycle tracking. Constants: ID byte length, 90-day retention, millisecond conversion, valid tool/status lists (6 tests). `generateSubmissionId`/`isValidSubmissionId`: string type, correct length, uniqueness, base64url charset, rejects short/long/invalid-char IDs (9 tests). Timestamps: createdAt/expiresAt as Firestore Timestamps, 90-day offset, from-specific-date variant, year-boundary handling (7 tests). `isSubmissionExpired`: before/after/at expiration, 89-day vs 90-day boundary (5 tests). `buildArtifactGcsPrefix`: correct format, trailing slash, special characters (3 tests). Tool/status/citation validation: valid and invalid values, case sensitivity, citation structure with required fields, URL format, forward compatibility, array validation (16 tests). TTL edge cases: DST transitions, year boundary, time preservation (5 tests). Type definitions (2 tests).

### TEST-020 — Retention cleanup module (55 tests)
`web/src/lib/retention.test.ts` | [catalog](test-catalog.md#test-020--retention-cleanup-module)
Tests automated data expiration. Constants: 90-day retention period, batch sizes (3 tests). `isExpired`: before/at/after expiry timestamps, default-current-time behavior, millisecond precision (8 tests). `isValidSubmissionPrefix`: valid format, trailing slash, special chars, invalid patterns, nested paths, real base64url IDs (11 tests). `extractSubmissionIdFromPrefix`: with/without trailing slash, special chars, invalid prefixes, nested paths (7 tests). `buildCleanupSummary`: empty cleanup, successful/failed counts, error tracking, duration formatting, security field exclusion (7 tests). Type structure validation: ExpiredSubmission, DeletionResult, RetentionCleanupResult fields and tool types (4 tests). Retention policy edge cases: 89/90-day boundary, leap year, year boundary (4 tests). Idempotency: retry safety, partial deletion recovery (2 tests). Security: path traversal prevention, safe extraction, no sensitive data in summary (3 tests).

### TEST-021 — Markdown renderer (56 tests)
`web/src/lib/markdown-renderer.test.ts` | [catalog](test-catalog.md#test-021--markdown-renderer)
Tests HTML generation from markdown with security sanitization. `renderMarkdown`: headings, paragraphs, ordered/unordered lists, code blocks, inline links, bold/italic, tables, nested structures, sanitization toggle (13 tests). `fullDocument` option: fragment vs full HTML, DOCTYPE declaration, title injection, escaped title, CSS embedding (6 tests). `renderMarkdownSync` alias (1 test). `sanitizeHtml`: script/style tag removal, event handler stripping, javascript: URL blocking, safe href/src URLs preserved, standard HTML tags retained, nested malicious tags, multiple event handlers (13 tests). `escapeHtml`: ampersands, angle brackets, quotes, apostrophes, combined special chars, empty string (7 tests). `wrapInDocument`: full HTML5 structure, default CSS, custom CSS injection (3 tests). `renderCitationsHtml`/`renderCitationsMarkdown`: empty arrays, section headings, numbered citation lists, link formatting, XSS prevention in citation text (9 tests). `appendCitationsToMarkdown`/`renderMarkdownWithCitations`: combined output, no-citation handling, default title (5 tests). `DEFAULT_MARKDOWN_CSS` essential styling and citation-specific styles (2 tests).

### TEST-006 — Monthly spend cap module (60 tests)
`web/src/lib/spend-cap.test.ts` | [catalog](test-catalog.md#test-006--monthly-spend-cap-module)
Tests LLM usage budget tracking. Constants: $20 monthly cap, contact email, per-token costs, output-more-expensive-than-input assertion, minimum cost floor (8 tests). `SpendCapError`: message, privacy (no budget amounts in user-facing error), JSON serialization (4 tests). `getMonthKeyForDate`/`parseMonthKey`/`getNextMonthKey`: YYYY-MM format, zero-padded months, year boundaries, round-trip consistency, year rollover from December (14 tests). `estimateLlmCost`: proportional to token counts, linear scaling, minimum floor, zero tokens, realistic and large cost scenarios (6 tests). `estimateTokensFromText`: ~4 chars per token heuristic, minimum 1 token, zero for empty, long text, rounding (5 tests). `createSpendMonthlyDoc`: default/custom budget, zero spend, current timestamp (4 tests). `isSpendCapExceeded`: under/at/over budget, zero spend, floating-point precision, tiny overage (6 tests). `getRemainingBudget`: remaining amount, at-limit, over-limit, full budget, floating-point (5 tests). Month boundary and cost estimation scenarios (5 tests). Integration: month of usage tracking, budget exhaustion flow (3 tests).

### TEST-014 — Resume generation logic (62 tests)
`web/src/lib/resume-generator.test.ts` | [catalog](test-catalog.md#test-014--resume-generation-logic)
Tests the LLM-powered resume tailoring pipeline. Constants: 600-900 word target, section limits, 2-page constraint (3 tests). System prompt: NEVER-INVENT guidance, word count constraints, bullet limits, JSON output format, tailoring instructions, ATS optimization (6 tests). `buildResumeGenerationPrompt`: job posting injection, target position variations, resume context inclusion, formatting instructions, empty-chunk handling (8 tests). `parseResumeResponse`: valid JSON, markdown wrapping, code fences, invalid JSON, object type validation, header/summary/skills/experience/education field requirements, missing fields, array validation, skill/bullet filtering, deep structure validation (22 tests). `generateMarkdownResume`: header section, contact info, LinkedIn formatting, summary, skills with categories, experience with bullets, education, additional sections, location, emptiness checks (10 tests). `countResumeWords`: per-section counting (header/summary/skills/experience/education/additional), empty strings, complete resume total (8 tests). `ResumeGeneratorError` class and type definitions (5 tests).

### TEST-010 — Job ingestion pipeline (74 tests)
`web/src/lib/job-ingestion.test.ts` | [catalog](test-catalog.md#test-010--job-ingestion-pipeline)
Tests multi-mode job description intake (paste, URL, file). Constants: min/max word counts, allowed extensions, size limits (4 tests). `JobIngestionError`: code/message, shouldPromptPaste flag, JSON serialization, instanceof (4 tests). `getFileExtension`: standard extraction, lowercase normalization (2 tests). Allowed extension validation, text normalization (whitespace collapsing, trimming), word counting (3 tests). Paste ingestion: valid text, whitespace handling, empty rejection, too-short/too-long boundaries (5 tests). HTML processing: entity decoding (amp, lt, gt, nbsp, numeric entities), text extraction from nested HTML structures (6 tests). URL ingestion: HTML fetch with content-type detection, non-HTML rejection, fetch error handling, redirect following, timeout behavior (8 tests). File metadata validation: size limits, extension filtering, MIME type checks (6 tests). Text file extraction and file ingestion flow (4 tests). Unified `ingestJob` dispatcher: routes paste/url/file modes correctly (4 tests). Real-world HTML examples from major job boards (3 tests). Edge cases: unicode, extremely long words, mixed whitespace (5+ tests).

### TEST-011 — Fit tool flow state machine (96 tests)
`web/src/lib/fit-flow.test.ts` | [catalog](test-catalog.md#test-011--fit-tool-flow-state-machine)
Tests the multi-step fit analysis orchestration. Constants: MAX_FOLLOW_UPS=5, HOME_LOCATION="Fremont, CA", MAX_COMMUTE_MINUTES=30, MAX_ONSITE_DAYS=2 (4 tests). `createInitialExtractedFields`: null defaults for all fields (2 tests). Seniority extraction: all levels (intern through executive) with priority ranking (8 tests). Location type extraction: remote/hybrid/onsite/ambiguous classification from job text (6 tests). Location fit evaluation: remote always passes, onsite with commute estimation, hybrid with days+commute checks (8 tests). Worst-case location application (3 tests). Follow-up question generation: priority ordering, max-limit enforcement (6 tests). `nextQuestion` state machine: error/ready/question state transitions (6 tests). Follow-up counting: 0-5 boundary testing (4 tests). Answer processing: input validation, type matching (location/frequency/seniority/skills), history tracking (10 tests). `applyAnswerToExtracted`: each field type updates correctly (6 tests). Commute estimation by city pairs (4 tests). Flow initialization: job text parsing triggers field extraction (4 tests). Finalization, readiness checks, unknown field listing (6 tests). Full integration scenarios: remote job, hybrid with multi-follow-up, worst-case evaluation, 5-follow-up limit hit (8+ tests).

### TEST-009 — API error handling framework (107 tests)
`web/src/lib/api-errors.test.ts` | [catalog](test-catalog.md#test-009--api-error-handling-framework)
Tests the error infrastructure used by all API routes. `ERROR_STATUS_CODES`: all error codes mapped to HTTP status codes, specific mappings (authentication→401, rate_limited→429, etc.) (3 tests). Correlation IDs: UUID v4 generation, extraction from request headers, X-Correlation-ID response header attachment (6 tests). `createErrorResponse`: correct status codes, JSON body structure, correlation ID threading, all error code permutations (15 tests). Error serialization: JSON structure, field completeness, nested error serialization (6 tests). Sensitive data detection: API keys, tokens, passwords, emails, connection strings identified and redacted in logs (12 tests). `logError`/`logWarning` helpers: output format, correlation ID inclusion, error chaining (6 tests). `AppError` class: code/status/message properties, `toResponse()` method, `toJSON()`, cause chaining (10 tests). Factory functions: `sessionError`, `captchaRequiredError`, `validationError`, `internalError` with correct codes and status (8 tests). Type guards: `isAppError`, `hasErrorCode`, `hasToResponse`, `hasToJSON` with true/false/non-error inputs (12 tests). Integration: error creation → serialization → response flow, correlation ID round-trip (6 tests).

### TEST-018 — Interview guardrails classification (196 tests)
`web/src/lib/interview-guardrails.test.ts` | [catalog](test-catalog.md#test-018--interview-guardrails-classification)
Tests the topic classifier that keeps interviews career-focused. Constants: subject name, contact email, LLM classification prompt (3 tests). Allowed topic classification (59 parameterized tests via `it.each`): work_history (8 messages), projects (8), skills (8), education (7), availability (6), location_remote (7), compensation (5), career_goals (6), interview_meta (4). Disallowed topic classification (53 parameterized tests): personal_life (8), politics (7), medical (7), religion (6), financial_private (6), general_assistant (9), prompt_injection (6), inappropriate (4). Edge cases: empty/whitespace/very-short messages, ambiguous messages, mixed-case, allowed-vs-disallowed priority (8 tests). `checkGuardrails`: pass-through for allowed, fail with redirect for disallowed, LLM verification suggestion for low-confidence (6 tests). Redirect responses: per-category responses for personal_life/politics/medical/general_assistant/prompt_injection, uniqueness across categories (6 tests). Generic/persistent off-topic responses with subject name and contact email (3 tests). `isPersistentlyOffTopic`: empty list, below threshold, consecutive off-topic, mixed messages, custom threshold, last-N-only checking (6 tests). LLM classification helpers: prompt building, ALLOWED/DISALLOWED parsing (case-insensitive, with explanation text, whitespace handling) (7 tests). Topic category accessors: 9 allowed, 8 disallowed (4 tests). Confidence levels: high for clear matches, medium for single-pattern, high for disallowed (3 tests). Real-world interview examples: 10 allowed + 7 disallowed questions (2 parameterized tests). Prompt injection resistance: 8 injection attempts (1 parameterized test). General assistant rejection: 10 off-topic requests (1 parameterized test). Result structure validation: classification and guardrail result required fields (4 tests). Uses `it.each` across 147 message samples.

---

## 1b. Unit Tests — Components & Pages (59 tests)

React component and page rendering tests. Run with `cd web && npm test`. No GCP credentials required.

### Footer (2 tests)
`web/src/components/Footer.test.tsx`
Renders copyright text with dynamically computed current year ("YYYY Sam Kirk"). Renders contact email as a clickable `mailto:sam@samkirk.com` link.

### Explorations — Category Theory page (3 tests)
`web/src/app/explorations/category-theory/page.test.tsx`
Renders "Category Theory" heading. Renders page description about everyday category theory examples. Renders `StaticHtmlViewer` iframe with `src="/static/category-theory.html"`.

### Explorations — Dance Instruction page (3 tests)
`web/src/app/explorations/dance-instruction/page.test.tsx`
Renders "Dance Instruction" heading. Renders description about teaching and learning dance. Renders `StaticHtmlViewer` iframe with `src="/static/dance-instruction.html"`.

### Explorations — Pocket Flow page (3 tests)
`web/src/app/explorations/pocket-flow/page.test.tsx`
Renders "Pocket Flow" heading. Renders description about the lightweight AI workflow framework. Renders `StaticHtmlViewer` iframe with `src="/static/pocket-flow.html"`.

### Explorations — Uber Level AI Skills page (3 tests)
`web/src/app/explorations/uber-level-ai-skills/page.test.tsx`
Renders "Uber Level AI Skills" heading. Renders description about advanced AI tool techniques. Renders `StaticHtmlViewer` iframe with `src="/static/uber-level-ai-skills.html"`.

### Explorations hub page (3 tests)
`web/src/app/explorations/page.test.tsx`
Renders "Explorations" heading. Renders links to all 5 exploration topics (Category Theory, Pocket Flow, Dance Instruction, Uber Level AI Skills, Tensor Logic) with correct hrefs. Renders topic descriptions.

### Home page (5 tests)
`web/src/app/page.test.tsx`
Renders "Sam Kirk" welcome heading. Renders "Hiring Manager" section. Renders all three AI tool cards (Fit Analysis, Custom Resume, Interview Me) with correct links to `/hire-me/fit`, `/hire-me/resume`, `/hire-me/interview`. Renders TOC sections (Dance Menu, Photo Fun, Song Dedication, Explorations) with links. Renders Villa Madu Bali section with external link.

### Header (6 tests)
`web/src/components/Header.test.tsx`
Renders "Sam Kirk" logo link with `href="/"`. Renders all main navigation links (Home, Hire Me, Dance Menu, Song Dedication, Photo Fun, Explorations) for both desktop and mobile. Renders mobile menu button with `aria-expanded` attribute. Toggles mobile menu on button click (aria-expanded false→true). Verifies correct href attributes for all nav links. Renders desktop navigation with responsive `md:flex` class.

### ReCaptcha (6 tests)
`web/src/components/ReCaptcha.test.tsx`
`ReCaptcha` component (4 tests): shows error when site key not configured, renders `recaptcha-container` element when key provided, shows loading placeholder with `animate-pulse`, applies custom className. `CaptchaGate` wrapper (2 tests): shows captcha initially while hiding children, renders custom title and description props.

### Song Dedication page (6 tests)
`web/src/app/song-dedication/page.test.tsx`
Renders "Resilience in the Storm" heading. Renders about section ("A song created for my mother"). Renders audio/listen section with audio element. Renders external listening links ("View ChatGPT thread"). Renders lyrics section with Verse 1, Chorus, Verse 2 labels. Renders song info footer with ChatGPT and Udio.com credits.

### StaticHtmlViewer (6 tests)
`web/src/components/StaticHtmlViewer.test.tsx`
Renders iframe with correct `/static/` prefixed src path. Applies `sandbox="allow-same-origin allow-scripts"` for security. Uses provided minHeight value. Uses default 400px minHeight when not specified. Renders "Loading content" indicator initially. Wraps iframe in styled container with `rounded-xl`, `border`, `overflow-hidden` classes.

### ToolGate (6 tests)
`web/src/components/ToolGate.test.tsx`
Shows "Initializing..." loading state during session init fetch. Shows error state when session init returns HTTP 500. Shows captcha verification screen when `captchaPassed=false` in session response. Skips captcha and renders protected children when `captchaPassed=true`. Uses default "Please verify you're human" title when no `toolName` prop. Shows connection error when fetch rejects (network failure).

### ToolPreview (7 tests)
`web/src/components/ToolPreview.test.tsx`
Renders title and description text. Renders CTA link with correct href and label. Renders icon element when provided via props. Omits icon container when no icon prop. Renders previewContent when provided. Omits preview section when no previewContent. Applies card styling classes (`rounded-xl`, `border`, `shadow-sm`).

---

## 2. GCP Smoke Tests (6 hire-me tests of 13 total)

Run with `cd web && npm run smoke:gcp`. All require GCP credentials. Individual sections: `npm run smoke:gcp -- --section=N`.

### TEST-670 — Cloud Storage (1 test)
`web/scripts/smoke-gcp.ts` (Section 1) | [catalog](test-catalog.md#test-670--smoke--cloud-storage)
Writes a test file to the private GCS bucket, reads it back, verifies content matches byte-for-byte, and deletes the test file. Validates basic GCS read/write connectivity.

### TEST-671 — Firestore (1 test)
`web/scripts/smoke-gcp.ts` (Section 2) | [catalog](test-catalog.md#test-671--smoke--firestore)
Writes a test document with string/number/timestamp fields to Firestore, reads it back, verifies all fields match, and deletes the test document. Validates basic Firestore CRUD connectivity.

### TEST-672 — Session (1 test)
`web/scripts/smoke-gcp.ts` (Section 3) | [catalog](test-catalog.md#test-672--smoke--session)
Creates a session document in Firestore with createdAt/expiresAt timestamps and IP hash, reads it back, verifies 24-hour TTL calculation is correct, and cleans up the test document.

### TEST-673 — Resume Upload (1 test)
`web/scripts/smoke-gcp.ts` (Section 4) | [catalog](test-catalog.md#test-673--smoke--resume-upload)
Uploads a test PDF file to GCS under the resume upload path, verifies it exists at the correct GCS path, checks `content-type: application/pdf` metadata, and deletes the test file.

### TEST-674 — Resume Chunking (1 test)
`web/scripts/smoke-gcp.ts` (Section 5) | [catalog](test-catalog.md#test-674--smoke--resume-chunking)
Reads seeded resume chunks from Firestore, verifies each chunk has required fields (chunkId, title, sourceRef, content), checks chunk count matches the resume index document, and validates version consistency across all chunks.

### TEST-675 — Dance Menu Upload (1 test)
`web/scripts/smoke-gcp.ts` (Section 6) | [catalog](test-catalog.md#test-675--smoke--dance-menu-upload)
Uploads a test image to the public GCS bucket under the dance-menu path, verifies it exists at the correct path, checks content-type metadata, and deletes the test file.

### TEST-676 — Submission & Artifact Bundle (1 test)
`web/scripts/smoke-gcp.ts` (Section 7) | [catalog](test-catalog.md#test-676--smoke--submission--artifact-bundle)
Creates a submission document in Firestore, uploads multiple artifact files to GCS under the submission prefix, verifies bundle completeness by listing and checking all expected files, and cleans up both Firestore doc and GCS files.

### TEST-677 — Spend Cap (1 test)
`web/scripts/smoke-gcp.ts` (Section 8) | [catalog](test-catalog.md#test-677--smoke--spend-cap)
Creates a monthly spend tracking document in Firestore, increments input/output token counts, reads back and verifies budget-remaining calculation matches expected value, and cleans up the test document.

### TEST-678 — Job Ingestion URL Fetch (1 test)
`web/scripts/smoke-gcp.ts` (Section 9) | [catalog](test-catalog.md#test-678--smoke--job-ingestion-url-fetch)
Fetches a real public web page via HTTP, extracts text content using the HTML-to-text pipeline, verifies character and word counts fall within expected ranges, and validates the ingestion result structure (text, wordCount, source fields).

### TEST-679 — Vertex AI Gemini (1 test)
`web/scripts/smoke-gcp.ts` (Section 10) | [catalog](test-catalog.md#test-679--smoke--vertex-ai-gemini)
Sends a fit analysis prompt to Vertex AI Gemini, receives a JSON response, validates structure (overallScore 1-10, recommendation string, categories array with scores/rationale/citations), and logs token usage and estimated cost.

### TEST-680 — Resume Generation (1 test)
`web/scripts/smoke-gcp.ts` (Section 11) | [catalog](test-catalog.md#test-680--smoke--resume-generation)
Sends a resume generation prompt with job posting and resume context to Vertex AI, validates JSON response structure (header, summary, skills array, experience with bullets, education), checks total word count is within the 600-900 word 2-page limit, and logs token usage.

### TEST-681 — Interview Chat (1 test)
`web/scripts/smoke-gcp.ts` (Section 12) | [catalog](test-catalog.md#test-681--smoke--interview-chat)
Sends a multi-turn interview conversation (2 questions) to Vertex AI, validates each response is career-relevant and within token limits, verifies guardrails redirect off-topic questions, and logs token usage across turns.

### TEST-682 — Retention Cleanup (1 test)
`web/scripts/smoke-gcp.ts` (Section 13) | [catalog](test-catalog.md#test-682--smoke--retention-cleanup)
Creates expired test submissions in Firestore with GCS artifacts, runs the retention cleanup function, verifies expired data is deleted while non-expired data is preserved, and validates the cleanup summary (counts, durations, errors).

---

## 3. E2E Tests — Playwright (22 hire-me tests of 47 total)

Run with `cd web && npx playwright test`. Requires the dev server running on port 3000. Entries ordered by test count ascending.

### TEST-611 — Fit tool — Error handling (1 test)
`web/e2e/fit-tool.spec.ts` | [catalog](test-catalog.md#test-611--fit-tool--error-handling)
Submits minimal invalid input ("x") via the fit tool form, clicks analyze, and waits for either an error message or a processing state to render — verifying the UI handles bad input without crashing.

### TEST-621 — Resume tool — Error handling (1 test)
`web/e2e/resume-tool.spec.ts` | [catalog](test-catalog.md#test-621--resume-tool--error-handling)
Submits minimal invalid input ("x") via the resume tool form, clicks generate, and waits for either an error message, generating state, or ready state to render — verifying the UI handles bad input gracefully.

### TEST-632 — Interview tool — Conversation (1 test)
`web/e2e/interview-tool.spec.ts` | [catalog](test-catalog.md#test-632--interview-tool--conversation)
Sends "What programming languages do you know?" in the interview chat, waits for AI response, verifies 2-message chat history is visible (user + assistant), clicks the download transcript button, and saves the response fixture to `test-fixtures/` for regression testing.

### TEST-604 — Full app — API health (2 tests)
`web/e2e/full-app.spec.ts` | [catalog](test-catalog.md#test-604--full-app--api-health)
POST to `/api/session/init` and validates response payload contains `sessionId`, `expiresAt`, and `isNew` fields. GET to `/api/maintenance/retention` and verifies response status is not 500.

### TEST-605 — Full app — Error handling (2 tests)
`web/e2e/full-app.spec.ts` | [catalog](test-catalog.md#test-605--full-app--error-handling)
Navigates to `/this-page-does-not-exist-12345` and asserts 404 status. Sends GET to `/api/this-does-not-exist` and asserts 404 response.

### TEST-606 — Full app — Accessibility (3 tests)
`web/e2e/full-app.spec.ts` | [catalog](test-catalog.md#test-606--full-app--accessibility)
Verifies home page has exactly one `<h1>` element. Verifies `/hire-me/fit` tool page has exactly one `<h1>`. Checks pages have a `<main>` landmark element for screen readers.

### TEST-601 — Full app — Exploration pages (4 tests)
`web/e2e/full-app.spec.ts` | [catalog](test-catalog.md#test-601--full-app--exploration-pages)
Navigates to each exploration sub-page (category-theory, pocket-flow, dance-instruction, uber-level-ai-skills) and verifies each loads with a visible `<h1>` heading.

### TEST-602 — Full app — Admin auth required (4 tests)
`web/e2e/full-app.spec.ts` | [catalog](test-catalog.md#test-602--full-app--admin-auth-required)
Navigates to `/admin`, `/admin/resume`, `/admin/dance-menu`, and `/admin/submissions` while unauthenticated. Verifies each redirects to login or shows an access-denied message.

### TEST-610 — Fit tool — Happy path (4 tests)
`web/e2e/fit-tool.spec.ts` | [catalog](test-catalog.md#test-610--fit-tool--happy-path)
Complete end-to-end fit analysis: pastes a sample job posting, clicks analyze, handles follow-up questions if any, waits for LLM analysis, and verifies results page shows fit score, recommendation, and category breakdown. Verifies all three input modes (paste/URL/upload) are available after completion. Clicks "enter url" and verifies URL input field appears. Validates analyze button is disabled when input is empty, enabled when text is entered, and disabled again when cleared.

### TEST-600 — Full app — Public pages (5 tests)
`web/e2e/full-app.spec.ts` | [catalog](test-catalog.md#test-600--full-app--public-pages)
Navigates to 5 public pages and verifies each renders correctly: home page (h1 heading, navigation links, "hire me" link), tools hub `/hire-me` (heading, links to fit/resume/interview), dance menu (h1 and body content), song dedication (h1), and explorations hub (h1 and "category theory" link).

### TEST-603 — Full app — Navigation (5 tests)
`web/e2e/full-app.spec.ts` | [catalog](test-catalog.md#test-603--full-app--navigation)
Clicks navigation links and verifies URL changes: home → tools hub (`/hire-me`), tools hub → fit tool (`/hire-me/fit`), tools hub → resume tool (`/hire-me/resume`), tools hub → interview tool (`/hire-me/interview`), and home → explorations (`/explorations`).

### TEST-620 — Resume tool — Happy path (5 tests)
`web/e2e/resume-tool.spec.ts` | [catalog](test-catalog.md#test-620--resume-tool--happy-path)
Complete end-to-end resume generation: pastes a sample job posting, clicks "generate custom resume", waits for generating state, and verifies results show professional summary, experience entries, skill categories, factual accuracy note, and download/generate-another buttons. Verifies all three input modes available after completion. Clicks "enter url" and verifies URL input field. Validates generate button disabled/enabled with empty/filled input. Checks "100% factual", "2-page format", "multiple formats" feature cards are visible.

### TEST-630 — Interview tool — UI (5 tests)
`web/e2e/interview-tool.spec.ts` | [catalog](test-catalog.md#test-630--interview-tool--ui)
Verifies "Interview Me NOW" heading and description text. Waits for captcha pass and verifies welcome message with topic list (work history, technical skills, etc.). Checks chat input field, send button, and "press Enter to send" hint are visible. Verifies "real-time chat", "career-focused", "download transcript" feature cards. Checks new conversation button exists.

### TEST-631 — Interview tool — Input behavior (5 tests)
`web/e2e/interview-tool.spec.ts` | [catalog](test-catalog.md#test-631--interview-tool--input-behavior)
Types a question and clicks send — verifies user message appears in chat. Types a message and presses Enter — verifies it sends. Sends a message and verifies input becomes disabled with "waiting for response" placeholder while AI responds. Sends a message and checks for typing indicator during wait. Clicks "new conversation" after sending a message and verifies the chat resets (message disappears, welcome message returns).

---

## 4. E2E Real LLM Tests (3 hire-me tests of 3 total)

Run with `cd web && npm run test:e2e:real`. Requires GCP credentials and seeded resume data (`npm run seed:resume`).

### TEST-650 — Real LLM — Fit tool (1 test)
`web/scripts/e2e-real-llm.ts` | [catalog](test-catalog.md#test-650--real-llm--fit-tool)
End-to-end with real Vertex AI: creates test session and submission in Firestore, extracts job fields (seniority, location, skills) from a sample posting, builds fit analysis prompt with seeded resume context chunks, calls Vertex AI Gemini, validates JSON response structure (overallScore 1-10, recommendation, categories array with scores/rationale/citations, unknowns), stores fit report artifacts (report.md, report.json) to GCS, and updates submission status to completed.

### TEST-651 — Real LLM — Resume tool (1 test)
`web/scripts/e2e-real-llm.ts` | [catalog](test-catalog.md#test-651--real-llm--resume-tool)
End-to-end with real Vertex AI: creates test session and submission, builds resume generation prompt with job posting and seeded resume context (factual-only, 600-900 word target, 2-page format), calls Vertex AI, validates JSON response structure (header with name/title/contact, summary, skills array, experience with company/role/bullets, education), generates markdown resume, stores resume.md and resume.json artifacts to GCS, and verifies total word count is within limits.

### TEST-652 — Real LLM — Interview tool (1 test)
`web/scripts/e2e-real-llm.ts` | [catalog](test-catalog.md#test-652--real-llm--interview-tool)
End-to-end with real Vertex AI: creates test session, submission, and conversation ID, builds interview system prompt with seeded resume context, simulates 2-turn conversation ("What programming languages do you know?" and "Tell me about your most recent role"), calls Vertex AI for each turn building conversation history, validates response structure and career relevance, generates markdown transcript with timestamps and role labels, stores transcript.md and conversation.json to GCS, and saves transcript fixture to `test-fixtures/interview-chat/` for regression testing.
