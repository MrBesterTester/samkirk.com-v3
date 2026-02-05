---
id: REQ-008
title: "Add Dance Menu preview"
status: pending
created_at: 2026-02-05T15:30:00-08:00
user_request: UR-001
source_step: "2.4"
source_doc: "docs/v2-upgrade-TODO.md"
blueprint_ref: "docs/v2-upgrade-BLUEPRINT.md"
model_hint: "Opus 4.5"
batch: "v2-upgrade-phase-2"
related: [REQ-005, REQ-006, REQ-007, REQ-009, REQ-010]
---

# Add Dance Menu preview (Step 2.4)

## What
Add a Dance Menu teaser section to the home page with a heading, preview/snippet content, and a CTA linking to the full `/dance-menu` page.

## Checklist
- [ ] **[Opus 4.5]** Add Dance Menu section heading
- [ ] **[Opus 4.5]** Create preview/teaser content
- [ ] **[Opus 4.5]** Add CTA linking to `/dance-menu`
- [ ] **[Gemini 3 Pro]** TEST: Visual inspection, CTA navigation

## Blueprint Guidance
### 2.4 Add Dance Menu preview

- **Goal**: Preview + CTA for Dance Menu
- **Acceptance criteria**:
  - Shows teaser/snippet of current menu
  - CTA links to full dance menu page
- **Test plan**: Visual inspection, CTA navigation
- **Prompt**:

```text
Add Dance Menu section to home page:

- Heading: "This Week's Dance Menu" (or similar)
- Preview: Brief description or snippet
- CTA: "View Full Menu" → /dance-menu

Consider: Could fetch current menu title/date from API or show static teaser.
```

## Context
- **Document set**: v2-upgrade
- **Phase**: 2 — Home Page Redesign
- **Specification**: See docs/v2-upgrade-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Phase 0-1 should be complete. No direct dependency on other Phase 2 steps, but should follow hero section (REQ-005) in page order.

---
*Source: docs/v2-upgrade-TODO.md, Step 2.4*
