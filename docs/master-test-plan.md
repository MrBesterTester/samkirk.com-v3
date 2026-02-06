> **Superseded.** This document has been restructured into the Dylan Davis three-document set:
> - [`master-test-SPECIFICATION.md`](master-test-SPECIFICATION.md) — What we're building
> - [`master-test-BLUEPRINT.md`](master-test-BLUEPRINT.md) — How to build it
> - [`master-test-TODO.md`](master-test-TODO.md) — Roadmap with checkboxes
>
> This file is kept for historical reference. Use the documents above for active work.

# Plan: Master Test Suite for samkirk-v3 (Historical)

## Table of Contents

- [Goal](#goal)
- [Methodology Alignment](#methodology-alignment)
- [Traceability Model](#traceability-model)
  - [Linkage Structure (DAG)](#linkage-structure-dag)
  - [Tests vs Verifications](#tests-vs-verifications)
  - [Test and Verification Metadata](#test-and-verification-metadata)
  - [Feature-Test Matrix](#feature-test-matrix)
  - [Release Gate](#release-gate)
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
  - [Retention and Archiving](#retention-and-archiving)
- [Task B: Pre-existing Failure Triage](#task-b-pre-existing-failure-triage-separate-follow-up)
  - [Guiding Principles for Triage](#guiding-principles-for-triage)
  - [Inventory of Pre-existing Failures](#inventory-of-pre-existing-failures)
  - [Triage Questions](#triage-questions-for-task-b)
  - [Potential Outcomes per Test](#potential-outcomes-per-test)
- [What This Plan Does NOT Do](#what-this-plan-does-not-do)
- [Developer Guide](#developer-guide)
  - [How do-work Handles Test Work](#how-do-work-handles-test-work)
  - [Writing a New Test](#writing-a-new-test)
  - [Fixing or Rewriting an Existing Test](#fixing-or-rewriting-an-existing-test)
  - [Triage Work (Task B)](#triage-work-task-b-via-do-work)
  - [Performing a Manual Verification](#performing-a-manual-verification)
  - [Running Tests](#running-tests)
  - [Planned Test Work](#planned-test-work-from-a-todomd-cycle)
  - [Manual Fallback](#manual-fallback)

## Goal

Create a single-entry-point test runner that orchestrates all test suites with structured pass/fail/skip output. Pre-existing failures get temporary skip guards so the runner exits cleanly; a separate follow-up task will investigate whether each should be fixed, rewritten, or deleted.

**Two distinct tasks:**
1. **Task A:** Build the master test runner + add skip guards for known-broken tests
2. **Task B (later):** Investigate each pre-existing failure -- fix, rewrite, or delete

## Methodology Alignment

- **Dylan Davis**: "Always use real data and real API calls" -- the runner defaults to `--all` with GCP when credentials are detected; skipping is the fallback, not the default.
- **Matt Maher/do-work**: Tests are the traceability evidence. The runner captures structured output suitable for REQ verification.

---

## Traceability Model

This section defines the relationships between features, requirements, tests, verifications, test runs, and raw evidence. Understanding this structure is a prerequisite for the archive design and runner output format.

### Linkage Structure (DAG)

The traceability structure is a **Directed Acyclic Graph (DAG)**, not a tree. There is no single root. Features and ad-hoc test runs coexist as independent top-level entities.

```
Features ←──(many-to-many)──→ Tests / Verifications
REQs     ←──(many-to-many)──→ Tests / Verifications
REQs     ←──(one-to-many)───→ Test Runs
Test Runs ←──(one-to-many)──→ Suite Results
Suite Results ←(one-to-many)→ Raw Logs
```

**Key properties:**
- A single test can satisfy multiple features (e.g., a session test covers both the "authentication" and "rate limiting" features).
- A single feature may require tests from multiple suites (e.g., "resume tool" needs unit tests for parsing, E2E tests for the UI flow, and smoke tests for GCS artifact storage).
- A test run may be triggered by a REQ, or may be ad-hoc (no REQ). Both are valid top-level evidence.
- Multiple REQs can reference the same test run (e.g., a release-qualifying run satisfies both a "run tests" REQ and a "verify deployment" REQ).
- Raw logs are terminal nodes -- they can be linked **to** but generally not linked **from** (no embedded outbound links).

**Reading order (table-of-contents style):** The DAG is organized in layers. Navigate top-down for understanding, bottom-up for evidence:

| Layer | Contains | Links to |
|-------|----------|----------|
| Features | Feature descriptions from SPECIFICATION.md | Tests/Verifications that cover them |
| REQs | Work unit requirements | Tests/Verifications + Test Runs |
| Tests / Verifications | Test catalog entries | Implementation files + Feature(s) covered |
| Test Runs | Timestamped execution records (`summary.md`) | Suite Results + triggering REQ (if any) |
| Suite Results | Per-suite pass/fail/skip within a run | Raw Logs |
| Raw Logs | Full stdout/stderr (`*.log`, gitignored) | (terminal -- no outbound links) |

### Tests vs Verifications

**Tests** are implemented in code and run without manual assistance. They are the domain of test engineering.

| Property | Tests |
|----------|-------|
| Execution | Automated (`vitest`, `playwright`, custom scripts) |
| Triggered by | `npm run test:all` or individual suite commands |
| Evidence | Pass/fail counts, raw logs, archived `summary.md` |
| Examples | Unit tests, E2E browser tests, GCP smoke tests |

**Verifications** are largely manual procedures, possibly with utility code to assist. They are the domain of QA (Quality Assurance).

| Property | Verifications |
|----------|---------------|
| Execution | Manual, with optional scripted helpers |
| Triggered by | A human following a documented procedure |
| Evidence | A signed-off checklist entry or narrative report |
| Examples | "Visually inspect resume PDF layout", "Confirm OAuth flow in a fresh browser", "Verify Cloud Run deployment serves traffic" |

Both tests and verifications are first-class entries in the traceability graph. The master test runner handles tests; verifications are tracked in the **verification registry** (see below) and printed as a checklist after automated suites complete.

**Verification registry** (future file: `docs/verification-registry.md`):

Each verification entry follows the same metadata format as tests (see next section). The master test runner, after printing automated results, outputs:

```
  Manual Verifications Pending:
  [ ] VER-001: Visual inspect resume PDF layout (see docs/verification-registry.md#VER-001)
  [ ] VER-002: OAuth flow in fresh browser session
  [ ] VER-003: Cloud Run deployment serves traffic
```

This is informational only -- the runner does not block on verifications.

### Test and Verification Metadata

Every test and verification must be documented with structured metadata. This metadata lives in a **test catalog** (`docs/test-catalog.md`, created in a follow-up task) and is the authoritative source for test descriptions. The `summary.md` test index links into the catalog rather than duplicating full descriptions.

**Required fields for each entry:**

```markdown
### TEST-042: Admin email allowlist validation

**Headline:** Verifies that only emails on the admin allowlist can access admin routes.

**Description:** Tests the `isAdminEmail()` function against the configured allowlist,
including edge cases (case sensitivity, empty string, malformed emails). Confirms that
the middleware rejects non-admin emails with 403.

**Type:** Test (automated)
**Suite:** Unit Tests (Vitest)
**Features covered:** Authentication, Admin Access Control
**Implementation:** `web/src/lib/auth.test.ts`
**Inputs:** A set of email strings (valid admin, valid non-admin, edge cases)
**Expected outputs:** Boolean return values from `isAdminEmail()`; 403 responses from middleware
**How to run:** `npx vitest run src/lib/auth.test.ts`
**GCP required:** No
```

```markdown
### VER-003: Cloud Run deployment serves traffic

**Headline:** Confirms the deployed Cloud Run service responds to HTTP requests.

**Description:** After a new deployment, manually verify that the production URL returns
a 200 response with the expected homepage content. Check that static assets load and
that the service is not returning stale cached content.

**Type:** Verification (manual)
**Features covered:** Deployment, Infrastructure
**Procedure:**
1. Open the production URL in an incognito browser window
2. Confirm the homepage loads with current version indicator
3. Navigate to each tool page and confirm they render
4. Check browser devtools Network tab for failed requests
**Inputs:** Production URL, expected version string
**Expected outputs:** All pages load, no 4xx/5xx errors, correct version displayed
**GCP required:** Yes (production environment)
```

The test catalog is the single source of truth for "what does this test do." The `summary.md` test index references it:

```markdown
| File | Tests | Status | Catalog Ref |
|------|-------|--------|-------------|
| `web/src/lib/auth.test.ts` | 8 | PASS | [TEST-042](../../docs/test-catalog.md#test-042-admin-email-allowlist-validation) |
```

### Feature-Test Matrix

A **feature-test matrix** (`docs/feature-test-matrix.md`, created in a follow-up task) maps every feature from SPECIFICATION.md to the tests and verifications that cover it. This ensures "all features must be tested" is auditable.

**Format:**

```markdown
# Feature-Test Matrix

| Feature | Tests | Verifications | Coverage Notes |
|---------|-------|---------------|----------------|
| Resume Parsing | TEST-010, TEST-011, TEST-012 | -- | Unit tests for parser logic |
| Resume Tool UI | TEST-050, TEST-051 | VER-004 | E2E for flow, manual for PDF layout |
| Fit Analysis | TEST-020..TEST-025 | -- | Unit + E2E Real LLM |
| Authentication | TEST-042, TEST-043 | VER-002 | Unit for logic, manual for OAuth |
| GCS Artifact Storage | TEST-060 | VER-003 | Smoke test + deployment check |
| Session Management | TEST-070, TEST-071 | -- | Unit + smoke |
| Rate Limiting | TEST-080 | -- | Unit tests |
| Admin Dashboard | TEST-090..TEST-095 | VER-005 | E2E + manual visual check |
```

**Rules:**
- Every feature row must have at least one test OR verification. Empty rows are gaps that must be addressed.
- A test or verification can appear in multiple feature rows (many-to-many).
- The "Coverage Notes" column explains why the listed tests are sufficient.

### Release Gate

A release-qualifying test run is distinct from an ad-hoc debugging run. The master test runner supports a `--release` flag:

```
npm run test:all -- --release              # release-qualifying run
npm run test:all -- --release --ref UR-002/REQ-001  # with REQ cross-link
```

**`--release` behavior:**
- Implies `--gcp` (GCP tests are mandatory; fails if credentials are bad rather than skipping)
- All suites must run (no `--unit`-only or `--e2e`-only filtering)
- No suite may be skipped -- any skip is treated as a failure
- Adds `release_candidate: true` to `summary.md` frontmatter
- Prints the manual verification checklist from the verification registry
- Exit code is 1 if any suite failed OR any suite was skipped

**REQ for release:** A single REQ (e.g., "Run master test suite for release") is sufficient to trigger and document a release-qualifying run. The `summary.md` with `release_candidate: true` is the evidence that tests passed prior to release.

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
npm run test:all -- --release        # release-qualifying run (see Traceability Model > Release Gate)
```

**Architecture:**
1. Parse CLI args (including `--release` which implies `--gcp` and all-suites)
2. Load `dotenv` from `.env.local`
3. Detect GCP credentials (check env vars + lightweight `bucket.exists()` call)
4. If `--release`: fail immediately if GCP credentials are missing (no skip fallback)
5. Run selected suites sequentially via `child_process.spawn`
6. Parse test counts from stdout (Vitest pattern: `Tests 1225 passed`; Playwright pattern: `24 passed`)
7. Build test index: scan test files for top-level `describe("...")` / `test.describe("...")` strings via regex; link to test catalog entries where available; fall back to filename if not found
8. Print colored summary table to console
9. If `--release`: print manual verification checklist from verification registry
10. Write `summary.md` + raw logs to `do-work/archive/test-runs/YYYY-MM-DD_HH-MM-SS/` (unless `--no-archive`); include `release_candidate: true` in frontmatter if `--release`
11. Exit 0 if all passed/skipped, exit 1 if any failed (in `--release` mode, skipped counts as failed)

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
release_candidate: true                 # Present only when --release flag used
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
| File | Tests | Status | Catalog Ref |
|------|-------|--------|-------------|
| `web/src/lib/auth.test.ts` | 8 | PASS | [TEST-042](../../docs/test-catalog.md#test-042-admin-email-allowlist-validation) |
| `web/src/lib/session.test.ts` | 12 | PASS | [TEST-070](../../docs/test-catalog.md#test-070-session-id-generation) |
| `web/src/components/Header.test.tsx` | 6 | PASS | [TEST-090](../../docs/test-catalog.md#test-090-navigation-links-responsive-menu) |
| ... | ... | ... | ... |

### E2E Tests (28 passed)
| File | Tests | Status | Catalog Ref |
|------|-------|--------|-------------|
| `web/e2e/full-app.spec.ts` | 24 | PASS | [TEST-050](../../docs/test-catalog.md#test-050-page-rendering-navigation) |
| `web/e2e/fit-tool.spec.ts` | 4 | PASS | [TEST-020](../../docs/test-catalog.md#test-020-fit-tool-e2e-flow) |

## Manual Verifications (informational -- not gated)
- [ ] VER-001: Visual inspect resume PDF layout
- [ ] VER-002: OAuth flow in fresh browser session
- [ ] VER-003: Cloud Run deployment serves traffic

## Cross-references
- Triggered by: [UR-001/REQ-017](../UR-001/REQ-017-run-existing-tests.md)
- Test catalog: [docs/test-catalog.md](../../docs/test-catalog.md)
- Feature matrix: [docs/feature-test-matrix.md](../../docs/feature-test-matrix.md)
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

### Retention and Archiving

**Deferred to a future task.** Once the test-run archive has accumulated enough runs to validate the design, define a retention policy. Sketch:

- **Release-qualifying runs** (`release_candidate: true`): Keep indefinitely (or at least for the supported release history). These are audit evidence.
- **Ad-hoc runs**: Keep the last N runs (e.g., 20) or runs newer than M days (e.g., 90 days). Older ad-hoc runs can be deleted.
- **Raw logs** (`.log` files): Already gitignored. Local cleanup is the developer's responsibility. The runner could accept a `--clean-logs-older-than 30d` flag to prune old local logs.
- **Implementation:** A `test-all.ts --prune` subcommand that applies the retention policy. Should print what it would delete and require `--confirm` to actually delete (safe by default).

---

## Task B: Pre-existing Failure Triage (separate follow-up)

These 7 tests currently fail without GCP credentials. Task A adds skip guards; Task B investigates each to determine the right long-term fix.

### Guiding Principles for Triage

1. **Real-data tests supersede mock-data tests for the same behavior.** If a real-data test (e.g., `smoke-gcp.ts` Section 1 testing Cloud Storage) covers the same behavior as a mock-based unit test, the mock-based test is not required for release-qualifying coverage. The real-data test is the higher-fidelity evidence.

2. **Mock-data tests remain valuable for debugging.** Even when a real-data test exists, a mock-based test that exercises the same code path is useful for quickly isolating failures without needing GCP credentials. Mock tests should never be summarily deleted just because a real-data equivalent exists.

3. **The right outcome is not always "fix."** For each pre-existing failure, the valid outcomes are:
   - **Keep as-is** (GCP-required integration test, skip guard stays)
   - **Rewrite** (convert to mock-based unit test if GCP is unnecessary for the behavior under test)
   - **Delete** (if fully duplicated by another test with equal or greater fidelity)

4. **Every test that survives triage must appear in the test catalog and feature-test matrix.** This is how we ensure "all features are tested" remains true after triage.

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
- Does not create `docs/test-catalog.md` (follow-up task; the runner links to it when it exists, gracefully omits links when it doesn't)
- Does not create `docs/feature-test-matrix.md` (follow-up task; requires cataloging features from SPECIFICATION.md)
- Does not create `docs/verification-registry.md` (follow-up task; manual verifications are listed here once identified)
- Does not implement the retention/pruning policy (deferred until enough runs accumulate to validate the design)

---

## Developer Guide

This section covers the day-to-day workflows for test engineering. The primary approach is **automation via do-work** -- the developer describes what needs to happen; do-work's sub-agents handle suite selection, file placement, test writing, catalog/matrix updates, verification, and commits. Manual steps are reserved for the things only a human can do: visual inspection, judgment calls, and release sign-off.

For full do-work documentation, see [Matts-integration-with-Dylan-plan-samkirk-v3.md](Matts-integration-with-Dylan-plan-samkirk-v3.md).

### How do-work Handles Test Work

Every do-work request goes through a built-in pipeline: **triage → explore → build → verify → commit**. The **verify phase** is particularly important for test work:

- It runs the tests relevant to the changes just made
- It writes new tests if the request involved new features, bug fixes, or behavioral changes
- If tests fail, it loops back to implementation and retries
- Results are recorded in the REQ's `## Testing` section

This means the sub-agent that processes a test-related REQ will automatically:
1. Explore the codebase to find the right suite, framework, file location, and existing patterns
2. Write the test following project conventions (strict TypeScript, skip guards for GCP, descriptive names)
3. Add the test catalog entry (`docs/test-catalog.md`) and update the feature-test matrix (`docs/feature-test-matrix.md`)
4. Run the test and confirm it passes
5. Commit everything together

The developer's job is to **describe what needs testing** and **review the result**.

### Writing a New Test

```bash
# Terminal 1 (planning): describe the test
do work write tests for the rate limiting middleware - cover bypass for admin users,
  per-IP limits, and the 429 response format. Use real Firestore if GCP is available,
  with skip guard fallback.

# Verify the REQ was captured correctly
do work verify

# Terminal 2 (build): process the queue
do work run
```

The sub-agent triages the request (likely Route B or C), explores the codebase to discover the existing test patterns, and produces the test file, catalog entry, and matrix update. Its built-in verify phase confirms the tests pass before committing.

**After the run completes, the developer reviews:**

```bash
# Check the archived REQ for what was done
# (the REQ's ## Testing section shows test results)

# Run the master suite to confirm no regressions
npm run test:all
```

**Conventions the sub-agent follows** (these are in CLAUDE.md and the test catalog metadata format, so the sub-agent picks them up during its explore phase):

- Real data preferred over mocks; skip guards for GCP-dependent tests
- Mock-based versions are separate tests, not replacements for real-data tests
- Strict TypeScript, no `any`
- Descriptive `describe`/`test` names (parsed by the master runner)

**Suite reference** (for the developer's awareness, not manual selection):

| Behavior under test | Suite | Framework |
|---------------------|-------|-----------|
| Pure functions, utilities, components | Unit (`web/src/**/*.test.ts`) | Vitest |
| User-facing browser flows | E2E (`web/e2e/*.spec.ts`) | Playwright |
| LLM-dependent flows with real API calls | E2E Real LLM (`web/scripts/e2e-real-llm.ts`) | Custom script |
| GCP service integrations | GCP Smoke (`web/scripts/smoke-gcp.ts`) | Custom script |

### Fixing or Rewriting an Existing Test

```bash
# Fix a broken test
do work fix the directory traversal test in route.test.ts to not require GCP -
  the traversal check happens before any GCS call, so it should be a pure unit test

# Rewrite a test that's redundant with higher-fidelity coverage elsewhere
do work rewrite full-app.spec.ts "session init endpoint responds" -
  smoke-gcp.ts Section 3 already covers this with real Firestore.
  Convert to a mock-based unit test of the route handler's error responses,
  keeping the real-data test in smoke-gcp for release qualification.

# Verify the REQs captured your intent correctly before processing
do work verify
```

The sub-agent follows the [Guiding Principles for Triage](#guiding-principles-for-triage) because they're in this document, which it reads during its explore phase. Specifically:

- It will not delete a mock test just because a real-data equivalent exists (both can coexist)
- It will not leave a feature row empty in the matrix after deleting a test
- It will update the catalog and matrix as part of the same commit
- Its built-in verify phase confirms the fix/rewrite passes

**Deletion** is the one case where developer judgment matters before the sub-agent acts. Include explicit instructions in the request:

```bash
do work delete full-app.spec.ts tests 4-6 (captcha gate loads) -
  these are fully covered by fit-tool.spec.ts, resume-tool.spec.ts,
  and interview-tool.spec.ts. Remove catalog entries TEST-054 through TEST-056
  and update the feature-test matrix. Confirm no feature rows become empty.
```

### Triage Work (Task B) via do-work

The 7 pre-existing failures from Task B can be processed as a batch:

```bash
# Option 1: Ad-hoc requests (one per test or grouped by file)
do work triage route.test.ts tests 1-3: test 1 may duplicate smoke-gcp Section 1,
  test 2 could be mock-based, test 3 should definitely be a pure unit test.
  Follow the guiding principles in docs/master-test-plan.md.

do work triage full-app.spec.ts tests 4-7: tests 4-6 may be redundant with
  dedicated tool spec files, test 7 may overlap with smoke-gcp Section 3.
  Evaluate and recommend keep/rewrite/delete for each.

# Option 2: Formalize as a TODO cycle for full traceability
/ingest-todo docs/test-triage-TODO.md
do work run
/sync-todo
```

Use `do work verify` after capturing the requests to confirm the REQs didn't lose any of the triage context before processing.

### Performing a Manual Verification

Manual verifications are the one area where the developer does the hands-on work. They are tracked in `docs/verification-registry.md`.

**During a release run** (`npm run test:all -- --release`), the runner prints a checklist:

```
  Manual Verifications Pending:
  [ ] VER-001: Visual inspect resume PDF layout (see docs/verification-registry.md#VER-001)
  [ ] VER-002: OAuth flow in fresh browser session
  [ ] VER-003: Cloud Run deployment serves traffic
```

For each verification: open the registry entry, follow the procedure, and record the result (date, name, pass/fail, observations) in the registry or in the test run's `summary.md`.

If a verification **fails**, drop it into do-work rather than investigating manually:

```bash
do work VER-002 failed: OAuth flow redirects to a 404 after Google consent screen.
  Expected redirect to /dashboard. Investigate and fix.
```

**Creating a new verification** can also go through do-work:

```bash
do work create a new manual verification VER-004 for visual inspection of the
  interview tool results page. Add it to docs/verification-registry.md with full
  metadata and update docs/feature-test-matrix.md for the Interview Tool feature.
```

### Running Tests

**For a release:**

```bash
# Full release-qualifying suite (GCP required, no skips allowed)
npm run test:all -- --release --ref UR-XXX/REQ-YYY

# Review the archived summary (path printed by the runner)
# Work through the manual verification checklist
# Commit the evidence
git add do-work/archive/test-runs/ && git commit -m "test: release run for UR-XXX/REQ-YYY"
```

**For debugging:**

```bash
npm run test:all -- --unit              # quick unit tests only
npm run test:all -- --no-gcp            # unit + E2E without GCP
npm run test:all                        # full run, auto-detect GCP
npm run test:all -- --e2e --verbose     # stream E2E output for debugging
```

### Planned Test Work (from a TODO.md Cycle)

When test engineering is part of a larger TODO cycle, it flows through the standard Dylan Davis bridge without any special handling:

```bash
# Ingest the TODO (test steps become REQ files automatically)
/ingest-todo docs/TODO.md

# Verify the REQs captured the test steps correctly
do work verify

# Process the queue (second terminal)
do work run

# Sync completed checkboxes back to TODO.md
/sync-todo

# Confirm everything passes
npm run test:all
```

### Manual Fallback

For steps that need a human in the loop (visual testing, interactive debugging, judgment calls about test design):

```bash
start step 3.2 v2-upgrade       # begin a step manually with full doc context
continue step 3.2 v2-upgrade    # resume where you left off
```

These commands read the SPECIFICATION, BLUEPRINT, and TODO for context, then walk through the step interactively. Use this when autonomous processing isn't appropriate -- but prefer do-work for everything else.
