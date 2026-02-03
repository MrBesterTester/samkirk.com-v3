# samkirk.com v3 — Test Results

> Last updated: 2026-02-03
>
> This document records smoke test results with real GCP infrastructure and unit test summaries.
>
> **Note:** This document is updated as each step in [`docs/TODO.md`](TODO.md) is completed. Test results are recorded after implementation to provide an audit trail of verified functionality.

---

## Table of Contents

- [Summary](#summary)
- [GCP Smoke Tests](#gcp-smoke-tests)
  - [Verification Methodology](#verification-methodology)
  - [Section 1: Cloud Storage Test](#section-1-cloud-storage-test)
  - [Section 2: Firestore Test](#section-2-firestore-test)
  - [Section 3: Session Test](#section-3-session-test)
  - [Section 4: Resume Upload Test](#section-4-resume-upload-test)
  - [Section 5: Resume Chunking Test](#section-5-resume-chunking-test)
  - [Section 6: Dance Menu Upload Test](#section-6-dance-menu-upload-test)
  - [Section 7: Submission & Artifact Bundle Test](#section-7-submission--artifact-bundle-test)
  - [Section 8: Spend Cap Test](#section-8-spend-cap-test)
  - [Section 9: Job Ingestion URL Fetch Test](#section-9-job-ingestion-url-fetch-test)
  - [Section 10: Vertex AI Gemini Test](#section-10-vertex-ai-gemini-test)
- [Unit Tests](#unit-tests)
  - [Results](#results)
  - [Test File Breakdown](#test-file-breakdown)
  - [Fit Flow State Machine (Step 6.2)](#fit-flow-state-machine-step-62)
  - [Vertex AI LLM Wrapper (Step 6.3)](#vertex-ai-llm-wrapper-step-63)
  - [Fit Report Generator (Step 6.3)](#fit-report-generator-step-63)
  - [Resume Context Retrieval (Step 7.1)](#resume-context-retrieval-step-71)
- [E2E Tests (Playwright)](#e2e-tests-playwright)
  - [Fit Tool Happy Path (Step 6.4)](#fit-tool-happy-path-step-64)
- [Resume Seeding Workflow](#resume-seeding-workflow)
- [Real-LLM E2E Test (Step 6.4)](#real-llm-e2e-test-step-64)
- [Lint Check](#lint-check)
- [Notes](#notes)
  - [What These Tests Do NOT Cover](#what-these-tests-do-not-cover)
  - [Independent Verification](#independent-verification)
- [Revision History](#revision-history)

---

## Summary

| Category | Result | Details |
|----------|--------|---------|
| GCP Smoke Tests | **PASS** | 10/10 sections passed |
| Unit Tests | **PASS** | 757/757 tests passed |
| E2E Tests (Playwright) | **PASS** | 5/5 Playwright tests passed |
| E2E Tests (Real LLM) | **PASS** | Full flow with gemini-2.0-flash |
| Lint | **PASS** | 0 errors, 0 warnings |

---

## GCP Smoke Tests

**Command:** `cd web && npm run smoke:gcp`

**Script:** `web/scripts/smoke-gcp.ts`

**GCP Project:** `samkirk-v3`

### Verification Methodology

The smoke test script performs **self-verifying integration tests**:
1. Writes test data to real GCP resources (Firestore, Cloud Storage)
2. Reads data back and asserts content matches
3. Cleans up test artifacts after each section
4. Exits with code 0 only if all assertions pass

This is **not** independent verification via `gcloud` CLI—the script verifies its own operations. Test data uses prefixes like `_smoke_test/` and far-future dates (`2099-12`) to avoid conflicts with production data.

### Section 1: Cloud Storage Test

**Purpose:** Verify private bucket read/write access

```
→ Writing to _smoke_test/test-file.txt...
✓ Write successful
→ Reading from _smoke_test/test-file.txt...
✓ Read successful, content matches
→ Cleaning up _smoke_test/test-file.txt...
✓ Cleanup successful
```

**Verification:** Content round-trip assertion (write → read → compare)

---

### Section 2: Firestore Test

**Purpose:** Verify Firestore read/write access

```
→ Writing to _smoke_test/test-doc...
✓ Write successful
→ Reading from _smoke_test/test-doc...
✓ Read successful, data matches
→ Cleaning up _smoke_test/test-doc...
✓ Cleanup successful
```

**Verification:** Document data round-trip assertion

---

### Section 3: Session Test

**Purpose:** Verify session document creation with TTL (Step 2.2)

```
→ Creating session _smoke_session_ArvnaQbAQXP4QUe...
✓ Session write successful
→ Reading session back...
✓ Session TTL verified
✓ Session expiry check passed
→ Cleaning up test session...
✓ Session cleanup successful
```

**Verification:**
- Session doc created in `sessions` collection
- `createdAt` and `expiresAt` timestamps present
- TTL calculation verified (7 days = 604,800,000 ms)
- Session not expired immediately after creation

---

### Section 4: Resume Upload Test

**Purpose:** Verify resume upload to GCS + metadata to Firestore (Step 3.2)

```
→ Checking for existing resume...
✓ No existing resume found
→ Writing test resume to resume/master.md...
✓ Resume write to GCS successful
→ Reading resume from resume/master.md...
✓ Resume content verified
→ Writing resume index to resumeIndex/current...
✓ Resume index write successful
→ Reading resume index back...
✓ Resume index data verified
→ Restoring original state...
✓ Test resume deleted
✓ Test resume index deleted
```

**Verification:**
- GCS write to `resume/master.md` in private bucket
- Firestore metadata at `resumeIndex/current`
- Content integrity verified via read-back
- Original state restored (preserves any existing resume)

---

### Section 5: Resume Chunking Test

**Purpose:** Verify markdown chunking for RAG (Step 3.3)

```
→ Checking for existing chunks...
✓ No existing chunks found
→ Writing chunking test resume to resume/master.md...
✓ Resume written to GCS
→ Running chunker on test resume...
✓ Generated 6 chunks
→ Writing chunks to Firestore...
✓ Wrote 6 chunks to Firestore
→ Updating resume index with chunk count...
✓ Resume index updated
→ Verifying chunks in Firestore...
✓ Verified 6 chunks exist with correct version
✓ Resume index chunk count verified
→ Cleaning up test chunks...
✓ Deleted 6 test chunks
→ Restoring original state...
✓ Test resume deleted from GCS
✓ Test resume index deleted
```

**Verification:**
- Chunker produces expected number of chunks (6 from test resume)
- Chunks written to `resumeChunks` collection with version tag
- `resumeIndex/current` updated with `chunkCount`
- Version-based query correctly retrieves test chunks

---

### Section 6: Dance Menu Upload Test

**Purpose:** Verify dance menu bundle upload to public bucket (Step 3.4)

```
→ Checking for existing dance menu...
✓ No existing dance menu found
→ Writing test dance menu files to _smoke_test_dance_menu/...
✓ Dance menu files written successfully
→ Verifying dance menu files...
✓ All dance menu files verified
→ Verifying file listing...
✓ File listing verified
→ Cleaning up test dance menu files...
✓ Test dance menu files deleted
```

**Verification:**
- Three files written: `menu.md`, `menu.txt`, `menu.html`
- Each file content verified via read-back
- File listing returns expected 3 files
- Note: Public HTTP access is blocked by org policy; SDK access works

---

### Section 7: Submission & Artifact Bundle Test

**Purpose:** Verify submission CRUD + artifact storage (Steps 4.1, 4.2)

```
→ Creating test submission _smoke_submission_jZFBsZQNKopL...
✓ Submission created in Firestore
→ Writing test artifacts to GCS...
✓ Test artifacts written to GCS
→ Verifying submission in Firestore...
✓ Submission data verified
→ Verifying artifacts in GCS...
✓ Artifacts verified in GCS
✓ Submission TTL (90 days) verified
→ Testing submission update...
✓ Submission update verified
→ Cleaning up test submission and artifacts...
✓ Deleted 2 artifact files from GCS
✓ Test submission deleted from Firestore
```

**Verification:**
- Submission doc created in `submissions` collection
- `tool`, `status`, `inputs`, `extracted`, `outputs`, `citations` fields present
- 90-day TTL calculation verified (`expiresAt - createdAt = 7,776,000,000 ms`)
- Artifact files written to `submissions/{id}/output/` prefix
- Submission update operation works (added `bundleGenerated` field)

---

### Section 8: Spend Cap Test

**Purpose:** Verify monthly spend tracking + cap detection (Step 5.3)

```
→ Creating spend tracking doc for 2099-12...
✓ Spend doc created
→ Reading spend doc back...
✓ Spend doc data verified
→ Testing spend increment (simulating LLM call)...
✓ Recorded spend of $0.0050
✓ Spend increment verified
→ Testing multiple increments...
✓ Multiple increments verified (total: $0.0080)
→ Testing cap detection...
✓ Cap detection verified ($20.01 >= $20)
→ Cleaning up test spend doc...
✓ Test spend doc deleted
```

**Verification:**
- Spend doc created at `spendMonthly/2099-12`
- Initial values: `usdBudget: 20`, `usdUsedEstimated: 0`
- Atomic increment via Firestore transaction works
- Multiple increments accumulate correctly ($0.005 + $0.001×3 = $0.008)
- Cap detection triggers when `usdUsedEstimated >= usdBudget`

---

### Section 9: Job Ingestion URL Fetch Test

**Purpose:** Verify server-side URL fetch extracts job text from public URLs (Step 6.1)

**Command:** `npm run smoke:gcp -- --section=9` (or `--section=url-fetch`)

```
→ Testing: Simple HTML page (httpbin.org)...
→   URL: https://httpbin.org/html
✓   Characters: 3595
→   Words: 605
→   Preview: "Herman Melville - Moby-Dick  Availing himself of the mild..."
✓ URL fetch successful
→ Testing: Example.com landing page...
→   URL: https://example.com
✓   Characters: 144
→   Words: 21
→   Preview: "Example Domain  This domain is for use in documentation..."
✓ URL fetch successful
✓ All URL fetch tests passed
```

**Verification:**
- Fetches real URLs over HTTPS with 15-second timeout
- Extracts text from HTML (removes scripts, styles, tags)
- Word count meets minimum threshold for each test URL
- Mirrors the logic in `src/lib/job-ingestion.ts`

**Test URLs:**

| URL | Expected | Result |
|-----|----------|--------|
| `httpbin.org/html` | ≥10 words | ✓ 605 words |
| `example.com` | ≥5 words | ✓ 21 words |

**Notes:**
- This test uses stable public URLs that won't change
- Real job posting URLs (LinkedIn, Greenhouse) are not tested here because they may require auth or block bots
- The `shouldPromptPaste` fallback logic is covered by unit tests

---

### Section 10: Vertex AI Gemini Test

**Purpose:** Verify Vertex AI Gemini content generation and spend tracking integration ([Step 6.3](TODO.md#63-llm-prompt--structured-report-generation--citations))

**Command:** `npm run smoke:gcp -- --section=10` (or `--section=vertex`)

```
→ Initializing Vertex AI client...
✓ Project: samkirk-v3, Location: us-central1
→ Getting model: gemini-1.5-flash-002...
✓ Model loaded
→ Testing simple content generation...
✓ Response: "Hello from Vertex AI smoke test!..."
→ Input tokens: 15
→ Output tokens: 8
→ Testing structured JSON generation...
✓ Parsed JSON: score=Well, confidence=0.9
→ Testing spend recording...
✓ Spend recorded: $0.000047
→ Spend doc cleaned up
✓ All Vertex AI tests passed
```

**Verification:**

1. **Client Initialization:**
   - Vertex AI SDK connects to correct project and location
   - Model loads successfully from configured `VERTEX_AI_MODEL`

2. **Simple Content Generation:**
   - Generates text response from user prompt
   - Returns valid candidates with text content
   - Usage metadata includes token counts

3. **Structured JSON Generation:**
   - Model produces valid JSON output (like fit report format)
   - Handles optional markdown code fences in response
   - Parsed JSON contains expected fields (`score`, `rationale`, `confidence`)

4. **Spend Tracking Integration:**
   - Creates spend doc at `spendMonthly/2099-11` (test month)
   - Atomic increment via Firestore transaction works
   - Cost estimation based on token counts

**Related Unit Tests:** [Vertex AI LLM Wrapper](#vertex-ai-llm-wrapper-step-63), [Fit Report Generator](#fit-report-generator-step-63)

---

## Unit Tests

**Command:** `cd web && npm test -- --run`

**Framework:** Vitest + React Testing Library

### Results

```
Test Files  32 passed (32)
     Tests  757 passed (757)
  Duration  9.13s
```

**Note:** Tests require network access to pass completely. The `route.test.ts` integration tests (3 tests) connect to real GCP services and will skip if run in a sandboxed environment without network access.

### Test File Breakdown

| File | Tests | Coverage Area |
|------|-------|---------------|
| `fit-flow.test.ts` | 96 | Fit flow state machine ([Step 6.2](#fit-flow-state-machine-step-62)) |
| `job-ingestion.test.ts` | 74 | Job text ingestion from paste/URL/file (Step 6.1) |
| `spend-cap.test.ts` | 60 | Spend cap enforcement (Step 5.3) |
| `markdown-renderer.test.ts` | 56 | Markdown to HTML rendering (Step 4.2) |
| `rate-limit.test.ts` | 50 | Rate limiting utility (Step 5.2) |
| `submission.test.ts` | 50 | Submission CRUD helpers (Step 4.1) |
| `resume-chunker.test.ts` | 49 | Resume chunking for RAG (Step 3.3) |
| `fit-report.test.ts` | 36 | Fit report generation ([Step 6.3](#fit-report-generator-step-63)) |
| `session.test.ts` | 34 | Session management (Step 2.2) |
| `artifact-bundler.test.ts` | 30 | Zip bundle generation (Step 4.2) |
| `dance-menu-upload.test.ts` | 29 | Dance menu validation (Step 3.4) |
| `resume-upload.test.ts` | 22 | Resume upload validation (Step 3.2) |
| `vertex-ai.test.ts` | 19 | LLM wrapper ([Step 6.3](#vertex-ai-llm-wrapper-step-63)) |
| `captcha.test.ts` | 14 | reCAPTCHA verification (Step 5.1) |
| `auth.test.ts` | 11 | Admin authentication (Step 3.1) |
| `firestore.test.ts` | 10 | Firestore path helpers |
| `storage.test.ts` | 10 | GCS path helpers |
| `env.test.ts` | 3 | Environment validation |
| Component tests | 44 | UI components (Header, Footer, etc.) |
| Page tests | 29 | Page rendering |
| `route.test.ts` | 3 | Public proxy API integration (Step 3.4) — requires network |

### Fit Flow State Machine (Step 6.2)

**File:** `src/lib/fit-flow.test.ts`

**Purpose:** Verify the multi-turn Fit flow state machine for the "How Do I Fit?" tool

**Test Categories (96 tests):**

| Category | Tests | Description |
|----------|-------|-------------|
| Constants validation | 4 | MAX_FOLLOW_UPS=5, HOME_LOCATION, MAX_COMMUTE_MINUTES=30, MAX_ONSITE_DAYS=2 |
| Initial state creation | 9 | `createInitialExtractedFields()`, `createInitialFitFlowState()` |
| Seniority extraction | 11 | C-level, VP, director, principal, staff, senior, mid, entry, unknown patterns |
| Location type extraction | 7 | Fully remote, hybrid, onsite, unknown detection from job text |
| Location fit evaluation | 14 | Rules: fully remote=acceptable, hybrid≤2 days+≤30min=acceptable, else unacceptable |
| Worst-case handling | 3 | `applyWorstCaseLocation()` sets status + marks confirmed |
| Follow-up generation | 8 | Priority: location → onsite freq → commute → seniority → skills |
| nextQuestion state machine | 6 | Error states, ready state, question generation, max follow-ups |
| Follow-up counting (0..5) | 5 | Tracks count correctly, stops at 5, allows 0-4 questions |
| Answer processing | 5 | Validates pending question, rejects mismatches, updates history |
| Answer application | 11 | Location, onsite frequency, commute, seniority, skills parsing |
| Commute estimation | 8 | Bay Area cities: Fremont=10min, SF=55min, unknown=null |
| Flow initialization | 2 | `initializeFitFlow()` with job input |
| Flow finalization | 2 | `finalizeForReport()` applies worst-case for unknowns |
| Helper functions | 5 | `isReadyForReport()`, `getUnknownFields()` |
| Integration scenarios | 5 | Full flows: remote job, hybrid with follow-ups, worst-case application |
| Text extraction | 4 | `extractJobTitle()`, `extractCompanyName()`, `extractMustHaveSkills()` |

**Key Behaviors Verified:**

1. **Location Rules (per spec):**
   - Fully remote → acceptable
   - Hybrid ≤2 days/week AND ≤30 min commute from Fremont, CA → acceptable
   - Higher onsite frequency or longer commute → unacceptable
   - Unknown + user can't clarify → worst_case (treated as poor fit)

2. **Follow-up Limit:**
   - Maximum 5 follow-up questions enforced
   - After 5 questions, flow proceeds to report generation

3. **Question Priority:**
   1. Location type (required)
   2. Onsite frequency for hybrid (required)
   3. Commute estimate for hybrid/onsite (required)
   4. Seniority level (optional)
   5. Must-have skills (optional)

**Back to:** [TODO.md Step 6.2](TODO.md#62-fit-flow-state-machine-up-to-5-follow-ups)

---

### Vertex AI LLM Wrapper (Step 6.3)

**File:** `src/lib/vertex-ai.test.ts`

**Purpose:** Verify the Vertex AI Gemini wrapper module error handling and type guards

**Test Categories (19 tests):**

| Category | Tests | Description |
|----------|-------|-------------|
| ContentBlockedError | 4 | Error properties, safety ratings storage, JSON serialization |
| GenerationError | 3 | Error properties, cause error storage, JSON serialization |
| Error type guards | 9 | `isSpendCapError()`, `isContentBlockedError()`, `isGenerationError()` |
| Error inheritance | 3 | instanceof checks, stack traces |

**Key Behaviors Verified:**

1. **Error Classes:**
   - `ContentBlockedError` for safety filter blocks (status 400)
   - `GenerationError` for generation failures (status 500)
   - Both serialize to JSON for API responses

2. **Type Guards:**
   - Correctly identify error types from `code` property
   - Return false for non-matching errors and non-errors

**Related Smoke Test:** [Section 10: Vertex AI Gemini Test](#section-10-vertex-ai-gemini-test)

**Back to:** [TODO.md Step 6.3](TODO.md#63-llm-prompt--structured-report-generation--citations)

---

### Fit Report Generator (Step 6.3)

**File:** `src/lib/fit-report.test.ts`

**Purpose:** Verify the Fit report prompt builder, response parser, and markdown generator

**Test Fixtures (Reference Only):** [`web/test-fixtures/fit-report/`](../web/test-fixtures/fit-report/)

> ⚠️ **Note:** These fixtures are **documentation reference only** and may become stale. The unit tests use inline mock data (via helper functions like `createMockExtractedFields()`) rather than reading from these files. The E2E tests use a built-in mock generator (`generateMockFitReport()`). These fixtures are not automatically generated or updated by any tests.

| File | Description |
|------|-------------|
| [job-description.txt](../web/test-fixtures/fit-report/job-description.txt) | Sample job posting input (Senior Software Engineer at Test Corp) |
| [extracted-fields.json](../web/test-fixtures/fit-report/extracted-fields.json) | Structured data extracted from job posting |
| [resume-chunks.json](../web/test-fixtures/fit-report/resume-chunks.json) | Resume chunks used as LLM context (5 sections) |
| [llm-response.json](../web/test-fixtures/fit-report/llm-response.json) | Expected LLM analysis output (JSON) |
| [generated-report.md](../web/test-fixtures/fit-report/generated-report.md) | Final markdown report output |

**Test Categories (36 tests):**

| Category | Tests | Description |
|----------|-------|-------------|
| System prompt validation | 3 | Location rules, JSON format, score values present |
| `formatExtractedFields()` | 5 | All fields, skip nulls, empty arrays, commute info |
| `buildFitAnalysisPrompt()` | 5 | Job text, extracted info, resume chunks, instructions |
| `parseFitAnalysisResponse()` | 9 | Valid JSON, code fences, score validation, missing fields |
| `generateMarkdownReport()` | 9 | Header, job info, scores with emojis, categories, unknowns |
| `generateCitations()` | 3 | Chunk to citation conversion, metadata preservation |
| `FitReportError` | 2 | Error properties, JSON serialization |

**Key Behaviors Verified:**

1. **Prompt Building:**
   - Includes job text in `## Job Posting` section
   - Formats extracted fields (title, company, seniority, location, skills)
   - Labels resume chunks as `[CHUNK N: Title]` for citation tracking
   - Includes location rules reminder in instructions

2. **Response Parsing:**
   - Handles raw JSON and markdown-wrapped JSON (`\`\`\`json ... \`\`\``)
   - Validates `overallScore` is one of: Well, Average, Poorly
   - Validates each category has `name`, `score`, `rationale`
   - Handles missing `unknowns` array (defaults to empty)
   - Handles missing `recommendation` (provides default)

3. **Report Generation:**
   - Score emojis: ✅ Well, ⚠️ Average, ❌ Poorly
   - Sections: Job info, Overall Fit, Recommendation, Category Breakdown, Unknowns, Extracted Details
   - Unknowns section omitted when empty

4. **Citations:**
   - Converts resume chunks to citation format: `{chunkId, title, sourceRef}`
   - Preserves all chunk metadata

**Example Output:** See [generated-report.md](../web/test-fixtures/fit-report/generated-report.md) for the complete output.

**Data Flow:**

```
job-description.txt ──┐
                      ├──► buildFitAnalysisPrompt() ──► LLM (Gemini)
resume-chunks.json ───┘                                     │
                                                            ▼
                                                    llm-response.json
                                                            │
                                                            ▼
extracted-fields.json ──► generateMarkdownReport() ──► generated-report.md
```

**Related Smoke Test:** [Section 10: Vertex AI Gemini Test](#section-10-vertex-ai-gemini-test)

**Back to:** [TODO.md Step 6.3](TODO.md#63-llm-prompt--structured-report-generation--citations)

---

### Resume Context Retrieval (Step 7.1)

**File:** `src/lib/resume-context.test.ts`

**Purpose:** Verify resume context assembly and citation generation for RAG V0 (used by Custom Resume and Interview tools)

**Test Categories (50 tests):**

| Category | Tests | Description |
|----------|-------|-------------|
| `formatChunkForContext()` | 8 | Detailed/compact/minimal formats, chunk IDs, 1-indexed numbering |
| `assembleContextFromChunks()` | 11 | Empty input, assembly, separators, maxChunks, format options, character count |
| `getResumeContext()` | 3 | Firestore loading, options passthrough, empty result |
| `generateCitationsFromChunks()` | 4 | All chunks, empty input, field preservation, no content in citations |
| `generateCitationsForReferencedChunks()` | 5 | Filtered IDs, no matches, empty list, duplicates, order preservation |
| `createCitationMap()` | 4 | Map creation, lookup, non-existent ID, empty input |
| `getContextSummary()` | 4 | Summary format, chunk titles, empty handling, locale formatting |
| `isResumeContextAvailable()` | 2 | True when chunks exist, false when empty |
| `getResumeContextSize()` | 2 | Character count across chunks, zero for empty |
| Integration tests | 3 | Context → citations workflow, maxChunks effects, citation map lookup |
| Edge cases | 4 | Empty content, special characters, long titles, unicode |

**Key Behaviors Verified:**

1. **Context Assembly Formats:**
   - **Detailed (default):** `[CHUNK N: Title]\nSource: ref\n\ncontent` with `---` separator
   - **Compact:** `### Title\n\ncontent` with `---` separator
   - **Minimal:** Content only with `\n\n` separator

2. **Citation Generation:**
   - Converts chunks to `{chunkId, title, sourceRef}` (no content)
   - Supports filtered citations by chunk ID
   - Creates lookup map for quick access

3. **Edge Cases:**
   - `maxChunks: 0` returns empty result (explicit undefined check)
   - Unicode content preserved (emojis, CJK, Arabic)
   - Special characters not escaped in context

**Example Usage:**

```typescript
// Load and assemble context for LLM
const context = await getResumeContext({ format: "detailed" });
console.log(`${context.chunkCount} chunks, ${context.characterCount} chars`);

// Generate citations for report
const citations = generateCitationsFromChunks(context.usedChunks);
```

**Back to:** [TODO.md Step 7.1](TODO.md#71-job-ingestion-reuse--resume-context-retrieval-rag-v0)

---

## E2E Tests (Playwright)

End-to-end tests using Playwright with a real browser (Chromium).

### Fit Tool Happy Path (Step 6.4)

**Run command:**
```bash
cd web && npx playwright test --headed
```

**Results:** 5/5 tests passed

| Test | Status | Duration |
|------|--------|----------|
| should complete full flow: input → follow-ups → results | **PASS** | ~8s |
| should allow starting over after completion | **PASS** | ~2s |
| should show URL input mode when selected | **PASS** | ~2s |
| should validate empty input | **PASS** | ~2s |
| should handle error states gracefully | **PASS** | ~3s |

**E2E Test Mode Features:**
- **Captcha bypass:** `E2E_TESTING=true` and `NEXT_PUBLIC_E2E_TESTING=true` enable automatic captcha verification with a test token
- **Mock fit report:** When no resume chunks are available in E2E mode, returns a mock report so tests can complete the full flow

**Test coverage:**
1. **Full flow test:** Paste job text → Analyze → (optional follow-ups) → Generate report → View results with download button
2. **Starting over:** Verifies form reloads correctly after completion
3. **URL mode:** Tests switching between paste/URL/file input modes
4. **Validation:** Tests disabled button when input is empty
5. **Error handling:** Tests graceful error state display

**Back to:** [TODO.md Step 6.4](TODO.md#64-ui-wiring-for-fit-tool-multi-turn-ux--downloads)

---

## Resume Seeding Workflow

The resume seeding workflow allows you to upload and index a baseline resume for testing and development.

### Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `validate:resume` | `npm run validate:resume -- path/to/resume.md` | Local validation of resume chunking (no GCP needed) |
| `seed:resume` | `npm run seed:resume` | Upload baseline resume to GCS and index in Firestore |
| `test:e2e:real` | `npm run test:e2e:real` | Full E2E test with real Vertex AI |

### Validation Script

Validates resume chunking locally without GCP credentials:

```bash
cd web
npm run validate:resume -- data/baseline-resume.md
```

**Output:**
```
=== Resume Validation ===

File: baseline-resume.md
Path: /path/to/web/data/baseline-resume.md

→ Reading file...
✓ Read 3245 characters, 113 lines
→ Analyzing structure...
✓ Found 12 headings

--- Heading Structure ---

# Sam Kirk
## Summary
## Experience
### Senior Software Engineer at Tech Company (2020-Present)
### Software Engineer at Startup Inc (2017-2020)
...

--- Chunking Results ---

→ Running chunker...
✓ Generated 10 chunks

--- Chunk Summary ---

  Total chunks: 10
  Total chars:  2847
  Min size:     128 chars
  Max size:     487 chars
  Avg size:     284 chars

--- Result ---

✓ Validation passed!

Your resume chunks correctly and is ready for seeding.
```

### Seed Script

Uploads the baseline resume and indexes it for RAG:

```bash
cd web
npm run seed:resume
```

**Output:**
```
=== Seed Resume Script ===

→ Checking environment variables...
✓ Environment validated
→   Project: samkirk-v3
→   Bucket: samkirk-v3-private
→ Reading baseline resume from /path/to/web/data/baseline-resume.md...
✓ Read 3245 characters, 113 lines
→ Uploading to gs://samkirk-v3-private/resume/master.md...
✓ Upload complete
→ Chunking resume content...
→ Version: 0 -> 1
✓ Generated 10 chunks
  • Sam Kirk > Summary (234 chars)
  • Sam Kirk > Experience > Senior Software Engineer... (487 chars)
  ...
→ Deleting old chunks...
✓ No previous version
→ Writing new chunks to Firestore...
✓ Wrote 10 chunks
→ Updating resume index...
✓ Resume index updated

=== Seed complete ===

Resume seeded successfully!
  GCS: gs://samkirk-v3-private/resume/master.md
  Chunks: 10
  Version: 1
```

---

## Real-LLM E2E Test (Step 6.4)

**Command:** `cd web && npm run test:e2e:real`

**Script:** `web/scripts/e2e-real-llm.ts`

**Prerequisites:**
- GCP credentials configured
- Seeded resume data (`npm run seed:resume`)

**Cost:** ~$0.01-0.05 per run (real Vertex AI calls)

### Test Flow

1. Verifies resume is seeded in GCS/Firestore
2. Creates test session and submission
3. Extracts job fields from sample job posting
4. Builds LLM prompt with resume chunks
5. Calls Vertex AI Gemini for fit analysis
6. Validates JSON response structure
7. Stores report artifacts in GCS
8. Cleans up test data

### Sample Output (Verified 2026-02-03)

```
=== E2E Test with Real Vertex AI ===

→ Checking environment variables...
✓ Environment validated
→   Project: samkirk-v3
→   Model: gemini-2.0-flash
→ Checking for seeded resume data...
✓ Found resume version 1 with 11 chunks
→ Loading resume chunks...
✓ Loaded 11 chunks
→ Creating test session...
✓ Test session created
→ Creating test submission...
✓ Test submission created
→ Extracting job fields...
✓   Title: Senior Software Engineer - AI Platform
→   Company: TechCorp Inc
→   Seniority: senior
→   Location: fully_remote
→   Skills: TypeScript, Python, GCP, AWS, TensorFlow, PyTorch, Docker, Kubernetes
→ Creating flow state...
✓ Flow state created
→ Initializing Vertex AI...
✓ Vertex AI initialized
→ Building LLM prompt...
✓ Prompt: 6913 characters
→ Calling Vertex AI (this may take 10-30 seconds)...
✓ Response received in 13178ms
→ Response: 1801 characters
→ Parsing response...
✓ Response parsed successfully
→ Validating response structure...
✓ Response structure valid
→ Token usage: 1579 input, 461 output
→ Estimated cost: $0.0037
→ Storing report artifacts...
✓ Report artifacts stored
✓ Submission updated to complete

--- Analysis Results ---

Overall Score: Well
Recommendation: Sam is an excellent fit for this role, possessing the required 
technical skills and experience. His background in AI/ML, cloud infrastructure, 
and full-stack development aligns well with the job description.

Categories:
  Technical Skills: Well
    Sam demonstrates strong proficiency in all required technical skills, 
    including TypeScript, Python, GCP, AWS, TensorFlow, PyTorch, Docker, and 
    Kubernetes. He also possesses experience with LLMs and RAG systems, which 
    is listed as a 'nice to have'.
  Experience Level: Well
    With over 10 years of experience, Sam exceeds the requirement of 5+ years 
    of software engineering experience. His experience at both startups and 
    larger tech companies makes him well-suited for a senior role.
  Location Fit: Well
    The job is fully remote within the US, and there is no indication that 
    Sam is not located in the US.

=== E2E Test Passed ===

✓ Full fit analysis flow completed successfully!

--- Cleanup ---

✓ Test submission cleaned up
✓ Test session cleaned up
```

### Validation Checks

| Check | Validation |
|-------|------------|
| Resume seeded | `resumeIndex/current` exists with `chunkCount > 0` |
| Vertex AI response | Candidates array not empty |
| Overall score | One of: `Well`, `Partial`, `Poor` |
| Categories | Each has `name`, `score`, `rationale` |
| Category scores | Each is `Well`, `Partial`, or `Poor` |
| Artifacts stored | Report MD and JSON written to GCS |

**Back to:** [TODO.md Step 6.4](TODO.md#64-ui-wiring-for-fit-tool-multi-turn-ux--downloads)

---

## Lint Check

**Command:** `cd web && npm run lint`

**Result:** Clean (0 errors, 0 warnings)

---

## Notes

### What These Tests Do NOT Cover

1. **Real reCAPTCHA widget** — Unit tests mock the verification; manual E2E test required (see GCP-SETUP.md § 8.3)
2. **OAuth login flow** — Unit tests mock NextAuth; manual smoke test required
3. **Public HTTP access** — Org policy blocks `allUsers` access; proxy route handles this
4. **End-to-end UI flows** — Playwright E2E tests are planned for Step 6.4

### Independent Verification

To independently verify GCP state after smoke tests (data should be cleaned up):

```bash
# Check Firestore for leftover test data
gcloud firestore documents list \
  --project=samkirk-v3 \
  --database="(default)" \
  --collection-group=_smoke_test

# Check GCS for leftover test files
gsutil ls gs://samkirk-v3-private/_smoke_test/
gsutil ls gs://samkirk-v3-public/_smoke_test_dance_menu/
```

These should return empty results if cleanup succeeded.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-02-03 | Added Resume Context Retrieval tests (50 tests, Step 7.1) — context assembly and citation generation |
| 2026-02-03 | Verified Real-LLM E2E test with gemini-2.0-flash model (1579 input, 469 output tokens, $0.0037) |
| 2026-02-03 | Added Resume Seeding Workflow and Real-LLM E2E Test sections |
| 2026-02-03 | Clarified that test fixtures are reference-only and may become stale (not used by automated tests) |
| 2026-02-03 | Added test fixtures folder `web/test-fixtures/fit-report/` with input/output examples (Step 6.3) |
| 2026-02-03 | Added E2E tests section: 5 Playwright tests for Fit Tool happy path (Step 6.4) |
| 2026-02-03 | Verified all 757 tests pass with network access (including route.test.ts integration tests) |
| 2026-02-03 | Added Section 10: Vertex AI Gemini Test (Step 6.3) |
| 2026-02-03 | Added Fit Report Generator tests (36 tests, Step 6.3) |
| 2026-02-03 | Added Vertex AI LLM Wrapper tests (19 tests, Step 6.3) |
| 2026-02-03 | Added Fit Flow State Machine tests (96 tests, Step 6.2) |
| 2026-02-03 | Section 9 now automated in smoke script; added section filtering (`--section=N`) |
| 2026-02-03 | Added Section 9: Job Ingestion URL Fetch Test (Step 6.1) |
| 2026-02-03 | Initial document with Phase 0–5 test results |
