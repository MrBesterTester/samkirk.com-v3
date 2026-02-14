---
id: REQ-081
title: "Delete Redirect Stubs"
status: pending
created_at: 2026-02-14T12:00:00-08:00
user_request: UR-020
related: [REQ-079, REQ-080, REQ-082]
batch: "hire-me-streamline-step-3"
source_step: "3"
source_doc: "docs/hire-me-streamline-TODO.md"
blueprint_ref: "docs/hire-me-streamline-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Delete Redirect Stubs (Step 3)

## What
Delete the three redirect-only route files and their directories, then scan the codebase for any stale references to the removed routes.

## Checklist
- [ ] 3.1 Delete `web/src/app/hire-me/fit/page.tsx` and its directory
- [ ] 3.2 Delete `web/src/app/hire-me/resume/page.tsx` and its directory
- [ ] 3.3 Delete `web/src/app/hire-me/interview/page.tsx` and its directory
- [ ] 3.4 Search codebase for stale references to `/hire-me/fit`, `/hire-me/resume`, `/hire-me/interview` and fix any found

## Blueprint Guidance
**Delete these files:**
- `web/src/app/hire-me/fit/page.tsx`
- `web/src/app/hire-me/resume/page.tsx`
- `web/src/app/hire-me/interview/page.tsx`

**Also delete the now-empty directories:**
- `web/src/app/hire-me/fit/`
- `web/src/app/hire-me/resume/`
- `web/src/app/hire-me/interview/`

### Codebase scan for stale references

Search the codebase for any remaining references to `/hire-me/fit`, `/hire-me/resume`, or `/hire-me/interview` and update or remove them. Likely locations:
- Test files (E2E navigation tests)
- Any sitemap or metadata files
- The `hire-me-unified-SPECIFICATION.md` (documentation only — leave as-is for history)

## Context
- **Document set**: hire-me-streamline
- **Phase**: Step 3
- **Specification**: See docs/hire-me-streamline-SPECIFICATION.md for full requirements (R3)
- **Model recommendation**: Sonnet 4 (advisory)

## Dependencies
None — this step can be done independently. Steps 1-3 are independent; Step 4 depends on all prior steps.

---
*Source: docs/hire-me-streamline-TODO.md, Step 3*
