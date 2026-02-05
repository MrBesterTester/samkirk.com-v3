---
id: REQ-015
title: "Mobile responsiveness audit"
status: pending
created_at: 2026-02-05T15:30:00-08:00
user_request: UR-001
source_step: "4.2"
source_doc: "docs/v2-upgrade-TODO.md"
blueprint_ref: "docs/v2-upgrade-BLUEPRINT.md"
model_hint: "Gemini 3 Pro"
batch: "v2-upgrade-phase-4"
related: [REQ-014]
---

# Mobile responsiveness audit (Step 4.2)

## What
Audit all pages for mobile responsiveness at iPhone SE (375px) and iPhone 14 (390px) widths. Verify no horizontal scrolling, all content readable, and touch targets at least 44px. Fix any issues found.

## Checklist
- [ ] **[Gemini 3 Pro]** Test all pages at 375px width (iPhone SE)
- [ ] **[Gemini 3 Pro]** Test all pages at 390px width (iPhone 14)
- [ ] **[Gemini 3 Pro]** Verify no horizontal scrolling
- [ ] **[Gemini 3 Pro]** Verify all content readable
- [ ] **[Gemini 3 Pro]** Verify touch targets at least 44px
- [ ] **[Opus 4.5]** Fix any responsiveness issues found

## Blueprint Guidance
### 4.2 Mobile responsiveness audit

- **Goal**: Ensure all pages display correctly on mobile
- **Acceptance criteria**:
  - No horizontal scrolling
  - All content readable
  - Touch targets appropriately sized
- **Test plan**: Test on actual mobile device or DevTools
- **Prompt**:

```text
Audit and fix mobile responsiveness:

1. Test all pages at 375px width (iPhone SE)
2. Test at 390px width (iPhone 14)
3. Check:
   - Hero photo centering
   - Tool preview cards stacking
   - Navigation hamburger menu
   - Footer layout
   - All touch targets at least 44px

Fix any issues found.
```

## Context
- **Document set**: v2-upgrade
- **Phase**: 4 — Styling Polish
- **Specification**: See docs/v2-upgrade-SPECIFICATION.md for full requirements
- **Model recommendation**: Gemini 3 Pro (advisory — use if your tool supports model selection)

## Dependencies
All content phases (0-3) and color polish (REQ-014) should be complete before the mobile audit.

---
*Source: docs/v2-upgrade-TODO.md, Step 4.2*
