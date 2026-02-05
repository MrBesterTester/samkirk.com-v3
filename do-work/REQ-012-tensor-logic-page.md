---
id: REQ-012
title: "Create Tensor Logic link page"
status: pending
created_at: 2026-02-05T15:30:00-08:00
user_request: UR-001
source_step: "3.2"
source_doc: "docs/v2-upgrade-TODO.md"
blueprint_ref: "docs/v2-upgrade-BLUEPRINT.md"
model_hint: "Opus 4.5"
batch: "v2-upgrade-phase-3"
related: [REQ-011, REQ-013]
---

# Create Tensor Logic link page (Step 3.2)

## What
Create a new exploration page at `/explorations/tensor-logic` describing the educational Tensor Logic demo, with features list, link to external site, arXiv reference, and updates to the Explorations hub and header nav.

## Checklist
- [ ] **[Opus 4.5]** Create `web/src/app/explorations/tensor-logic/page.tsx`
- [ ] **[Opus 4.5]** Add title, description of educational demo
- [ ] **[Opus 4.5]** List features (8 examples, 5 AI paradigms)
- [ ] **[Opus 4.5]** Add link to tensor-logic.samkirk.com
- [ ] **[Opus 4.5]** Add reference to arXiv paper
- [ ] **[Codex/Opus]** Update Explorations hub to include Tensor Logic
- [ ] **[Codex/Opus]** Update Header navigation dropdown
- [ ] **[Gemini 3 Pro]** TEST: Navigation from Explorations hub

## Blueprint Guidance
### 3.2 Create Tensor Logic link page

- **Goal**: Add Tensor Logic to Explorations
- **Acceptance criteria**:
  - Page exists at `/explorations/tensor-logic`
  - Description of the educational demo
  - Link to external site
- **Test plan**: Navigation from Explorations hub
- **Prompt**:

```text
Create web/src/app/explorations/tensor-logic/page.tsx:

Content:
- Title: "Tensor Logic"
- Description: Educational interactive demo illustrating Pedro Domingos' Tensor Logic—
  a unified programming paradigm bridging neural and symbolic AI
- Features:
  - 8 interactive examples across 5 AI paradigms
  - Demonstrates mathematical unification via Einstein summation
  - Based on peer-reviewed research
- CTA: Link to https://tensor-logic.samkirk.com
- Reference: arXiv:2510.12269

Update Explorations hub and Header navigation to include Tensor Logic.
```

## Context
- **Document set**: v2-upgrade
- **Phase**: 3 — New Pages
- **Specification**: See docs/v2-upgrade-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Phase 0-2 should be complete. Coordinates with REQ-011 on header nav updates and REQ-013 on exploration page descriptions.

---
*Source: docs/v2-upgrade-TODO.md, Step 3.2*
