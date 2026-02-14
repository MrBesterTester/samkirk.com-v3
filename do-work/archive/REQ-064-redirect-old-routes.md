---
id: REQ-064
title: "Redirect old routes"
status: completed
created_at: 2026-02-13T00:00:00Z
user_request: UR-008
claimed_at: 2026-02-13T06:12:00Z
route: A
completed_at: 2026-02-13T06:14:00Z
related: [REQ-063, REQ-065]
batch: "hire-me-unified-phase-4"
source_step: "4.1"
source_doc: "docs/hire-me-unified-TODO.md"
blueprint_ref: "docs/hire-me-unified-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Redirect old routes (Step 4.1)

## What
Replace the three old tool pages with Next.js server redirects to `/hire-me` so existing links and bookmarks continue to work.

## Checklist
- [x] Replace `web/src/app/hire-me/fit/page.tsx` with `redirect("/hire-me")`
- [x] Replace `web/src/app/hire-me/resume/page.tsx` with `redirect("/hire-me")`
- [x] Replace `web/src/app/hire-me/interview/page.tsx` with `redirect("/hire-me")`

## Blueprint Guidance
Replace old tool pages with `redirect("/hire-me")` (Next.js server redirect).

Each page becomes a minimal server component:
```tsx
import { redirect } from "next/navigation";
export default function Page() {
  redirect("/hire-me");
}
```

## Context
- **Document set**: hire-me-unified
- **Phase**: 4 — Redirects + Cleanup
- **Specification**: See docs/hire-me-unified-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory — quick fix)

## Dependencies
Depends on Phase 3 (unified page must be live before redirecting).

---
*Source: docs/hire-me-unified-TODO.md, Step 4.1*

---

## Triage

**Route: A** - Simple

**Reasoning:** Three file replacements with exact content specified in the blueprint. No ambiguity.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Blueprint provides the exact code for each file. Simple find-and-replace task.

*Skipped by work action*

## Implementation Summary

- Replaced `web/src/app/hire-me/fit/page.tsx` with `redirect("/hire-me")` server component
- Replaced `web/src/app/hire-me/resume/page.tsx` with `redirect("/hire-me")` server component
- Replaced `web/src/app/hire-me/interview/page.tsx` with `redirect("/hire-me")` server component

*Completed by work action (Route A)*

## Testing

**Tests run:** `npx vitest run`
**Result:** ✓ All tests passing (1232 tests, 38 files)

**New tests added:** None — redirect pages are trivial server components

*Verified by work action*
