---
id: REQ-027
title: "Triage full-app.spec.ts tests (4 tests)"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "5.2"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Opus 4.5"
batch: "master-test-phase-5"
related: [REQ-026]
---

# Triage full-app.spec.ts tests (4 tests) (Step 5.2)

## What
Evaluate the 4 pre-existing test failures in `full-app.spec.ts` and implement triage decisions (keep, rewrite, or delete) for each test. Follow the guiding principles in the SPECIFICATION.

## Checklist
- [ ] Evaluate tests #4-6 ("captcha gate loads") — redundant with dedicated spec files?
- [ ] Evaluate test #7 ("session init") — overlap with smoke-gcp Section 3?
- [ ] Implement triage decisions (keep/rewrite/delete per test)
- [ ] TEST: `npm run test:all` — no regressions after triage

## Blueprint Guidance
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

## Context
- **Document set**: master-test
- **Phase**: 5 — Triage (Task B)
- **Specification**: See docs/master-test-SPECIFICATION.md Section 6 (Guiding Principles for Triage)
- **Model recommendation**: Opus 4.5 for evaluation, Gemini 3 Pro for testing (advisory)

## Dependencies
Depends on Phases 1-4 being complete. Phase 5 steps are independent of each other.

---
*Source: docs/master-test-TODO.md, Step 5.2*
