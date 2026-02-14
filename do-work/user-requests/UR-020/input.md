---
id: UR-020
title: "Ingest: hire-me-streamline TODO (4 steps)"
created_at: 2026-02-14T12:00:00-08:00
requests: [REQ-079, REQ-080, REQ-081, REQ-082]
word_count: 213
---

# Ingest: hire-me-streamline TODO

## Summary
Ingested 4 unchecked steps from docs/hire-me-streamline-TODO.md into do-work REQ files.
Document set: hire-me-streamline-SPECIFICATION.md, hire-me-streamline-BLUEPRINT.md, hire-me-streamline-TODO.md.

## Extracted Requests

| ID | Step | Title | Model Hint |
|----|------|-------|------------|
| REQ-079 | 1 | Simplify Home Page "Hiring Manager?" Section | Sonnet 4 |
| REQ-080 | 2 | Flatten Header Navigation | Sonnet 4 |
| REQ-081 | 3 | Delete Redirect Stubs | Sonnet 4 |
| REQ-082 | 4 | Update Tests and Verify | Sonnet 4 |

## Full Verbatim Input

# Hire Me Streamline — TODO

**Model recommendation:** Sonnet 4 (straightforward UI/nav changes)

---

## Step 1: Simplify Home Page "Hiring Manager?" Section

- [ ] 1.1 Replace the three `ToolPreview` cards with a single CTA link to `/hire-me`
- [ ] 1.2 Update section subtitle to describe the unified tool experience
- [ ] 1.3 Remove unused `ToolPreview` import from `page.tsx` (if no longer needed on this page)
- [ ] 1.4 Verify home page renders correctly (`npm run dev` and visual check)

## Step 2: Flatten Header Navigation

- [ ] 2.1 Remove `children` array from the "Hire Me" nav item in `Header.tsx`
- [ ] 2.2 Verify desktop nav shows "Hire Me" as a flat link (no hover dropdown)
- [ ] 2.3 Verify mobile nav shows "Hire Me" as a flat link (no nested items)

## Step 3: Delete Redirect Stubs

- [ ] 3.1 Delete `web/src/app/hire-me/fit/page.tsx` and its directory
- [ ] 3.2 Delete `web/src/app/hire-me/resume/page.tsx` and its directory
- [ ] 3.3 Delete `web/src/app/hire-me/interview/page.tsx` and its directory
- [ ] 3.4 Search codebase for stale references to `/hire-me/fit`, `/hire-me/resume`, `/hire-me/interview` and fix any found

## Step 4: Update Tests and Verify

- [ ] 4.1 Update any E2E tests that navigate to the deleted sub-routes
- [ ] 4.2 Update any tests that assert three ToolPreview cards on the home page
- [ ] 4.3 Run `npm test` — all unit tests pass
- [ ] 4.4 Run `npx playwright test` — all E2E tests pass
- [ ] 4.5 Final visual check: home page single CTA, header flat link, `/hire-me` unchanged

---
*Captured: 2026-02-14T12:00:00-08:00*
