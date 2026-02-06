---
id: REQ-019
title: "Add skip guard to full-app.spec.ts"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "1.2"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Sonnet 4"
batch: "master-test-phase-1"
related: [REQ-018]
---

# Add skip guard to full-app.spec.ts (Step 1.2)

## What
Add GCP credential skip guards to `web/e2e/full-app.spec.ts` so the 4 GCP-dependent tests skip cleanly when GCP is unavailable.

## Checklist
- [ ] Add `dotenv` config loading at top
- [ ] Add `const gcpAvailable = Boolean(process.env.GCP_PROJECT_ID)`
- [ ] Add `test.skip(!gcpAvailable, "Requires GCP credentials")` to 4 tests
- [ ] TEST: `npm run test:e2e` — 24+ pass, 0 fail (4 skips)

## Blueprint Guidance
- **Goal**: Make 4 GCP-dependent tests in `web/e2e/full-app.spec.ts` skip cleanly
- **File to modify**: `web/e2e/full-app.spec.ts`
- **Problem**: 4 tests fail without GCP credentials
- **Implementation**:
  - Add `dotenv` config loading at top (Playwright test files don't auto-load `.env.local`)
  - Add `const gcpAvailable = Boolean(process.env.GCP_PROJECT_ID)`
  - Add `test.skip(!gcpAvailable, "Requires GCP credentials")` as first line in each of the 4 tests
- **Result**: 4 tests skip cleanly; 24 tests still pass regardless of GCP status. No test logic changed.
- **Test plan**: `npm run test:e2e` — 24+ pass, 0 fail (4 skips when no GCP)

## Context
- **Document set**: master-test
- **Phase**: 1 — Skip Guards
- **Specification**: See docs/master-test-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Phase 1 steps (1.1, 1.2) are independent of each other but should complete before Phase 2.

---
*Source: docs/master-test-TODO.md, Step 1.2*
