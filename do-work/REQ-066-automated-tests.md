---
id: REQ-066
title: "Automated tests"
status: pending
created_at: 2026-02-13T00:00:00Z
user_request: UR-008
related: [REQ-067]
batch: "hire-me-unified-phase-5"
source_step: "5.1"
source_doc: "docs/hire-me-unified-TODO.md"
blueprint_ref: "docs/hire-me-unified-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Automated tests (Step 5.1)

## What
Run existing test suites to verify the unified page doesn't break anything. Fix any test failures caused by the refactor.

## Checklist
- [ ] Run `npm test` — all Vitest unit tests pass
- [ ] Run `npx playwright test` — all E2E tests pass

## Blueprint Guidance
Run existing test suites from the `web/` directory:
- `npm test` for Vitest unit tests
- `npx playwright test` for E2E tests

Fix any failures caused by:
- Changed imports/paths from moved components
- Updated page structure affecting E2E selectors
- Redirect behavior changes in E2E navigation tests

## Context
- **Document set**: hire-me-unified
- **Phase**: 5 — Test
- **Specification**: See docs/hire-me-unified-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory)

## Dependencies
Depends on Phase 4 completion (all code changes done).

---
*Source: docs/hire-me-unified-TODO.md, Step 5.1*
