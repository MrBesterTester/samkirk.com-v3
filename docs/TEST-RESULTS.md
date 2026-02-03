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
- [Unit Tests](#unit-tests)
- [Lint Check](#lint-check)
- [Notes](#notes)
- [Revision History](#revision-history)

---

## Summary

| Category | Result | Details |
|----------|--------|---------|
| GCP Smoke Tests | **PASS** | 9/9 sections passed |
| Unit Tests | **PASS** | 482/482 tests passed |
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

## Unit Tests

**Command:** `cd web && npm test -- --run`

**Framework:** Vitest + React Testing Library

### Results

```
Test Files  27 passed (27)
     Tests  482 passed (482)
  Duration  9.17s
```

### Test File Breakdown

| File | Tests | Coverage Area |
|------|-------|---------------|
| `spend-cap.test.ts` | 60 | Spend cap enforcement (Step 5.3) |
| `rate-limit.test.ts` | 50 | Rate limiting utility (Step 5.2) |
| `submission.test.ts` | 50 | Submission CRUD helpers (Step 4.1) |
| `resume-chunker.test.ts` | 49 | Resume chunking for RAG (Step 3.3) |
| `markdown-renderer.test.ts` | 56 | Markdown to HTML rendering (Step 4.2) |
| `session.test.ts` | 34 | Session management (Step 2.2) |
| `artifact-bundler.test.ts` | 30 | Zip bundle generation (Step 4.2) |
| `dance-menu-upload.test.ts` | 29 | Dance menu validation (Step 3.4) |
| `resume-upload.test.ts` | 22 | Resume upload validation (Step 3.2) |
| `captcha.test.ts` | 14 | reCAPTCHA verification (Step 5.1) |
| `auth.test.ts` | 11 | Admin authentication (Step 3.1) |
| `firestore.test.ts` | 10 | Firestore path helpers |
| `storage.test.ts` | 10 | GCS path helpers |
| `env.test.ts` | 3 | Environment validation |
| Component tests | 44 | UI components (Header, Footer, etc.) |
| Page tests | 29 | Page rendering |
| Route tests | 3 | API route integration |

---

## Lint Check

**Command:** `cd web && npm run lint`

**Result:** Clean (0 errors, 0 warnings)

---

## Notes

### What These Tests Do NOT Cover

1. **Real Vertex AI calls** — Spend cap tests simulate cost recording but don't make actual LLM requests (that comes in Phase 6)
2. **Real reCAPTCHA widget** — Unit tests mock the verification; manual E2E test required (see GCP-SETUP.md § 8.3)
3. **OAuth login flow** — Unit tests mock NextAuth; manual smoke test required
4. **Public HTTP access** — Org policy blocks `allUsers` access; proxy route handles this

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
| 2026-02-03 | Initial document with Phase 0–5 test results |
