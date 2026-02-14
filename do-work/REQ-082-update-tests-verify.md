---
id: REQ-082
title: "Update Tests and Verify"
status: pending
created_at: 2026-02-14T12:00:00-08:00
user_request: UR-020
related: [REQ-079, REQ-080, REQ-081]
batch: "hire-me-streamline-step-4"
source_step: "4"
source_doc: "docs/hire-me-streamline-TODO.md"
blueprint_ref: "docs/hire-me-streamline-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Update Tests and Verify (Step 4)

## What
Update any tests that reference the deleted sub-routes or the old three-card home page layout. Run all test suites and do a final visual check.

## Checklist
- [ ] 4.1 Update any E2E tests that navigate to the deleted sub-routes
- [ ] 4.2 Update any tests that assert three ToolPreview cards on the home page
- [ ] 4.3 Run `npm test` — all unit tests pass
- [ ] 4.4 Run `npx playwright test` — all E2E tests pass
- [ ] 4.5 Final visual check: home page single CTA, header flat link, `/hire-me` unchanged

## Blueprint Guidance
### Unit tests

- If any unit tests reference the three sub-routes or the three-card home page layout, update them.

### E2E tests

- Navigation tests that click through to `/hire-me/fit` etc. should be updated to verify 404 or removed.
- Home page tests that assert three ToolPreview cards should be updated to assert the single CTA.
- `/hire-me` page tests should still pass unchanged.

### Manual verification

1. `npm test` — all unit tests pass
2. `npx playwright test` — all E2E tests pass
3. Visual check: home page shows single CTA, header has no dropdown

## Context
- **Document set**: hire-me-streamline
- **Phase**: Step 4
- **Specification**: See docs/hire-me-streamline-SPECIFICATION.md for full requirements (Verification section)
- **Model recommendation**: Sonnet 4 (advisory)

## Dependencies
Depends on Steps 1-3 (REQ-079, REQ-080, REQ-081) being completed first. Tests must validate the changes made in those steps.

---
*Source: docs/hire-me-streamline-TODO.md, Step 4*
