---
id: REQ-080
title: "Flatten Header Navigation"
status: pending
created_at: 2026-02-14T12:00:00-08:00
user_request: UR-020
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
- [ ] 2.1 Remove `children` array from the "Hire Me" nav item in `Header.tsx`
- [ ] 2.2 Verify desktop nav shows "Hire Me" as a flat link (no hover dropdown)
- [ ] 2.3 Verify mobile nav shows "Hire Me" as a flat link (no nested items)

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
