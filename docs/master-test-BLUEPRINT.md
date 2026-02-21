# Master Test Suite for samkirk-v3 — Blueprint

This document provides the step-by-step implementation plan for the testing system specified in `docs/master-test-SPECIFICATION.md`.

> **Methodology note:** Per `docs/Dylan-Davis-50plus-method.md`, this blueprint breaks the work into small, iterative steps with testing at each stage.

## Guiding Principles

- **Incremental delivery**: Each step should result in a working, testable state
- **No test logic changes**: Task A only adds skip guards and infrastructure
- **Real data first**: GCP tests run by default when credentials are available
- **Sequential suites**: Suites share port 3000; parallel execution is not safe

---

## Phase 1 — Skip Guards

### 1.1 Add skip guard to `route.test.ts`

- **Goal**: Make `web/src/app/api/public/[...path]/route.test.ts` skip cleanly when GCP is unavailable
- **File to modify**: `web/src/app/api/public/[...path]/route.test.ts`
- **Problem**: `getPublicBucket()` called at describe-block scope (line 15) throws when GCP env vars are missing
- **Implementation**:
  - Add `hasGcpCredentials()` check at top (reads env vars without throwing)
  - Move `const bucket = getPublicBucket()` from line 15 into `beforeAll` behind the guard
  - Add `it.skipIf(!gcpAvailable)` to all 3 test cases
  - Guard `beforeAll`/`afterAll` bodies with early return
- **Result**: 3 tests skip cleanly when GCP unavailable; pass when available. No test logic changed.
- **Test plan**: `npm test` — 1225+ pass, 0 fail (3 extra skips when no GCP)

### 1.2 Add skip guard to `full-app.spec.ts`

