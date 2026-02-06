# Master Test Suite for samkirk-v3 — Specification

## 1) Summary

Define a unified testing and verification system for samkirk-v3 that provides:

1. **A single-entry-point test runner** that orchestrates all test suites with structured pass/fail/skip output
2. **A traceability model** linking features, requirements, tests, verifications, and evidence
3. **A test results archive** for persistent, auditable test evidence
4. **A triage process** for pre-existing failures (fix, rewrite, or delete)
5. **Documentation artifacts** (test catalog, feature-test matrix, verification registry)

**Two distinct task tracks:**
- **Task A:** Build the master test runner + skip guards for known-broken tests
- **Task B (later):** Investigate each pre-existing failure — fix, rewrite, or delete

## 2) Goals

- Pre-existing failures get temporary skip guards so the runner exits cleanly
- All test evidence is structured for REQ verification and release auditing
- Every feature from SPECIFICATION.md has traceable test or verification coverage
- Developer workflows are automated via do-work wherever possible

## 3) Methodology Alignment

- **Dylan Davis**: "Always use real data and real API calls" — the runner defaults to `--all` with GCP when credentials are detected; skipping is the fallback, not the default.
- **Matt Maher/do-work**: Tests are the traceability evidence. The runner captures structured output suitable for REQ verification.

## 4) Non-goals (Scope Constraints)

- Does not add new test frameworks or dependencies
- Does not modify existing test logic (only adds skip guards in Task A)
- Does not retire or replace `docs/TEST-RESULTS.md` (historical document stays as-is)
- Does not parallelize suites (they share port 3000; sequential is correct)
- Does not fix/delete pre-existing failures (deferred to Task B)
- Does not implement the retention/pruning policy (deferred until enough runs accumulate to validate the design)

## 5) Traceability Model

This section defines the relationships between features, requirements, tests, verifications, test runs, and raw evidence. Understanding this structure is a prerequisite for the archive design and runner output format.

### 5.1) Linkage Structure (DAG)

The traceability structure is a **Directed Acyclic Graph (DAG)**, not a tree. There is no single root. Features and ad-hoc test runs coexist as independent top-level entities.

```
Features <--(many-to-many)--> Tests / Verifications
REQs     <--(many-to-many)--> Tests / Verifications
REQs     <--(one-to-many)---> Test Runs
Test Runs <--(one-to-many)--> Suite Results
Suite Results <(one-to-many)> Raw Logs
```

**Key properties:**
- A single test can satisfy multiple features (e.g., a session test covers both "authentication" and "rate limiting")
- A single feature may require tests from multiple suites (e.g., "resume tool" needs unit tests for parsing, E2E tests for the UI flow, and smoke tests for GCS artifact storage)
- A test run may be triggered by a REQ, or may be ad-hoc (no REQ). Both are valid top-level evidence
- Multiple REQs can reference the same test run (e.g., a release-qualifying run satisfies both a "run tests" REQ and a "verify deployment" REQ)
- Raw logs are terminal nodes — they can be linked **to** but generally not linked **from**

**Layer model (navigate top-down for understanding, bottom-up for evidence):**

| Layer | Contains | Links to |
|-------|----------|----------|
| Features | Feature descriptions from SPECIFICATION.md | Tests/Verifications that cover them |
| REQs | Work unit requirements | Tests/Verifications + Test Runs |
| Tests / Verifications | Test catalog entries | Implementation files + Feature(s) covered |
| Test Runs | Timestamped execution records (`summary.md`) | Suite Results + triggering REQ (if any) |
| Suite Results | Per-suite pass/fail/skip within a run | Raw Logs |
| Raw Logs | Full stdout/stderr (`*.log`, gitignored) | (terminal — no outbound links) |

### 5.2) Tests vs Verifications

**Tests** are implemented in code and run without manual assistance. They are the domain of test engineering.

| Property | Tests |
|----------|-------|
| Execution | Automated (`vitest`, `playwright`, custom scripts) |
| Triggered by | `npm run test:all` or individual suite commands |
| Evidence | Pass/fail counts, raw logs, archived `summary.md` |
| Examples | Unit tests, E2E browser tests, GCP smoke tests |

