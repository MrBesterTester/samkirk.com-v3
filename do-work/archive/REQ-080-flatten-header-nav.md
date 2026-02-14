---
id: REQ-080
title: "Flatten Header Navigation"
status: completed
created_at: 2026-02-14T12:00:00-08:00
user_request: UR-020
claimed_at: 2026-02-14T21:34:00-08:00
route: A
completed_at: 2026-02-14T21:35:00-08:00
related: [REQ-079, REQ-081, REQ-082]
batch: "hire-me-streamline-step-2"
source_step: "2"
source_doc: "docs/hire-me-streamline-TODO.md"
blueprint_ref: "docs/hire-me-streamline-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Flatten Header Navigation (Step 2)

## What
Remove the dropdown children from the "Hire Me" nav item in the header so it becomes a direct link to `/hire-me` with no sub-menu.

## Checklist
- [x] 2.1 Remove `children` array from the "Hire Me" nav item in `Header.tsx`
- [x] 2.2 Verify desktop nav shows "Hire Me" as a flat link (no hover dropdown)
- [x] 2.3 Verify mobile nav shows "Hire Me" as a flat link (no nested items)

## Blueprint Guidance
**File:** `web/src/components/Header.tsx`

### Current (lines 8-16)

```typescript
{
  href: "/hire-me",
  label: "Hire Me",
  children: [
    { href: "/hire-me/fit", label: "How Do I Fit?" },
    { href: "/hire-me/resume", label: "Custom Resume" },
    { href: "/hire-me/interview", label: "Interview Me" },
  ],
},
```

### Target

Remove the `children` array so "Hire Me" becomes a flat link:

```typescript
{ href: "/hire-me", label: "Hire Me" },
```

No other header changes needed — the existing rendering logic already handles links without children as simple nav items.

## Context
- **Document set**: hire-me-streamline
- **Phase**: Step 2
- **Specification**: See docs/hire-me-streamline-SPECIFICATION.md for full requirements (R2)
- **Model recommendation**: Sonnet 4 (advisory)

## Dependencies
None — this step can be done independently. Steps 1-3 are independent; Step 4 depends on all prior steps.

---
*Source: docs/hire-me-streamline-TODO.md, Step 2*

---

## Triage

**Route: A** - Simple

**Reasoning:** Specific file named (`web/src/components/Header.tsx`), exact change provided — just remove the `children` array from one nav item.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Single-line change in a named file. Remove `children` array from nav item.

*Skipped by work action*

## Implementation Summary

- Removed `children` array from the "Hire Me" nav item in `web/src/components/Header.tsx`
- "Hire Me" is now a flat direct link to `/hire-me` with no dropdown sub-menu
- No other changes needed — existing rendering logic already handles items without children

*Completed by work action (Route A)*

## Testing

**Tests run:** `npx vitest run src/components/Header.test.tsx`
**Result:** ✓ All tests passing (6 tests)

**Existing tests verified:**
- `web/src/components/Header.test.tsx` — all 6 tests still passing

*Verified by work action*
