---
id: REQ-064
title: "Redirect old routes"
status: pending
created_at: 2026-02-13T00:00:00Z
user_request: UR-008
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
- [ ] Replace `web/src/app/hire-me/fit/page.tsx` with `redirect("/hire-me")`
- [ ] Replace `web/src/app/hire-me/resume/page.tsx` with `redirect("/hire-me")`
- [ ] Replace `web/src/app/hire-me/interview/page.tsx` with `redirect("/hire-me")`

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