**Verifications** are largely manual procedures, possibly with utility code to assist. They are the domain of QA.

| Property | Verifications |
|----------|---------------|
| Execution | Manual, with optional scripted helpers |
| Triggered by | A human following a documented procedure |
| Evidence | A signed-off checklist entry or narrative report |
| Examples | "Visually inspect resume PDF layout", "Confirm OAuth flow in a fresh browser", "Verify Cloud Run deployment serves traffic" |

Both tests and verifications are first-class entries in the traceability graph. The master test runner handles tests; verifications are tracked in the **verification registry** (`docs/verification-registry.md`) and printed as a checklist after automated suites complete.

### 5.3) Test and Verification Metadata

Every test and verification must be documented with structured metadata. This metadata lives in a **test catalog** (`docs/test-catalog.md`) and is the authoritative source for test descriptions.

**Required fields for each test entry:**

- **ID** (e.g., TEST-042)
- **Headline**: One-line summary
- **Description**: What the test does and why
- **Type**: Test (automated) or Verification (manual)
- **Suite**: Which suite it belongs to (Unit, E2E, E2E Real LLM, GCP Smoke)
- **Features covered**: Which features from SPECIFICATION.md this test covers
- **Implementation**: File path
- **Inputs**: What the test needs
- **Expected outputs**: What passing looks like
- **How to run**: Command to execute
- **GCP required**: Yes/No

**Required fields for each verification entry:**

- **ID** (e.g., VER-003)
- **Headline**: One-line summary
- **Description**: What to verify and why
- **Type**: Verification (manual)
- **Features covered**: Which features this verification covers
- **Procedure**: Step-by-step instructions
- **Inputs**: What the verifier needs
- **Expected outputs**: What passing looks like
- **GCP required**: Yes/No

### 5.4) Feature-Test Matrix

A **feature-test matrix** (`docs/feature-test-matrix.md`) maps every feature from SPECIFICATION.md to the tests and verifications that cover it.

**Rules:**
- Every feature row must have at least one test OR verification. Empty rows are gaps that must be addressed.
- A test or verification can appear in multiple feature rows (many-to-many).
- A "Coverage Notes" column explains why the listed tests are sufficient.

### 5.5) Release Gate

A release-qualifying test run is distinct from an ad-hoc debugging run. The master test runner supports a `--release` flag:

- Implies `--gcp` (GCP tests are mandatory; fails if credentials are bad rather than skipping)
- All suites must run (no `--unit`-only or `--e2e`-only filtering)
- No suite may be skipped — any skip is treated as a failure
- Adds `release_candidate: true` to `summary.md` frontmatter
- Prints the manual verification checklist from the verification registry
- Exit code is 1 if any suite failed OR any suite was skipped

A single REQ (e.g., "Run master test suite for release") is sufficient to trigger and document a release-qualifying run. The `summary.md` with `release_candidate: true` is the evidence that tests passed prior to release.

## 6) Guiding Principles for Triage

These principles govern how pre-existing test failures are evaluated in Task B:

1. **Real-data tests supersede mock-data tests for the same behavior.** If a real-data test covers the same behavior as a mock-based unit test, the mock-based test is not required for release-qualifying coverage. The real-data test is the higher-fidelity evidence.

2. **Mock-data tests remain valuable for debugging.** Even when a real-data test exists, a mock-based test is useful for quickly isolating failures without GCP credentials. Mock tests should never be summarily deleted just because a real-data equivalent exists.

3. **The right outcome is not always "fix."** For each pre-existing failure, valid outcomes are:
   - **Keep as-is** (GCP-required integration test, skip guard stays)
   - **Rewrite** (convert to mock-based unit test if GCP is unnecessary for the behavior under test)
   - **Delete** (if fully duplicated by another test with equal or greater fidelity)

4. **Every test that survives triage must appear in the test catalog and feature-test matrix.** This ensures "all features are tested" remains auditable after triage.

