---
id: REQ-026
title: "Triage route.test.ts tests (3 tests)"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "5.1"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Opus 4.5"
batch: "master-test-phase-5"
related: [REQ-027]
---

# Triage route.test.ts tests (3 tests) (Step 5.1)

## What
Evaluate the 3 pre-existing test failures in `route.test.ts` and implement triage decisions (keep, rewrite, or delete) for each test. Follow the guiding principles in the SPECIFICATION.

## Checklist
- [ ] Evaluate test #1 ("serve existing file") — overlap with smoke-gcp Section 1?
- [ ] Evaluate test #2 ("return 404") — candidate for mock-based rewrite?
- [ ] Evaluate test #3 ("block traversal") — convert to pure unit test
- [ ] Implement triage decisions (keep/rewrite/delete per test)
- [ ] TEST: `npm run test:all` — no regressions after triage

## Blueprint Guidance
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

## Context
- **Document set**: master-test
- **Phase**: 5 — Triage (Task B)
- **Specification**: See docs/master-test-SPECIFICATION.md Section 6 (Guiding Principles for Triage)
- **Model recommendation**: Opus 4.5 for evaluation, Gemini 3 Pro for testing (advisory)

## Dependencies
Depends on Phases 1-4 being complete (skip guards in place, runner working). Phase 5 steps are independent of each other.

---
*Source: docs/master-test-TODO.md, Step 5.1*
