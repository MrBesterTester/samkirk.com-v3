# Plan: Master Test Suite for samkirk-v3

## Table of Contents

- [Goal](#goal)
- [Methodology Alignment](#methodology-alignment)
- [Task A: Master Test Runner](#task-a-master-test-runner)
  - [Files to Create](#files-to-create)
  - [Files to Modify](#files-to-modify)
  - [Implementation Sequence](#implementation-sequence)
  - [Expected Output](#expected-output)
- [Test Results Archive](#test-results-archive-traceability-layer)
  - [The Problem Today](#the-problem-today)
  - [The Design: Two-Layer Archive](#the-design-two-layer-archive)
  - [Cross-linking Mechanism](#cross-linking-mechanism)
  - [What Happens to TEST-RESULTS.md](#what-happens-to-docstest-resultsmd)
  - [Integration with test-all.ts](#integration-with-test-allts)
- [Task B: Pre-existing Failure Triage](#task-b-pre-existing-failure-triage-separate-follow-up)
  - [Inventory of Pre-existing Failures](#inventory-of-pre-existing-failures)
  - [Triage Questions](#triage-questions-for-task-b)
  - [Potential Outcomes per Test](#potential-outcomes-per-test)
- [What This Plan Does NOT Do](#what-this-plan-does-not-do)

## Goal

Create a single-entry-point test runner that orchestrates all test suites with structured pass/fail/skip output. Pre-existing failures get temporary skip guards so the runner exits cleanly; a separate follow-up task will investigate whether each should be fixed, rewritten, or deleted.

**Two distinct tasks:**
1. **Task A:** Build the master test runner + add skip guards for known-broken tests
2. **Task B (later):** Investigate each pre-existing failure -- fix, rewrite, or delete

## Methodology Alignment

- **Dylan Davis**: "Always use real data and real API calls" -- the runner defaults to `--all` with GCP when credentials are detected; skipping is the fallback, not the default.
- **Matt Maher/do-work**: Tests are the traceability evidence. The runner captures structured output suitable for REQ verification.

---

## Task A: Master Test Runner

### Files to Create

#### 1. `web/scripts/test-all.ts` (~250 lines)

Master test runner. TypeScript (consistent with `smoke-gcp.ts`, `e2e-real-llm.ts`).

**CLI interface:**
```
npm run test:all                     # all suites, auto-detect GCP
npm run test:all -- --unit           # unit tests only
npm run test:all -- --e2e            # Playwright E2E only
npm run test:all -- --e2e-real       # real LLM E2E (requires GCP + seeded resume)
npm run test:all -- --smoke          # GCP smoke tests
npm run test:all -- --no-gcp         # force-skip all GCP-dependent tests
npm run test:all -- --gcp            # force-include GCP tests (fail if creds bad)
npm run test:all -- --interactive    # e2e runs in Playwright UI mode
npm run test:all -- --verbose        # stream child process stdout in real time
```

**Architecture:**
1. Parse CLI args
2. Load `dotenv` from `.env.local`
3. Detect GCP credentials (check env vars + lightweight `bucket.exists()` call)
4. Run selected suites sequentially via `child_process.spawn`
5. Parse test counts from stdout (Vitest pattern: `Tests 1225 passed`; Playwright pattern: `24 passed`)
6. Build test index: scan test files for top-level `describe("...")` / `test.describe("...")` strings via regex; fall back to filename if not found
7. Print colored summary table to console
8. Write `summary.md` + raw logs to `do-work/archive/test-runs/YYYY-MM-DD_HH-MM-SS/` (unless `--no-archive`)
9. Exit 0 if all passed/skipped, exit 1 if any failed

**Suite definitions:**

| Suite | Command | GCP Required |
|-------|---------|-------------|
| Unit Tests | `npx vitest run` | No (individual tests self-skip) |
| E2E Tests | `npx playwright test` | No (individual tests self-skip) |
| E2E Real LLM | `npx tsx scripts/e2e-real-llm.ts` | Yes (skip entire suite) |
| GCP Smoke | `npx tsx scripts/smoke-gcp.ts` | Yes (skip entire suite) |

**No new dependencies needed.** Uses `dotenv` (already in devDeps), `child_process`, `@google-cloud/storage` (already in deps) for credential detection.

### Files to Modify

#### 2. `web/src/app/api/public/[...path]/route.test.ts` -- temporary skip guard

**Problem:** `getPublicBucket()` called at describe-block scope (line 15) throws when GCP env vars are missing.

**Temporary fix (skip guard only, no test logic changes):**
- Add `hasGcpCredentials()` check at top (reads env vars without throwing)
- Move `const bucket = getPublicBucket()` from line 15 into `beforeAll` behind the guard
- Add `it.skipIf(!gcpAvailable)` to all 3 test cases
- Guard `beforeAll`/`afterAll` bodies with early return

**Result:** 3 tests skip cleanly when GCP unavailable; pass when available. No test logic changed.

#### 3. `web/e2e/full-app.spec.ts` -- temporary skip guard

**Problem:** 4 tests fail without GCP credentials.

**Temporary fix (skip guard only):**
- Add `dotenv` config loading at top (Playwright test files don't auto-load `.env.local`)
- Add `const gcpAvailable = Boolean(process.env.GCP_PROJECT_ID)`
- Add `test.skip(!gcpAvailable, "Requires GCP credentials")` as first line in each of the 4 tests

**Result:** 4 tests skip cleanly; 24 tests still pass regardless of GCP status. No test logic changed.

#### 4. `web/package.json`

Add one script:
```json
"test:all": "npx tsx scripts/test-all.ts"
```

#### 5. `.gitignore` addition

```gitignore
do-work/archive/test-runs/*/*.log
```

### Implementation Sequence

| Step | What | Verify |
|------|------|--------|
| 1 | Add skip guard to `route.test.ts` | `npm test` -- 1225+ pass, 0 fail (3 extra skips) |
| 2 | Add skip guard to `full-app.spec.ts` | `npm run test:e2e` -- 24+ pass, 0 fail (4 skips) |
| 3 | Create `test-all.ts` + add `test:all` script + gitignore | `npm run test:all -- --unit --e2e` |
| 4 | Full verification | `npm run test:all` -- archives summary.md to `do-work/archive/test-runs/` |

### Expected Output

With GCP:
```
=== samkirk-v3 Master Test Runner ===

✓ GCP: Credentials verified

  Suite                 Status    Duration    Details
  --------------------------------------------------------------------
  Unit Tests            PASS      12.3s       1225 passed, 6 skipped
  E2E Tests             PASS      45.2s       28 passed
  E2E Real LLM          PASS      180.5s      Fit + Resume + Interview
  GCP Smoke Tests       PASS      92.1s       13/13 sections

  Overall: 4 passed, 0 failed, 0 skipped
```

Without GCP:
```
✗ GCP: Missing required env vars

  Unit Tests            PASS      11.8s       1222 passed, 9 skipped
  E2E Tests             PASS      38.1s       24 passed, 4 skipped
  E2E Real LLM          SKIP      -           Missing GCP credentials
  GCP Smoke Tests       SKIP      -           Missing GCP credentials

  Overall: 2 passed, 0 failed, 2 skipped
```

---

## Test Results Archive (traceability layer)

### The Problem Today

Test evidence is scattered across 5 locations with no clear organization:

| Location | Size | What It Is | Problem |
|----------|------|-----------|---------|
| `docs/TEST-RESULTS.md` | 80KB | Monolithic hand-maintained document | Grows unbounded, awkward to update, no cross-links to work units |
| `do-work/archive/UR-001/REQ-*.md` `## Testing` sections | ~2 lines each | Brief summaries ("build passes cleanly") | Insufficient evidence for auditing |
| `.playwright-mcp/` | 4.6MB | Raw browser console logs | Transient, noisy, gitignored |
| `web/test-fixtures/` | 80KB | Reference input/output examples | Documentation, not test evidence; may become stale |
| `web/test-results/` + `test-results/` | 20KB | Playwright `.last-run.json` + failure artifacts | Metadata only, gitignored |

### The Design: Two-Layer Archive

```
do-work/archive/
├── UR-001/                              # Work unit (existing)
│   ├── REQ-001...REQ-017.md
│   └── verify-report.md
│
└── test-runs/                           # NEW: Test evidence archive
    ├── 2026-02-05_17-30-00/             # PST timestamp (colons -> dashes for FS safety)
    │   ├── summary.md                   # Layer 1: Audit-friendly (committed)
    │   ├── unit.log                     # Layer 2: Raw output (gitignored)
    │   ├── e2e.log
    │   └── smoke.log
    │
    └── 2026-02-06_09-15-00/
        ├── summary.md
        └── ...
```

**Layer 1: `summary.md`** (~50-80 lines, always committed)
```markdown
---
timestamp: 2026-02-05T17:30:00-08:00
triggered_by: UR-001/REQ-017           # Cross-link to work unit (optional)
gcp_available: true
suites_run: [unit, e2e, e2e-real, smoke]
overall: pass
---

# Test Run: 2026-02-05 17:30:00 PST

## Summary

| Suite           | Status | Passed | Failed | Skipped | Duration |
|-----------------|--------|--------|--------|---------|----------|
| Unit Tests      | PASS   | 1225   | 0      | 3       | 12.3s    |
| E2E Tests       | PASS   | 28     | 0      | 0       | 45.2s    |
| E2E Real LLM    | PASS   | 3      | 0      | 0       | 180.5s   |
| GCP Smoke Tests | PASS   | 13     | 0      | 0       | 92.1s    |

## Test Index

### Unit Tests (1225 passed)
| File | Tests | Status | Description |
|------|-------|--------|-------------|
| `web/src/lib/auth.test.ts` | 8 | PASS | Admin email allowlist validation |
| `web/src/lib/session.test.ts` | 12 | PASS | Session ID generation, cookies |
| `web/src/components/Header.test.tsx` | 6 | PASS | Navigation links, responsive menu |
| ... | ... | ... | ... |

### E2E Tests (28 passed)
| File | Tests | Status | Description |
|------|-------|--------|-------------|
| `web/e2e/full-app.spec.ts` | 24 | PASS | Page rendering, navigation, auth gates |
| `web/e2e/fit-tool.spec.ts` | 4 | PASS | Fit tool input, captcha, LLM flow |

## Cross-references
- Triggered by: [UR-001/REQ-017](../UR-001/REQ-017-run-existing-tests.md)
- Raw logs: unit.log, e2e.log (gitignored, local only)
```

**Layer 2: Raw logs** (optional, gitignored by default)
- `unit.log` -- Full vitest stdout/stderr
- `e2e.log` -- Full playwright stdout/stderr
- `smoke.log` -- Full smoke-gcp.ts output
- Useful for local debugging but too noisy for git

### Cross-linking Mechanism

**Forward link (REQ -> test-run):** The `test-all.ts` script accepts `--ref UR-001/REQ-017`. If provided, the `summary.md` frontmatter gets `triggered_by: UR-001/REQ-017`.

**Back-link (test-run -> REQ):** The `## Testing` section in a REQ file can reference:
```markdown
## Testing
See [test-runs/2026-02-05_17-30-00/summary.md](../test-runs/2026-02-05_17-30-00/summary.md)
```

**Ad-hoc runs** (no REQ): `triggered_by` is omitted from frontmatter. The run still gets archived as proof-of-health.

### What Happens to `docs/TEST-RESULTS.md`

No change in Task A. It remains as a historical document. Once the archive is proven out, a future task could retire it or convert it to a pointer: "Test results are now archived in `do-work/archive/test-runs/`."

### Gitignore Addition

```gitignore
# Raw test logs (summary.md is committed, logs are local)
do-work/archive/test-runs/*/*.log
```

### Integration with `test-all.ts`

The master test runner gains one additional responsibility: after all suites complete, write the `summary.md` (and optionally raw logs) to `do-work/archive/test-runs/YYYY-MM-DD_HH-MM-SS/`. This happens automatically on every run.

CLI addition:
```
npm run test:all -- --ref UR-001/REQ-017   # cross-link to work unit
npm run test:all -- --no-archive           # skip writing to archive (dry run)
```

---

## Task B: Pre-existing Failure Triage (separate follow-up)

These 7 tests currently fail without GCP credentials. Task A adds skip guards; Task B investigates each to determine the right long-term fix.

### Inventory of Pre-existing Failures

| # | File | Test Name | Failure Mode | Notes for Triage |
|---|------|-----------|-------------|-----------------|
| 1 | `web/src/app/api/public/[...path]/route.test.ts` | "should serve existing file from GCS via proxy" | `invalid_rapt` -- GCP auth expired/missing | Real GCS integration test. May duplicate what `smoke-gcp.ts` Section 1 (Cloud Storage) already covers. Decide: keep as integration test requiring GCP, or convert to mock-based unit test of the route handler logic. |
| 2 | `web/src/app/api/public/[...path]/route.test.ts` | "should return 404 for missing file" | Same GCP auth failure | Tests route handler 404 logic. Could be tested with a mocked storage client without needing real GCS. |
| 3 | `web/src/app/api/public/[...path]/route.test.ts` | "should block directory traversal attempts" | Same GCP auth failure | Tests input validation. **Does not need GCS at all** -- the traversal check happens before any GCS call. Strong candidate for converting to a pure unit test. |
| 4 | `web/e2e/full-app.spec.ts` | "fit tool page loads" (captcha gate) | Session init calls Firestore, returns 500 | E2E test of the full captcha-bypass -> tool-load flow. Needs Firestore for session. May overlap with `fit-tool.spec.ts` which tests the full fit flow. |
| 5 | `web/e2e/full-app.spec.ts` | "resume tool page loads" (captcha gate) | Same Firestore failure | Same pattern. May overlap with `resume-tool.spec.ts`. |
| 6 | `web/e2e/full-app.spec.ts` | "interview tool page loads" (captcha gate) | Same Firestore failure | Same pattern. May overlap with `interview-tool.spec.ts`. |
| 7 | `web/e2e/full-app.spec.ts` | "session init endpoint responds" | `/api/session/init` returns 500 | API health check that requires Firestore. Decide: keep and require GCP for full E2E, or mock Firestore response, or delete if `smoke-gcp.ts` Section 3 (Session Test) covers this. |

### Triage Questions (for Task B)

For each test, Task B should answer:
1. **Does another test already cover this?** (smoke-gcp sections, dedicated tool spec files)
2. **Can the test be rewritten to not need GCP?** (mock the storage/firestore client)
3. **Is the test valuable enough to keep as a GCP-required integration test?**
4. **Should it be deleted?** (if fully duplicated elsewhere)

### Potential Outcomes per Test

- **Test #3** (directory traversal): Almost certainly should be a pure unit test -- no GCS needed
- **Tests #4-6** (captcha gate loads): May be redundant with `fit-tool.spec.ts`, `resume-tool.spec.ts`, `interview-tool.spec.ts` which test the full tool flows
- **Tests #1-2** (GCS proxy): Evaluate overlap with `smoke-gcp.ts` Section 1
- **Test #7** (session init health): Evaluate overlap with `smoke-gcp.ts` Section 3

---

## What This Plan Does NOT Do

- Does not add new test frameworks or dependencies
- Does not modify existing test logic (only adds skip guards in Task A)
- Does not retire or replace `docs/TEST-RESULTS.md` (historical document stays as-is)
- Does not parallelize suites (they share port 3000; sequential is correct)
- Does not fix/delete pre-existing failures (deferred to Task B)