## 7) Developer Workflow Principles

### 7.1) Automation-first via do-work

Every do-work request goes through a built-in pipeline: **triage > explore > build > verify > commit**. The verify phase runs relevant tests, writes new tests for new features, and loops on failure. The developer's job is to **describe what needs testing** and **review the result**.

### 7.2) Test Suite Reference

| Behavior under test | Suite | Framework |
|---------------------|-------|-----------|
| Pure functions, utilities, components | Unit (`web/src/**/*.test.ts`) | Vitest |
| User-facing browser flows | E2E (`web/e2e/*.spec.ts`) | Playwright |
| LLM-dependent flows with real API calls | E2E Real LLM (`web/scripts/e2e-real-llm.ts`) | Custom script |
| GCP service integrations | GCP Smoke (`web/scripts/smoke-gcp.ts`) | Custom script |

### 7.3) Test Writing Conventions

- Real data preferred over mocks; skip guards for GCP-dependent tests
- Mock-based versions are separate tests, not replacements for real-data tests
- Strict TypeScript, no `any`
- Descriptive `describe`/`test` names (parsed by the master runner)
- Every test must have a catalog entry and appear in the feature-test matrix

## 8) Test Results Archive Requirements

### 8.1) The Problem Today

Test evidence is scattered across 5 locations with no clear organization:

| Location | What It Is | Problem |
|----------|-----------|---------|
| `docs/TEST-RESULTS.md` | Monolithic hand-maintained document | Grows unbounded, no cross-links to work units |
| `do-work/archive/UR-*/REQ-*.md` `## Testing` sections | Brief summaries | Insufficient evidence for auditing |
| `.playwright-mcp/` | Raw browser console logs | Transient, noisy, gitignored |
| `web/test-fixtures/` | Reference input/output examples | Documentation, not test evidence |
| `web/test-results/` + `test-results/` | Playwright metadata | Gitignored |

### 8.2) Design Requirements

- **Two-layer archive**: A committed `summary.md` (audit-friendly) plus gitignored raw logs (debugging)
- **Cross-linking**: Forward links from REQ to test-run; back-links from test-run to REQ
- **Ad-hoc runs**: Runs without a REQ are still archived as proof-of-health
- **Release runs**: Distinct from ad-hoc runs via `release_candidate: true` frontmatter
- **Retention**: Deferred until enough runs accumulate; release runs kept indefinitely, ad-hoc runs pruned

## 9) Acceptance Criteria

### 9.1) Master Test Runner
- [ ] Single command (`npm run test:all`) runs all suites
- [ ] GCP auto-detection with graceful skip fallback
- [ ] `--release` mode enforces all-suites, no-skip behavior
- [ ] Colored summary table output
- [ ] Exit code 0 on all-pass, 1 on any failure

### 9.2) Skip Guards
- [ ] `route.test.ts` — 3 tests skip cleanly when GCP unavailable
- [ ] `full-app.spec.ts` — 4 tests skip cleanly when GCP unavailable
- [ ] No test logic modified, only skip guards added

### 9.3) Test Results Archive
- [ ] `summary.md` written to `do-work/archive/test-runs/YYYY-MM-DD_HH-MM-SS/`
- [ ] Raw logs gitignored, summary committed
- [ ] Cross-links work in both directions (REQ <-> test-run)

### 9.4) Documentation
- [ ] `docs/test-catalog.md` created with metadata for all tests
- [ ] `docs/feature-test-matrix.md` created mapping features to tests
- [ ] `docs/verification-registry.md` created with manual verification procedures

### 9.5) Developer Guide
- [ ] `README_dev_guide.md` created at project root with day-to-day test workflows
- [ ] Root `README.md` updated with link to the dev guide (README.md already exists)
- [ ] Dev guide covers: do-work test workflows, suite reference, running tests, manual verification, manual fallback

### 9.6) Triage (Task B)
- [ ] All 7 pre-existing failures evaluated
- [ ] Each test assigned an outcome: keep, rewrite, or delete
- [ ] Catalog and matrix updated to reflect triage decisions