- **Goal**: Make 4 GCP-dependent tests in `web/e2e/full-app.spec.ts` skip cleanly
- **File to modify**: `web/e2e/full-app.spec.ts`
- **Problem**: 4 tests fail without GCP credentials
- **Implementation**:
  - Add `dotenv` config loading at top (Playwright test files don't auto-load `.env.local`)
  - Add `const gcpAvailable = Boolean(process.env.GCP_PROJECT_ID)`
  - Add `test.skip(!gcpAvailable, "Requires GCP credentials")` as first line in each of the 4 tests
- **Result**: 4 tests skip cleanly; 24 tests still pass regardless of GCP status. No test logic changed.
- **Test plan**: `npm run test:e2e` — 24+ pass, 0 fail (4 skips when no GCP)

---

## Phase 2 — Master Test Runner

### 2.1 Create `test-all.ts`

- **Goal**: Single-entry-point test runner that orchestrates all suites
- **File to create**: `web/scripts/test-all.ts` (~250 lines)
- **CLI interface**:

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
npm run test:all -- --release        # release-qualifying run (see SPECIFICATION > Release Gate)
npm run test:all -- --ref UR-XXX/REQ-YYY  # cross-link to work unit
npm run test:all -- --no-archive     # skip writing to archive (dry run)
```

- **Architecture**:
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

- **Suite definitions**:

| Suite | Command | GCP Required |
|-------|---------|-------------|
| Unit Tests | `npx vitest run` | No (individual tests self-skip) |
| E2E Tests | `npx playwright test` | No (individual tests self-skip) |
| E2E Real LLM | `npx tsx scripts/e2e-real-llm.ts` | Yes (skip entire suite) |
| GCP Smoke | `npx tsx scripts/smoke-gcp.ts` | Yes (skip entire suite) |

- **No new dependencies needed.** Uses `dotenv` (already in devDeps), `child_process`, `@google-cloud/storage` (already in deps) for credential detection.
- **Test plan**: `npm run test:all -- --unit --e2e` runs both suites and produces output

- **Expected output with GCP**:

```
=== samkirk-v3 Master Test Runner ===

  GCP: Credentials verified

  Suite                 Status    Duration    Details
  --------------------------------------------------------------------
  Unit Tests            PASS      12.3s       1225 passed, 6 skipped
  E2E Tests             PASS      45.2s       28 passed
  E2E Real LLM          PASS      180.5s      Fit + Resume + Interview
  GCP Smoke Tests       PASS      92.1s       13/13 sections

  Overall: 4 passed, 0 failed, 0 skipped
```

- **Expected output without GCP**:

```
  GCP: Missing required env vars

  Unit Tests            PASS      11.8s       1222 passed, 9 skipped
  E2E Tests             PASS      38.1s       24 passed, 4 skipped
  E2E Real LLM          SKIP      -           Missing GCP credentials
  GCP Smoke Tests       SKIP      -           Missing GCP credentials

  Overall: 2 passed, 0 failed, 2 skipped
```

### 2.2 Add `test:all` script to package.json

- **Goal**: Wire up the npm script
- **File to modify**: `web/package.json`
- **Implementation**: Add `"test:all": "npx tsx scripts/test-all.ts"` to scripts
- **Test plan**: `npm run test:all -- --help` (or `--unit`) works

### 2.3 Add gitignore for raw logs

- **Goal**: Keep raw logs out of git, commit only summary.md
- **File to modify**: `.gitignore`
- **Implementation**: Add `do-work/archive/test-runs/*/*.log`
- **Test plan**: `git status` does not show `.log` files after a test run

---

## Phase 3 — Test Results Archive

### 3.1 Implement archive writing in `test-all.ts`

- **Goal**: After all suites complete, write `summary.md` and raw logs to the archive
- **File to modify**: `web/scripts/test-all.ts` (built in Phase 2)
- **Archive directory structure**:

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

- **summary.md template** (~50-80 lines):

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
| `web/src/lib/auth.test.ts` | 8 | PASS | [TEST-042](../../docs/test-catalog.md#test-042) |
| ... | ... | ... | ... |

## Manual Verifications (informational -- not gated)
- [x] VER-001: Visual inspect resume PDF layout
- [x] VER-002: OAuth flow in fresh browser session
- [x] VER-003: ~~Cloud Run deployment serves traffic~~ — N/A, Cloud Run decommissioned; Vercel deploy verified

## Cross-references
- Triggered by: [UR-001/REQ-017](../UR-001/REQ-017-run-existing-tests.md)
- Test catalog: [docs/test-catalog.md](../../docs/test-catalog.md)
- Feature matrix: [docs/feature-test-matrix.md](../../docs/feature-test-matrix.md)
- Raw logs: unit.log, e2e.log (gitignored, local only)
```

- **Cross-linking mechanism**:
  - **Forward link (REQ -> test-run)**: `test-all.ts` accepts `--ref UR-001/REQ-017`. If provided, `summary.md` frontmatter gets `triggered_by: UR-001/REQ-017`.
  - **Back-link (test-run -> REQ)**: The `## Testing` section in a REQ file references `[test-runs/2026-02-05_17-30-00/summary.md](../test-runs/2026-02-05_17-30-00/summary.md)`
  - **Ad-hoc runs**: `triggered_by` is omitted from frontmatter

- **Test plan**: `npm run test:all` — archives `summary.md` to `do-work/archive/test-runs/`; verify with `ls do-work/archive/test-runs/`

---

## Phase 4 — Verification and Integration

### 4.1 Full verification run

- **Goal**: Run the complete master test suite and verify all moving parts
- **Implementation**:
  1. Run `npm run test:all` (auto-detect GCP)
  2. Confirm console output matches expected format
  3. Confirm `summary.md` written to archive
  4. Confirm raw logs written but gitignored
  5. Confirm exit code behavior (0 on pass, 1 on fail)
- **Test plan**: Manual execution and inspection of all outputs

### 4.2 Release mode verification

- **Goal**: Verify `--release` mode behavior
- **Implementation**:
  1. Run `npm run test:all -- --release` with GCP credentials available
  2. Confirm all suites run (no skips)
  3. Confirm `release_candidate: true` in summary.md frontmatter
  4. Confirm manual verification checklist is printed
  5. Confirm exit code is 1 if any suite was skipped
- **Test plan**: Run with and without GCP credentials, verify different behaviors

---

## Phase 5 — Triage (Task B)

### 5.1 Triage `route.test.ts` tests (3 tests)

- **Goal**: Evaluate tests #1-3 from the pre-existing failure inventory
- **Inventory**:

| # | Test Name | Failure Mode | Notes |
|---|-----------|-------------|-------|
| 1 | "should serve existing file from GCS via proxy" | `invalid_rapt` — GCP auth | Real GCS integration test. May duplicate `smoke-gcp.ts` Section 1 (Cloud Storage). Decide: keep as integration test, or convert to mock-based unit test. |
| 2 | "should return 404 for missing file" | Same GCP auth failure | Tests route handler 404 logic. Could be tested with a mocked storage client. |
| 3 | "should block directory traversal attempts" | Same GCP auth failure | Tests input validation. **Does not need GCS at all** — the traversal check happens before any GCS call. Strong candidate for converting to pure unit test. |

- **Triage questions for each**:
  1. Does another test already cover this? (smoke-gcp sections, dedicated tool spec files)
  2. Can the test be rewritten to not need GCP? (mock the storage/firestore client)
  3. Is the test valuable enough to keep as a GCP-required integration test?
  4. Should it be deleted? (if fully duplicated elsewhere)

- **Expected outcomes**:
  - Test #3 (directory traversal): Convert to pure unit test — no GCS needed
  - Tests #1-2: Evaluate overlap with `smoke-gcp.ts` Section 1
- **Test plan**: After triage decisions, run `npm run test:all` and confirm no regressions

### 5.2 Triage `full-app.spec.ts` tests (4 tests)

- **Goal**: Evaluate tests #4-7 from the pre-existing failure inventory
- **Inventory**:

| # | Test Name | Failure Mode | Notes |
|---|-----------|-------------|-------|
| 4 | "fit tool page loads" (captcha gate) | Session init calls Firestore, returns 500 | May overlap with `fit-tool.spec.ts` |
| 5 | "resume tool page loads" (captcha gate) | Same Firestore failure | May overlap with `resume-tool.spec.ts` |
| 6 | "interview tool page loads" (captcha gate) | Same Firestore failure | May overlap with `interview-tool.spec.ts` |
| 7 | "session init endpoint responds" | `/api/session/init` returns 500 | May overlap with `smoke-gcp.ts` Section 3 (Session Test) |

- **Expected outcomes**:
  - Tests #4-6 (captcha gate loads): Likely redundant with dedicated tool spec files
  - Test #7 (session init health): Evaluate overlap with `smoke-gcp.ts` Section 3
- **Test plan**: After triage decisions, run `npm run test:all` and confirm no regressions

---

## Phase 6 — Documentation

### 6.1 Create test catalog

- **Goal**: Create `docs/test-catalog.md` with metadata for all tests
- **File to create**: `docs/test-catalog.md`
- **Implementation**:
  - Catalog every existing test using the metadata format from SPECIFICATION section 5.3
  - Assign sequential TEST-XXX IDs
  - Include: headline, description, type, suite, features covered, implementation file, inputs, expected outputs, how to run, GCP required
- **Test plan**: Every test file has a corresponding catalog entry; every entry has all required fields

### 6.2 Create feature-test matrix

- **Goal**: Create `docs/feature-test-matrix.md` mapping features to tests
- **File to create**: `docs/feature-test-matrix.md`
- **Implementation**:
  - Extract features from `docs/SPECIFICATION.md`
  - Map each feature to its test(s) and/or verification(s) from the catalog
  - Identify coverage gaps (features with no tests)
  - Format per SPECIFICATION section 5.4 rules
- **Test plan**: No feature row is empty; every test appears in at least one feature row

### 6.3 Create verification registry

- **Goal**: Create `docs/verification-registry.md` for manual verification procedures
- **File to create**: `docs/verification-registry.md`
- **Implementation**:
  - Document initial verifications: VER-001 (PDF layout), VER-002 (OAuth flow), VER-003 (Cloud Run deployment)
  - Use the metadata format from SPECIFICATION section 5.3 (verification variant)
  - Include step-by-step procedures for each
- **Test plan**: The master test runner's `--release` output references these entries

---

## Phase 7 — Developer Workflow (Developer Guide)

This phase covers the day-to-day workflows for test engineering. The primary approach is **automation via do-work** — the developer describes what needs to happen; do-work's sub-agents handle suite selection, file placement, test writing, catalog/matrix updates, verification, and commits. Manual steps are reserved for the things only a human can do: visual inspection, judgment calls, and release sign-off.

For full do-work documentation, see [Matts-integration-with-Dylan-plan-samkirk-v3.md](Matts-integration-with-Dylan-plan-samkirk-v3.md).

### 7.1 How do-work handles test work

Every do-work request goes through a built-in pipeline: **triage > explore > build > verify > commit**. The **verify phase** is particularly important for test work:

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

### 7.2 Writing a new test

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

### 7.3 Fixing or rewriting an existing test

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

The sub-agent follows the [Guiding Principles for Triage](master-test-SPECIFICATION.md#6-guiding-principles-for-triage) because they're in the SPECIFICATION, which it reads during its explore phase. Specifically:

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

### 7.4 Triage work (Task B) via do-work

The 7 pre-existing failures from Task B can be processed as a batch:

```bash
# Option 1: Ad-hoc requests (one per test or grouped by file)
do work triage route.test.ts tests 1-3: test 1 may duplicate smoke-gcp Section 1,
  test 2 could be mock-based, test 3 should definitely be a pure unit test.
  Follow the guiding principles in docs/master-test-SPECIFICATION.md.

do work triage full-app.spec.ts tests 4-7: tests 4-6 may be redundant with
  dedicated tool spec files, test 7 may overlap with smoke-gcp Section 3.
  Evaluate and recommend keep/rewrite/delete for each.

# Option 2: Formalize as a TODO cycle for full traceability
/ingest-todo docs/master-test-TODO.md
do work run
/sync-todo docs/master-test-TODO.md
```

Use `do work verify` after capturing the requests to confirm the REQs didn't lose any of the triage context before processing.

### 7.5 Performing a manual verification

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

### 7.6 Running tests

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

### 7.7 Planned test work (from a TODO cycle)

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

### 7.8 Manual fallback

For steps that need a human in the loop (visual testing, interactive debugging, judgment calls about test design):

```bash
start step 3.2 master-test       # begin a step manually with full doc context
continue step 3.2 master-test    # resume where you left off
```

These commands read the SPECIFICATION, BLUEPRINT, and TODO for context, then walk through the step interactively. Use this when autonomous processing isn't appropriate — but prefer do-work for everything else.

### 7.9 Create Developer Guide (`README_dev_guide.md`)

- **Goal**: Create a standalone developer guide at the project root that consolidates the day-to-day test workflows from this blueprint into a reference document
- **File to create**: `README_dev_guide.md` (project root)
- **Content** (distilled from sections 7.1-7.8 above):
  - How do-work handles test work (pipeline overview)
  - Writing a new test (do-work commands + conventions + suite reference table)
  - Fixing or rewriting an existing test (with guiding principles reference)
  - Triage workflows
  - Performing a manual verification (release checklist + failure handling)
  - Running tests (release vs debugging commands)
  - Planned test work from a TODO cycle
  - Manual fallback (`start step` / `continue step`)
- **Key difference from BLUEPRINT Phase 7**: The dev guide is a **reference document** for daily use, not an implementation plan. It should be written in second-person ("To write a new test, run...") and assume the reader has no context on the Dylan Davis methodology.
- **Test plan**: File exists at project root; all commands in the guide are accurate and match the implemented test runner

### 7.10 Update root `README.md` with dev guide link

- **Goal**: Add a link to `README_dev_guide.md` from the existing root `README.md`
- **File to modify**: `README.md` (project root — already exists with project overview, testing section, methodology section)
- **Implementation**: Add a link `[Developer Guide](README_dev_guide.md)` to the Testing section or Key docs list. Also update the Testing section's test counts and commands to match the new `npm run test:all` runner.
- **Test plan**: Link resolves correctly from project root

### 7.11 Retention policy (deferred)

**Deferred to a future task.** Once the test-run archive has accumulated enough runs to validate the design, define a retention policy. Sketch:

- **Release-qualifying runs** (`release_candidate: true`): Keep indefinitely
- **Ad-hoc runs**: Keep the last N runs (e.g., 20) or runs newer than M days (e.g., 90 days)
- **Raw logs** (`.log` files): Already gitignored. Local cleanup is the developer's responsibility
- **Implementation**: A `test-all.ts --prune` subcommand that applies the retention policy with `--confirm` to actually delete (safe by default)
