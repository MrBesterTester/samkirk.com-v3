# samkirk.com v3 — Test Results

> Last updated: 2026-02-04 (Step 9.2 Retention Deletion Route)
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
  - [Section 11: Resume Generation Test](#section-11-resume-generation-test)
  - [Section 12: Interview Chat Test](#section-12-interview-chat-test)
- [Unit Tests](#unit-tests)
  - [Results](#results)
  - [Test File Breakdown](#test-file-breakdown)
  - [Fit Flow State Machine (Step 6.2)](#fit-flow-state-machine-step-62)
  - [Vertex AI LLM Wrapper (Step 6.3)](#vertex-ai-llm-wrapper-step-63)
  - [Fit Report Generator (Step 6.3)](#fit-report-generator-step-63)
  - [Resume Context Retrieval (Step 7.1)](#resume-context-retrieval-step-71)
  - [Resume Generator (Step 7.2)](#resume-generator-step-72)
  - [Interview Guardrails (Step 8.1)](#interview-guardrails-step-81)
  - [Interview Chat (Step 8.2)](#interview-chat-step-82)
  - [Admin Submissions List (Step 9.1)](#admin-submissions-list-step-91)
  - [Retention Deletion Route (Step 9.2)](#retention-deletion-route-step-92)
- [E2E Tests (Playwright)](#e2e-tests-playwright)
  - [Fit Tool Happy Path (Step 6.4)](#fit-tool-happy-path-step-64)
  - [Resume Tool Happy Path (Step 7.3)](#resume-tool-happy-path-step-73)
  - [Interview Tool E2E Tests (Step 8.3)](#interview-tool-e2e-tests-step-83)
- [Resume Seeding Workflow](#resume-seeding-workflow)
- [Real-LLM E2E Test](#real-llm-e2e-test)
  - [Fit Tool (Step 6.4)](#fit-tool-step-64)
  - [Resume Tool (Step 7.3)](#resume-tool-step-73)
- [Lint Check](#lint-check)
- [Notes](#notes)
  - [What These Tests Do NOT Cover](#what-these-tests-do-not-cover)
  - [Independent Verification](#independent-verification)
- [Revision History](#revision-history)

---

## Summary

| Category | Result | Details |
|----------|--------|---------|
| GCP Smoke Tests | **PASS** | 12/12 sections passed |
| Unit Tests | **PASS** | 1117/1117 tests passed (36 files) |
| E2E Tests (Playwright) | **PASS** | 22/22 tests passed (Fit: 5, Resume: 6, Interview: 11) |
| E2E Tests (Real LLM) | **PASS** | All 3 tools (Fit, Resume, Interview) with gemini-2.0-flash |
| Lint | **PASS** | 0 errors, 0 warnings |

**Note on network-dependent tests:** Approximately 13 tests require network access to GCS/Firestore (`route.test.ts`: 3, `interview-chat.test.ts`: 10). These tests are routinely skipped or fail when run in sandboxed environments without network access. The counts above reflect runs with full network access.

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

### Section 11: Resume Generation Test

**Purpose:** Verify end-to-end resume generation with Vertex AI including artifact storage ([Step 7.2](TODO.md#72-resume-generation-2-page-factual-only--artifacts))

**Command:** `npm run smoke:gcp -- --section=11` (or `--section=resume-gen`)

```
→ Writing test resume chunks to Firestore...
✓ Wrote 4 test chunks
✓ Resume index updated
→ Initializing Vertex AI for resume generation...
→ Generating tailored resume with Vertex AI...
✓ Resume JSON parsed successfully
✓ Generated resume for: Sam Kirk
→ Title: Senior Software Engineer - AI/ML Platform
→ Experience entries: 1
→ Skill categories: 3
→ Generating markdown from resume content...
✓ Generated markdown: 156 words, 987 characters
→ Writing resume artifacts to GCS...
✓ Artifacts written to GCS
→ Creating submission record...
✓ Submission record created
→ Verifying artifacts...
✓ Artifacts verified
→ Cleaning up test data...
✓ Test chunks deleted
✓ Test submission deleted
✓ Deleted 2 artifact files
✓ Test resume index deleted
✓ Resume generation test complete
```

**Verification:**

1. **Resume Chunk Loading:**
   - Creates test chunks in `resumeChunks` collection
   - Updates `resumeIndex/current` with version and count
   - Chunks include Summary, Experience, Skills, Education sections

2. **Vertex AI Resume Generation:**
   - Builds prompt with job text + resume context
   - System prompt enforces "do not invent" constraint
   - Requests structured JSON output
   - Parses and validates response structure

3. **Artifact Storage:**
   - Generates markdown resume from structured content
   - Writes `resume.md` and `resume.html` to GCS
   - Creates submission record with tool="resume"
   - Stores citations referencing source chunks

4. **Constraint Enforcement:**
   - Word count tracking (target: 600-900 words for 2-page resume)
   - Maximum 5 bullets per job entry
   - Only uses facts from provided resume context

**Test Data:**

| Item | Value |
|------|-------|
| Test chunks | 4 (Summary, Experience, Skills, Education) |
| Test job | Senior Software Engineer - AI/ML Platform |
| Output format | JSON → Markdown → HTML |
| Artifacts | `resume.md`, `resume.html` |

**Related Unit Tests:** [Resume Generator](#resume-generator-step-72)

**Test Fixtures:** [`web/test-fixtures/resume-generator/`](../web/test-fixtures/resume-generator/) — Contains sample inputs and outputs

**Back to:** [TODO.md Step 7.2](TODO.md#72-resume-generation-2-page-factual-only--artifacts)

---

### Section 12: Interview Chat Test

**Purpose:** Verify multi-turn interview conversation with Vertex AI, off-topic redirection, and transcript artifact generation

**Run command:**
```bash
npm run smoke:gcp -- --section=12
```

**Test Run:** 2026-02-03, Duration: ~51 seconds

**Output:** ([full output](../web/test-fixtures/interview-chat/smoke-test-output.txt))
```
--- Section 12: Interview Chat Test ---

→ Writing test resume chunks to Firestore...
✓ Wrote 3 test chunks
✓ Resume index updated
→ Initializing Vertex AI for interview chat...
✓ Vertex AI initialized
→ Testing multi-turn conversation...
→   Q: "What is your background?"
✓   A: "I'm a software engineer with over 10 years of experience in building scalable web applications and A..."
→   Found topics: engineer, experience, years
→   Q: "What are your technical skills?"
✓   A: "My core technical skills include: Programming in TypeScript, JavaScript, Python, and Go. I'm profici..."
→   Found topics: typescript, python, cloud, gcp
✓ Multi-turn conversation test passed
→ Testing off-topic redirection...
✓ Off-topic redirection verified
→ Creating test submission and transcript...
✓ Transcript artifacts written to GCS
✓ Submission record created
→ Verifying artifacts...
✓ Artifacts verified
→ Cleaning up test data...
✓ Test chunks deleted
✓ Test submission deleted
✓ Deleted 2 artifact files
✓ Test resume index deleted
✓ Interview chat test complete

=== Smoke tests complete: 1/1 sections passed ===
```

**Verification Steps:**

| Step | Test | Result | Details |
|------|------|--------|---------|
| 12.1 | Resume chunk loading | **PASS** | 3 chunks written to `resumeChunks` collection |
| 12.2 | Resume index update | **PASS** | `resumeIndex/current` updated with version 9996 |
| 12.3 | Vertex AI init | **PASS** | Model: `gemini-2.0-flash`, Location: `us-central1` |
| 12.4 | Career Q1: Background | **PASS** | Response contained: `engineer`, `experience`, `years` |
| 12.5 | Career Q2: Skills | **PASS** | Response contained: `typescript`, `python`, `cloud`, `gcp` |
| 12.6 | Off-topic redirect | **PASS** | "Political views?" → career-focused redirect |
| 12.7 | Transcript MD | **PASS** | `transcript.md` written to GCS |
| 12.8 | Transcript HTML | **PASS** | `transcript.html` written to GCS |
| 12.9 | Submission record | **PASS** | Created with tool=`interview`, citations attached |
| 12.10 | Artifact verification | **PASS** | Content readable from GCS |
| 12.11 | Cleanup | **PASS** | All test data removed |

**Detailed Test Results:**

1. **Resume Context Loading:**
   - Chunks: Summary, Experience, Skills ([resume-chunks.json](../web/test-fixtures/interview-chat/resume-chunks.json))
   - Version: 9996 (smoke test version to avoid conflicts)
   - Index updated at `resumeIndex/current`

2. **Multi-Turn Conversation:** ([test-questions.json](../web/test-fixtures/interview-chat/test-questions.json))
   
   | Turn | Question | Expected Topics | Found Topics | Status |
   |------|----------|-----------------|--------------|--------|
   | 1 | "What is your background?" | engineer, experience, years | engineer, experience, years | **PASS** |
   | 2 | "What are your technical skills?" | typescript, python, cloud, gcp | typescript, python, cloud, gcp | **PASS** |

3. **Guardrails Enforcement:**
   - Test question: "What are your political views?"
   - Expected behavior: Redirect to career topics
   - Verification: Response contained `career`, `professional`, `work`, `experience`, or `skills`
   - Result: **PASS** - LLM returned career-focused redirect

4. **Transcript Generation:** ([sample transcript](../web/test-fixtures/interview-chat/conversation-transcript.md))
   - Format: Markdown with `**Interviewer:**` and `**Sam Kirk:**` labels
   - Citations: "Sources Referenced" section with chunk titles and sourceRefs
   - Footer: Generated timestamp and contact email
   - Artifacts written:
     - `submissions/{id}/output/transcript.md`
     - `submissions/{id}/output/transcript.html`

5. **Submission Record:**
   ```json
   {
     "tool": "interview",
     "status": "complete",
     "extracted": {
       "messageCount": 6,
       "turnCount": 3
     },
     "citations": [
       { "chunkId": "_smoke_interview_chunk_001", "title": "Summary", "sourceRef": "h2:Summary" },
       { "chunkId": "_smoke_interview_chunk_002", "title": "Experience", "sourceRef": "h2:Experience" },
       { "chunkId": "_smoke_interview_chunk_003", "title": "Skills", "sourceRef": "h2:Skills" }
     ],
     "expiresAt": "90 days from creation"
   }
   ```

**Test Inputs:**

| File | Description |
|------|-------------|
| [resume-chunks.json](../web/test-fixtures/interview-chat/resume-chunks.json) | 3 resume chunks (Summary, Experience, Skills) |
| [test-questions.json](../web/test-fixtures/interview-chat/test-questions.json) | Test questions with expected topics |

**Test Outputs:**

| File | Description |
|------|-------------|
| [conversation-transcript.md](../web/test-fixtures/interview-chat/conversation-transcript.md) | Sample transcript output |
| [smoke-test-output.txt](../web/test-fixtures/interview-chat/smoke-test-output.txt) | Full console output |

**GCP Resources Used:**

| Resource | Path/Collection | Purpose |
|----------|-----------------|---------|
| Firestore | `resumeChunks/{chunkId}` | Store test resume chunks |
| Firestore | `resumeIndex/current` | Track chunk version |
| Firestore | `submissions/{id}` | Store submission record |
| Cloud Storage | `submissions/{id}/output/transcript.md` | Markdown transcript |
| Cloud Storage | `submissions/{id}/output/transcript.html` | HTML transcript |
| Vertex AI | `gemini-2.0-flash` | LLM for conversation |

**Test Fixtures:** [`web/test-fixtures/interview-chat/`](../web/test-fixtures/interview-chat/) — Contains sample inputs and outputs

**Related Unit Tests:** [Interview Chat (Step 8.2)](#interview-chat-step-82)

**Back to:** [TODO.md Step 8.2](TODO.md#82-chat-endpoint--transcript-artifact)

---

## Unit Tests

**Command:** `cd web && npm test -- --run`

**Framework:** Vitest + React Testing Library

### Results

```
Test Files  36 passed (36)
     Tests  1117 passed (1117)
  Duration  ~12s
```

**Note:** Tests require network access to pass completely. Some integration tests (route.test.ts, interview-chat.test.ts) connect to real GCP services and will skip or fail if run in a sandboxed environment without network access.

### Test File Breakdown

| File | Tests | Coverage Area |
|------|-------|---------------|
| `interview-guardrails.test.ts` | 196 | Interview guardrails ([Step 8.1](#interview-guardrails-step-81)) |
| `fit-flow.test.ts` | 96 | Fit flow state machine ([Step 6.2](#fit-flow-state-machine-step-62)) |
| `job-ingestion.test.ts` | 74 | Job text ingestion from paste/URL/file (Step 6.1) |
| `resume-generator.test.ts` | 62 | Resume generation ([Step 7.2](#resume-generator-step-72)) |
| `spend-cap.test.ts` | 60 | Spend cap enforcement (Step 5.3) |
| `markdown-renderer.test.ts` | 56 | Markdown to HTML rendering (Step 4.2) |
| `retention.test.ts` | 55 | Retention cleanup ([Step 9.2](#retention-deletion-route-step-92)) |
| `rate-limit.test.ts` | 50 | Rate limiting utility (Step 5.2) |
| `submission.test.ts` | 53 | Submission CRUD helpers (Step 4.1, [Step 9.1](#admin-submissions-list-step-91)) |
| `resume-context.test.ts` | 50 | Resume context retrieval ([Step 7.1](#resume-context-retrieval-step-71)) |
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

### Resume Generator (Step 7.2)

**File:** `src/lib/resume-generator.test.ts`

**Purpose:** Verify the resume generation module including prompt building, response parsing, markdown generation, and word count validation

**Test Categories (62 tests):**

| Category | Tests | Description |
|----------|-------|-------------|
| Constants validation | 3 | `TARGET_WORD_COUNT_MIN=600`, `TARGET_WORD_COUNT_MAX=900`, `MAX_WORDS_PER_SECTION=250`, `MAX_BULLETS_PER_JOB=5` |
| System prompt validation | 6 | "NEVER INVENT" constraint, word count limits, JSON format, tailoring guidance, ATS optimization |
| `buildResumeGenerationPrompt()` | 6 | Job posting section, target position, resume context chunks, instructions |
| `parseResumeResponse()` | 19 | Valid JSON, code fences, structure validation, missing fields, bullet limits, type filtering |
| `generateMarkdownResume()` | 13 | Header, contact info, LinkedIn links, summary, skills, experience, education, additional sections |
| `countResumeWords()` | 8 | Header, summary, skills, experience, education, additional sections, edge cases |
| `ResumeGeneratorError` | 3 | Error properties, JSON serialization, inheritance |
| Type definitions | 2 | `ResumeExperience`, `ResumeEducation` required fields |

**Key Behaviors Verified:**

1. **System Prompt Constraints:**
   - Explicit "NEVER INVENT" and "ONLY use information from resume context"
   - Target word count: 600-900 words (2-page resume)
   - Maximum 5 bullets per job, 250 words per section
   - ATS optimization guidance included

2. **Prompt Building:**
   - Includes job posting with optional target position/company
   - Labels resume chunks as `[CHUNK N: Title]` for citation tracking
   - "SOURCE OF TRUTH" section header emphasizes factual constraint
   - Instructions remind about word limits and JSON format

3. **Response Parsing:**
   - Handles raw JSON and markdown-wrapped JSON (`\`\`\`json ... \`\`\``)
   - Validates required fields: `header.name`, `header.title`, `summary`, `skills`, `experience`, `education`
   - Enforces `MAX_BULLETS_PER_JOB` (5) limit by slicing
   - Filters non-string items from arrays
   - Handles optional `additionalSections`

4. **Markdown Generation:**
   - Header with name, title, contact info line
   - LinkedIn/website formatted as links (handles https prefix)
   - Skills grouped by category
   - Experience with location (optional) and bullet points
   - Education with optional details
   - Sections omitted when empty

5. **Word Count Validation:**
   - Counts words in header, summary, skills, experience, education
   - Does not count date ranges (typically formatted as dates)
   - Additional sections included in count

**Example Structured Output:**

```json
{
  "header": { "name": "Sam Kirk", "title": "Senior Software Engineer" },
  "summary": "Experienced engineer with expertise in...",
  "skills": [
    { "category": "Languages", "items": ["TypeScript", "Python"] }
  ],
  "experience": [
    {
      "title": "Senior Engineer",
      "company": "TechCorp",
      "dateRange": "2019 - 2024",
      "bullets": ["Led React development", "Built microservices"]
    }
  ],
  "education": [
    { "degree": "B.S. Computer Science", "institution": "UC Berkeley", "year": "2015" }
  ]
}
```

**Related Smoke Test:** [Section 11: Resume Generation Test](#section-11-resume-generation-test)

**Test Fixtures:** [`web/test-fixtures/resume-generator/`](../web/test-fixtures/resume-generator/)
- [job-description.txt](../web/test-fixtures/resume-generator/job-description.txt) — Input job posting
- [resume-chunks.json](../web/test-fixtures/resume-generator/resume-chunks.json) — Resume chunks (source of truth)
- [generated-resume.md](../web/test-fixtures/resume-generator/generated-resume.md) — Output markdown
- [generated-resume.html](../web/test-fixtures/resume-generator/generated-resume.html) — Output HTML

**Back to:** [TODO.md Step 7.2](TODO.md#72-resume-generation-2-page-factual-only--artifacts)

---

### Interview Guardrails (Step 8.1)

**File:** `src/lib/interview-guardrails.test.ts`

**Purpose:** Verify career-only topic classification, guardrails enforcement, and redirect response generation for the "Interview Me Now" tool

**Test Categories (196 tests):**

| Category | Tests | Description |
|----------|-------|-------------|
| Constants validation | 3 | `INTERVIEW_SUBJECT_NAME`, `CONTACT_EMAIL`, `LLM_CLASSIFICATION_SYSTEM_PROMPT` |
| Allowed topics - work_history | 8 | Job history, roles, companies, responsibilities, career path |
| Allowed topics - projects | 8 | Projects, achievements, portfolio, impact, shipped products |
| Allowed topics - skills | 8 | Technical skills, soft skills, certifications, tech stack |
| Allowed topics - education | 7 | Degrees, universities, bootcamps, certifications |
| Allowed topics - availability | 6 | Start date, notice period, full-time/part-time |
| Allowed topics - location_remote | 7 | Remote work, relocation, timezone, hybrid |
| Allowed topics - compensation | 5 | Salary expectations, benefits, equity |
| Allowed topics - career_goals | 6 | Career goals, motivations, 5-year plan |
| Allowed topics - interview_meta | 4 | Interview process, "tell me about yourself" |
| Disallowed topics - personal_life | 8 | Family, relationships, age, hobbies, weekends |
| Disallowed topics - politics | 7 | Political views, voting, parties, government |
| Disallowed topics - medical | 7 | Health conditions, medications, disabilities |
| Disallowed topics - religion | 6 | Religious beliefs, church, prayer, spirituality |
| Disallowed topics - financial_private | 6 | Bank accounts, debt, investments, net worth |
| Disallowed topics - general_assistant | 9 | Coding help, weather, jokes, recipes, translations |
| Disallowed topics - prompt_injection | 6 | Ignore instructions, jailbreak, system prompt reveal |
| Disallowed topics - inappropriate | 4 | Offensive content, violence, illegal activities |
| Edge cases | 7 | Empty messages, whitespace, mixed-case, ambiguous |
| `checkGuardrails()` | 6 | Pass/fail states, redirect responses, LLM verification suggestion |
| Redirect responses | 7 | Category-specific responses, generic response, persistent off-topic |
| `isPersistentlyOffTopic()` | 6 | Threshold detection, mixed messages, custom threshold |
| LLM helpers | 6 | `buildClassificationPrompt()`, `parseLlmClassificationResponse()` |
| Helper functions | 4 | `getAllowedTopicCategories()`, `getDisallowedTopicCategories()` |
| Confidence levels | 3 | High/medium/low confidence for allowed and disallowed |
| Real-world questions | 17 | 10 allowed interview questions, 7 disallowed inappropriate questions |
| Prompt injection resistance | 8 | Various injection attempts blocked |
| General assistant rejection | 10 | Coding, weather, jokes, recipes, etc. |
| Result structure | 4 | `TopicClassificationResult`, `GuardrailResult` fields |

**Key Behaviors Verified:**

1. **Allowed Topics (9 categories):**
   - Work history, projects, skills, education
   - Availability, location/remote, compensation
   - Career goals, interview meta

2. **Disallowed Topics (8 categories):**
   - Personal life, politics, medical, religion
   - Financial private, general assistant
   - Prompt injection, inappropriate content

3. **Classification Confidence:**
   - **High:** Strong pattern match (multiple patterns or definitive keywords)
   - **Medium:** Single pattern match
   - **Low:** No pattern match, defaults to allowed with LLM verification suggested

4. **Redirect Responses:**
   - Category-specific polite redirects mentioning Sam Kirk
   - Guides user back to allowed career topics
   - Contact email provided for persistent off-topic users

5. **Prompt Injection Resistance:**
   - Blocks "ignore instructions", "you are now DAN", "reveal system prompt"
   - Blocks "jailbreak", "pretend no restrictions", "forget rules"
   - Blocks "SYSTEM:" prefix attempts

6. **General Assistant Rejection:**
   - Blocks coding help, weather queries, jokes, recipes
   - Blocks translation, calculation, recommendations
   - Blocks news, poems, stories

**Example Classification:**

```typescript
// Allowed (high confidence)
classifyTopic("What programming languages do you know?")
// → { isAllowed: true, category: "skills", confidence: "high" }

// Disallowed (high confidence)
classifyTopic("What are your political views?")
// → { isAllowed: false, category: "politics", confidence: "high" }

// Uncertain (low confidence, suggest LLM verification)
classifyTopic("Hello there")
// → { isAllowed: true, category: "unknown", confidence: "low" }
```

**LLM-Assisted Classification (for uncertain cases):**

```typescript
// System prompt for LLM classification
LLM_CLASSIFICATION_SYSTEM_PROMPT  // Defines allowed/disallowed topics

// Build prompt
buildClassificationPrompt("What is your religion?")
// → 'Classify this user message: "What is your religion?"'

// Parse response
parseLlmClassificationResponse("DISALLOWED")  // → false
parseLlmClassificationResponse("ALLOWED")     // → true
```

**Back to:** [TODO.md Step 8.1](TODO.md#81-career-only-policy--guardrails)

---

### Interview Chat (Step 8.2)

**File:** `src/lib/interview-chat.test.ts`

**Purpose:** Verify interview chat endpoint functionality including conversation management, guardrail integration, transcript generation, and multi-turn conversation handling

**Test Categories (44 tests):**

| Category | Tests | Description |
|----------|-------|-------------|
| Constants | 3 | `MAX_CONVERSATION_TURNS`, `MAX_MESSAGE_LENGTH`, `INTERVIEW_SUBJECT_NAME` |
| System Prompt | 8 | Subject name, resume context, behavioral guidelines, career focus |
| Transcript Generation | 8 | Empty/populated transcripts, user/assistant formatting, citations, footer |
| Message Validation | 4 | Empty messages, whitespace, max length, valid length |
| Turn Limit | 2 | Max turns reached, messages before limit |
| Guardrails Integration | 3 | Political redirect, personal life redirect, general assistant redirect |
| Successful Processing | 6 | Career questions, turn count, history handling, transcript saving |
| Error Handling | 3 | Missing resume context, content blocked, context loading failure |
| Citations | 1 | Citation accumulation across messages |
| Conversation Management | 3 | Create new, load existing, mismatched conversation ID |
| InterviewChatError | 3 | Error properties, default statusCode, JSON serialization |

**Key Behaviors Verified:**

1. **System Prompt Construction:**
   - Includes `INTERVIEW_SUBJECT_NAME` (Sam Kirk)
   - Wraps resume context in `<resume_context>` tags
   - Includes behavioral guidelines for career-only focus
   - Provides first-person perspective instructions

2. **Transcript Generation:**
   - Formats user messages as "**Interviewer:**"
   - Formats assistant messages as "**Sam Kirk:**"
   - Includes numbered citations section
   - Adds footer with contact email

3. **Message Processing:**
   - Validates message length (max 2000 characters)
   - Enforces turn limit (max 20 turns)
   - Applies guardrails before LLM call
   - Returns redirect response for off-topic questions

4. **Conversation State:**
   - Saves to GCS as `conversation.json`
   - Generates `transcript.md` and `transcript.html`
   - Accumulates unique citations across turns
   - Updates submission with message count

**Example Usage:**

```typescript
// Process a career-related message
const result = await processMessage(conversation, "What is your experience?");
// → { success: true, message: { role: "assistant", content: "..." }, turnCount: 1 }

// Off-topic message gets redirect
const result = await processMessage(conversation, "What are your political views?");
// → { success: true, message: { content: "...career-related topics..." } }
```

**Test Fixtures:** [`web/test-fixtures/interview-chat/`](../web/test-fixtures/interview-chat/) — Contains sample inputs and outputs

**Related Smoke Test:** [Section 12: Interview Chat Test](#section-12-interview-chat-test)

**Back to:** [TODO.md Step 8.2](TODO.md#82-chat-endpoint--transcript-artifact)

---

### Admin Submissions List (Step 9.1)

**File:** `src/lib/submission.test.ts`

**Purpose:** Verify submission listing backend logic (query options, type definitions) for the admin submissions viewer

> **Note:** These are backend/lib tests, not UI component tests. Admin UI E2E tests are deferred to Step 10.2 (Full E2E test of deployed application).

**Run Command:**
```bash
cd web && npm test -- --run src/lib/submission.test.ts
```

**Results:** 53/53 tests passed

**Test Categories (53 tests):**

| Category | Tests | Description |
|----------|-------|-------------|
| Constants | 5 | `SUBMISSION_ID_BYTES`, `SUBMISSION_RETENTION_DAYS`, `SUBMISSION_RETENTION_MS`, valid tools/statuses |
| `generateSubmissionId()` | 4 | String ID, correct length (22 chars), uniqueness, URL-safe characters |
| `isValidSubmissionId()` | 5 | Valid IDs, too short/long, invalid characters, base64url support |
| `createSubmissionTimestamps()` | 3 | Current time, 90-day expiry, Timestamp instances |
| `createSubmissionTimestampsFromDate()` | 2 | Custom date, year boundary handling |
| `calculateExpiresAt()` | 3 | 90-day offset, leap year, Date object return |
| `isSubmissionExpired()` | 5 | Before/after expiry, exact match, 89/90-day edge cases |
| `buildArtifactGcsPrefix()` | 3 | Correct prefix, trailing slash, special characters |
| `isValidTool()` | 2 | Valid tools (fit/resume/interview), invalid values |
| `isValidStatus()` | 2 | Valid statuses, invalid values |
| `isValidCitation()` | 7 | Valid citation, null, non-objects, missing fields, extra fields |
| `isValidCitationsArray()` | 5 | Empty array, valid array, non-arrays, invalid items |
| TTL computation edge cases | 3 | DST transitions, year boundary, time component preservation |
| `ListSubmissionsOptions` | 2 | Default limit (50), max cap (100) |
| `SubmissionWithId` type | 1 | Expected properties (id, doc) |

**Key Behaviors Verified:**

1. **Submission Listing:**
   - `listSubmissions()` supports `limit`, `tool`, and `status` filters
   - Default limit is 50, maximum capped at 100
   - Results ordered by `createdAt` descending (newest first)

2. **Query Options:**
   - Optional `tool` filter for fit/resume/interview
   - Optional `status` filter for in_progress/complete/blocked/error
   - Returns `SubmissionWithId[]` with both `id` and full `doc` data

3. **Submission ID Validation:**
   - 22-character base64url strings (16 bytes)
   - URL-safe characters only (A-Z, a-z, 0-9, _, -)

**Implementation Notes (not tested here):**

- Admin route protection via `(protected)` route group with auth-checking layout
- Redirects unauthenticated users to `/admin/login`
- Access denied for non-allowlisted emails
- These will be E2E tested in Step 10.2

**Admin Pages Created:**

| Page | Purpose |
|------|---------|
| `/admin/submissions` | List view with stats cards and table |
| `/admin/submissions/[id]` | Detail view with inputs/outputs/citations |

**Lint Check:**
```bash
cd web && npm run lint
# Result: 0 errors, 0 warnings
```

**Back to:** [TODO.md Step 9.1](TODO.md#91-admin-submissions-list--details-view)

---

### Retention Deletion Route (Step 9.2)

**File:** `src/lib/retention.test.ts`

**Purpose:** Verify 90-day retention cleanup logic including expiry detection, submission deletion, and idempotent operation

**Run Command:**
```bash
cd web && npm test -- --run src/lib/retention.test.ts
```

**Results:** 55/55 tests passed

**Test Categories (55 tests):**

| Category | Tests | Description |
|----------|-------|-------------|
| Constants | 2 | `MAX_DELETIONS_PER_RUN=100`, `QUERY_BATCH_SIZE=100` |
| `isExpired()` | 8 | Before/after expiry, exact match, millisecond precision, edge cases |
| `isValidSubmissionPrefix()` | 10 | Valid prefixes, invalid formats, special characters, edge cases |
| `extractSubmissionIdFromPrefix()` | 6 | Valid extraction, invalid prefixes, null returns |
| `buildCleanupSummary()` | 8 | Summary format, zero/nonzero counts, failed IDs list, duration |
| Type definitions | 5 | `DeletionResult`, `RetentionCleanupResult`, `ExpiredSubmission` shapes |
| Edge cases | 8 | Empty results, all success, all failure, partial failure |
| Timestamp handling | 4 | Firestore Timestamp comparison, UTC consistency |
| Idempotency | 4 | Re-running on already-deleted data, partial cleanup resumption |

**Key Behaviors Verified:**

1. **Expiry Detection:**
   - `isExpired()` correctly compares `expiresAt` with current time
   - Handles exact boundary (expired at exact millisecond)
   - Works with Firestore `Timestamp` objects

2. **Prefix Validation:**
   - Accepts: `submissions/{id}/`, `submissions/{id}`
   - Rejects: empty, missing `submissions/` prefix, nested paths, special characters
   - `extractSubmissionIdFromPrefix()` extracts ID or returns null

3. **Cleanup Summary:**
   - Format: `Retention cleanup completed | found=N | deleted=N | failed=N | duration=Nms`
   - Failed IDs appended when `failedCount > 0`
   - No secrets or PII in output (safe for Cloud Run logs)

4. **Idempotency:**
   - `deletePrefix()` returns 0 if no files exist (no error)
   - Firestore delete succeeds even if doc doesn't exist
   - Safe to retry after partial failure

**Example Summary Output:**

```
Retention cleanup completed | found=5 | deleted=4 | failed=1 | duration=1234ms | failed_ids=[abc123]
```

**Related Implementation:**
- Route: `POST /api/maintenance/retention` ([source](../web/src/app/api/maintenance/retention/route.ts))
- Library: `src/lib/retention.ts` ([source](../web/src/lib/retention.ts))

**Lint Check:**
```bash
cd web && npm run lint
# Result: 0 errors, 0 warnings
```

**Back to:** [TODO.md Step 9.2](TODO.md#92-retention-deletion-route-90-day--scheduler-integration)

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

### Resume Tool Happy Path (Step 7.3)

**Run command:**
```bash
cd web && npx playwright test resume-tool.spec.ts --headed
```

**Results:** 6/6 tests passed

| Test | Status | Duration |
|------|--------|----------|
| should complete full flow: input → generating → results | **PASS** | ~30s |
| should allow generating another resume after completion | **PASS** | ~2s |
| should show URL input mode when selected | **PASS** | ~2s |
| should validate empty input | **PASS** | ~2s |
| should display feature cards | **PASS** | ~2s |
| should handle error states gracefully | **PASS** | ~3s |

**E2E Test Mode Features:**
- **Captcha bypass:** `E2E_TESTING=true` and `NEXT_PUBLIC_E2E_TESTING=true` enable automatic captcha verification
- **Mock resume:** When no resume chunks are available in E2E mode, returns a mock resume so tests can complete the full flow
- **Real LLM:** When resume chunks are seeded (`npm run seed:resume`), uses real Vertex AI for generation

**Test coverage:**
1. **Full flow test:** Paste job text → Generate → View results with download button
2. **Generate another:** Verifies form reloads correctly after completion
3. **URL mode:** Tests switching between paste/URL/file input modes
4. **Validation:** Tests disabled button when input is empty
5. **Feature cards:** Verifies "100% Factual", "2-Page Format", "Multiple Formats" cards display
6. **Error handling:** Tests graceful error state display

**Test File:** [`web/e2e/resume-tool.spec.ts`](../web/e2e/resume-tool.spec.ts)

**Back to:** [TODO.md Step 7.3](TODO.md#73-ui-wiring-for-custom-resume)

---

### Interview Tool E2E Tests (Step 8.3)

**Run command:**
```bash
cd web && bash -c 'unset CI FORCE_COLOR NO_COLOR; npx playwright test interview-tool.spec.ts --headed'
```

**Results:** 11/11 tests passed (17.7s total)

| Test | Status | Duration |
|------|--------|----------|
| loads the interview page with correct heading | **PASS** | 3.9s |
| displays welcome message after captcha passes | **PASS** | 5.5s |
| displays input field and send button | **PASS** | 5.4s |
| displays feature cards | **PASS** | 4.8s |
| displays new conversation button | **PASS** | 5.6s |
| user message appears in chat immediately after send | **PASS** | 7.5s |
| Enter key sends message | **PASS** | 5.3s |
| input is disabled while waiting for response | **PASS** | 6.0s |
| typing indicator appears while waiting | **PASS** | 6.8s |
| new conversation resets the chat | **PASS** | 6.5s |
| completes a single career-related exchange | **PASS** | 7.9s |

**E2E Test Mode Features:**
- **Captcha bypass:** `E2E_TESTING=true` and `NEXT_PUBLIC_E2E_TESTING=true` enable automatic captcha verification
- **Mock interview response:** When no resume chunks are available in E2E mode, returns mock responses via `generateE2EMockResponse()` so tests can complete the full flow
- **System Chrome:** Uses `channel: "chrome"` in playwright.config.ts to run tests with installed Chrome browser

**Test Categories:**

1. **UI Tests (5 tests):**
   - Page loading with correct heading and description
   - Welcome message display after captcha passes
   - Input field, send button, and keyboard hint visibility
   - Feature cards (Real-Time Chat, Career-Focused, Download Transcript)
   - New Conversation button presence

2. **Input Behavior Tests (5 tests):**
   - User message appears immediately in chat after sending
   - Enter key sends message (Shift+Enter for new line)
   - Input disabled state while waiting for response
   - Typing indicator appearance (tests via disabled input placeholder)
   - New conversation button resets chat to initial state

3. **Conversation Test (1 test):**
   - Completes a single career-related exchange with mock response
   - Verifies "2 messages" count after response
   - Verifies download transcript availability

**Environment Notes:**
The test command unsets conflicting environment variables:
- `CI` - If set, causes `reuseExistingServer: false` and retries
- `FORCE_COLOR` / `NO_COLOR` - If both set, causes excessive warning spam

**Test File:** [`web/e2e/interview-tool.spec.ts`](../web/e2e/interview-tool.spec.ts)

**Test Fixtures:** [`web/test-fixtures/interview-chat/`](../web/test-fixtures/interview-chat/)
- `e2e-test-output.txt` - Playwright E2E test console output (mock mode)
- `e2e-real-llm-transcript.md` - Real LLM transcript from `npm run test:e2e:real`

**Back to:** [TODO.md Step 8.3](TODO.md#83-ui-wiring-for-interview-tool)

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

## Real-LLM E2E Test

**Command:** `cd web && npm run test:e2e:real`

**Script:** `web/scripts/e2e-real-llm.ts`

**Prerequisites:**
- GCP credentials configured
- Seeded resume data (`npm run seed:resume`)

**Cost:** ~$0.03-0.15 per run (real Vertex AI calls for all three tools)

This script tests the Fit, Resume, and Interview tool flows with real Vertex AI calls.

---

### Fit Tool (Step 6.4)

**Test Flow:**
1. Creates test session and submission
2. Extracts job fields from sample job posting
3. Builds LLM prompt with resume chunks
4. Calls Vertex AI Gemini for fit analysis
5. Validates JSON response structure
6. Stores report artifacts in GCS

**Results (Verified 2026-02-03):**

| Metric | Value |
|--------|-------|
| Response time | ~13s |
| Input tokens | 1,579 |
| Output tokens | 328-456 |
| Estimated cost | $0.0032-0.0037 |
| Overall Score | Well |

**Sample Analysis Output:**
```
Overall Score: Well
Recommendation: Sam is an excellent fit for this role given his extensive 
experience with the required technologies and relevant AI/ML projects.

Categories:
  Technical Skills: Well
    Sam demonstrates strong proficiency in all required technical skills...
  Experience Level: Well
    With over 10 years of experience, Sam exceeds the requirement of 5+ years...
  Location Fit: Well
    The job is fully remote (US), which aligns with Sam's ability to work remotely.
```

---

### Resume Tool (Step 7.3)

**Test Flow:**
1. Creates test session and submission
2. Builds resume generation prompt with job posting and resume chunks
3. Calls Vertex AI Gemini for resume generation
4. Validates JSON response structure (header, summary, skills, experience, education)
5. Stores resume artifacts (MD + JSON) in GCS

**Results (Verified 2026-02-03):**

| Metric | Value |
|--------|-------|
| Response time | ~8.6s |
| Input tokens | 1,890 |
| Output tokens | 1,372 |
| Estimated cost | $0.0075 |
| Word count | ~385 words |

**Sample Generation Output:**
```
Name: Sam Kirk
Title: Senior Software Engineer - AI Platform

Skill Categories: 8
  Languages: 5 items (TypeScript, JavaScript, Python, Go, SQL)
  Cloud & Infrastructure: 5 items (GCP, AWS, Docker, Kubernetes, Terraform)
  AI/ML: 5 items (TensorFlow, PyTorch, LangChain, RAG systems, LLM integration)
  ...

Experience Entries: 3
  Senior Software Engineer at Tech Company (5 bullets)
  Software Engineer at Startup Inc (5 bullets)
  Junior Developer at Agency Co (3 bullets)

Education Entries: 2
```

**Test Fixtures:** [`web/test-fixtures/resume-generator/`](../web/test-fixtures/resume-generator/)
- [e2e-generated-resume.json](../web/test-fixtures/resume-generator/e2e-generated-resume.json) — Structured JSON output
- [e2e-generated-resume.md](../web/test-fixtures/resume-generator/e2e-generated-resume.md) — Markdown output

---

### Interview Tool (Step 8.3)

**Test Flow:**
1. Creates test session and submission
2. Builds interview system prompt with resume context
3. Sends two career questions to Vertex AI Gemini
4. Receives multi-turn conversation responses
5. Generates transcript with citations
6. Stores transcript artifacts in GCS
7. Saves transcript to test fixtures

**Results (Verified 2026-02-04):**

| Metric | Value |
|--------|-------|
| Questions asked | 2 |
| Response time (Q1) | ~650ms |
| Response time (Q2) | ~1.5s |
| Input tokens | ~1,400/turn |
| Output tokens | 39 + 158 |
| Estimated cost | ~$0.004 |

**Sample Conversation Output:**
```
Q1: What programming languages do you know?
A1: I have experience with a variety of programming languages. My core languages 
include TypeScript, JavaScript, and Python. I also have experience with Go and SQL. 
Currently, I'm learning Rust.

Q2: Tell me about your most recent role.
A2: In my most recent role as a Senior Software Engineer at Tech Company (2020-Present), 
I led the development of AI-powered features for enterprise customers. This involved 
working across the full stack, from building React frontends to developing Python ML 
pipelines...
```

**Test Fixtures:** [`web/test-fixtures/interview-chat/`](../web/test-fixtures/interview-chat/)
- [e2e-real-llm-transcript.md](../web/test-fixtures/interview-chat/e2e-real-llm-transcript.md) — Full transcript with real LLM responses

**Back to:** [TODO.md Step 8.3](TODO.md#83-ui-wiring-for-interview-tool)

---

### Combined Test Output (Verified 2026-02-04)

```
============================================================
=== E2E Tests with Real Vertex AI (Fit + Resume Tools) ===
============================================================

→ Checking environment variables...
✓ Environment validated
→   Project: samkirk-v3
→   Model: gemini-2.0-flash
→ Checking for seeded resume data...
✓ Found resume version 2 with 11 chunks
→ Loading resume chunks...
✓ Loaded 11 chunks

==================================================
=== Testing Fit Tool ===
==================================================
...
✓ Fit tool test passed!

==================================================
=== Testing Resume Tool ===
==================================================
...
✓ Resume tool test passed!

============================================================
=== All E2E Tests Passed ===
============================================================

✓ Both Fit and Resume tool flows completed successfully!

--- Cleanup ---

✓ Resume test submission cleaned up
✓ Resume test session cleaned up
✓ Fit test submission cleaned up
✓ Fit test session cleaned up
```

### Validation Checks

| Tool | Check | Validation |
|------|-------|------------|
| Both | Resume seeded | `resumeIndex/current` exists with `chunkCount > 0` |
| Both | Vertex AI response | Candidates array not empty |
| Fit | Overall score | One of: `Well`, `Partial`, `Poor` |
| Fit | Categories | Each has `name`, `score`, `rationale` |
| Resume | Header | Has `name` and `title` |
| Resume | Summary | Non-empty string |
| Resume | Experience | Array with `title`, `company`, `dateRange`, `bullets` |
| Both | Artifacts stored | Output files written to GCS |

**Back to:** [TODO.md Step 6.4](TODO.md#64-ui-wiring-for-fit-tool-multi-turn-ux--downloads) | [TODO.md Step 7.3](TODO.md#73-ui-wiring-for-custom-resume)

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
| 2026-02-04 | **Step 9.2:** Added Retention Deletion Route tests (55 tests) — expiry detection, prefix validation, cleanup summary, idempotency |
| 2026-02-04 | Updated test counts: 1117 total unit tests (was 1107), 36 test files (was 35) |
| 2026-02-04 | **Step 9.1:** Added Admin Submissions List tests (53 tests) — listing, query options, auth protection |
| 2026-02-04 | Created admin route protection using `(protected)` route group with auth layout |
| 2026-02-04 | Added `/admin/submissions` list view and `/admin/submissions/[id]` detail view |
| 2026-02-04 | Updated test counts: 1107 total unit tests (was 1056), 35 test files (was 34) |
| 2026-02-04 | **Step 8.3:** Added Interview Tool to `npm run test:e2e:real` — real LLM multi-turn conversation test |
| 2026-02-04 | Added `e2e-real-llm-transcript.md` fixture with actual Vertex AI responses |
| 2026-02-04 | **Step 8.3:** Added Interview Tool E2E tests (11 Playwright tests) — UI loading, input behavior, chat flow |
| 2026-02-04 | Updated E2E test counts: 22 Playwright tests, added `channel: "chrome"` for system browser |
| 2026-02-04 | **Step 8.1:** Added Interview Guardrails tests (196 tests) — topic classification, 9 allowed categories, 8 disallowed categories, redirect responses, prompt injection resistance |
| 2026-02-04 | Updated test counts: 1012 total unit tests (was 819), 34 test files (was 33) |
| 2026-02-03 | **Step 7.3:** Added Resume Tool UI E2E tests (6 Playwright tests) — full flow, URL mode, validation, feature cards, error handling |
| 2026-02-03 | **Step 7.3:** Extended `npm run test:e2e:real` to test both Fit and Resume tools with real Vertex AI |
| 2026-02-03 | **Step 7.3:** Added E2E test fixtures `e2e-generated-resume.json` and `e2e-generated-resume.md` |
| 2026-02-03 | Updated test counts: 819 total unit tests (was 816), 11 Playwright tests (was 5) |
| 2026-02-03 | Added test fixtures `web/test-fixtures/resume-generator/` with input (job-description.txt, resume-chunks.json) and output (generated-resume.md, generated-resume.html) examples |
| 2026-02-03 | Added Resume Generator tests (62 tests, Step 7.2) — prompt building, response parsing, markdown generation |
| 2026-02-03 | Added Section 11: Resume Generation Test to smoke-gcp.ts (Step 7.2) — end-to-end Vertex AI resume generation |
| 2026-02-03 | Updated test counts: 816 total tests (was 757), 11 smoke test sections (was 10) |
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
