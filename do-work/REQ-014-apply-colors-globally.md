---
id: REQ-014
title: "Apply new color palette globally"
status: pending
created_at: 2026-02-05T15:30:00-08:00
user_request: UR-001
source_step: "4.1"
source_doc: "docs/v2-upgrade-TODO.md"
blueprint_ref: "docs/v2-upgrade-BLUEPRINT.md"
model_hint: "Opus 4.5"
batch: "v2-upgrade-phase-4"
related: [REQ-015]
---

# Apply new color palette globally (Step 4.1)

## What
Update all components across the site to use the new color tokens defined in Phase 0.1, ensuring consistent usage in header, footer, cards, CTAs, and text. Verify dark mode still works.

## Checklist
- [ ] **[Opus 4.5]** Update Header colors
- [ ] **[Opus 4.5]** Update Footer colors
- [ ] **[Opus 4.5]** Update card/surface colors
- [ ] **[Opus 4.5]** Update CTA/button colors
- [ ] **[Opus 4.5]** Update text colors (primary, secondary, muted)
- [ ] **[Gemini 3 Pro]** TEST: Visual inspection of all pages
- [ ] **[Gemini 3 Pro]** TEST: Dark mode verification

## Blueprint Guidance
### 4.1 Apply new color palette globally

- **Goal**: Update all components to use new color tokens
- **Acceptance criteria**:
  - Consistent color usage across site
  - Warmer feel achieved
  - Dark mode still works
- **Test plan**: Visual inspection of all pages
- **Prompt**:

```text
Apply the new color palette defined in Phase 0.1 across all components:

- Header: Update background and text colors
- Footer: Update to match
- Cards/surfaces: Use secondary color
- CTAs/buttons: Use accent color
- Text: Use text-primary, text-secondary, text-muted appropriately

Test on multiple pages and in dark mode.
```

## Context
- **Document set**: v2-upgrade
- **Phase**: 4 — Styling Polish
- **Specification**: See docs/v2-upgrade-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-001 (color palette must be defined first). All Phase 0-3 content should exist before applying global styling.

---
*Source: docs/v2-upgrade-TODO.md, Step 4.1*
