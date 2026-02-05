---
id: REQ-011
title: "Create Photo Fun link page"
status: pending
created_at: 2026-02-05T15:30:00-08:00
user_request: UR-001
source_step: "3.1"
source_doc: "docs/v2-upgrade-TODO.md"
blueprint_ref: "docs/v2-upgrade-BLUEPRINT.md"
model_hint: "Opus 4.5"
batch: "v2-upgrade-phase-3"
related: [REQ-012, REQ-013]
---

# Create Photo Fun link page (Step 3.1)

## What
Create a dedicated `/photo-fun` page with title, description of the AI photo editing app, features list, and a prominent CTA button linking to the external site. Add it to header navigation.

## Checklist
- [ ] **[Opus 4.5]** Create `web/src/app/photo-fun/page.tsx`
- [ ] **[Opus 4.5]** Add title, description, features list
- [ ] **[Opus 4.5]** Add prominent CTA button to external site
- [ ] **[Codex/Opus]** Add to Header navigation
- [ ] **[Gemini 3 Pro]** TEST: Navigation, link functionality

## Blueprint Guidance
### 3.1 Create Photo Fun link page

- **Goal**: Dedicated page for Photo Fun with description
- **Acceptance criteria**:
  - Page exists at `/photo-fun`
  - Description of app and features
  - Prominent link to external site
- **Test plan**: Navigation, link functionality
- **Prompt**:

```text
Create web/src/app/photo-fun/page.tsx:

Content:
- Title: "Photo Fun"
- Description: AI-powered photo editing application using Google Gemini
- Features list:
  - 4 preset styles: Professional, Claymation, Cyberpunk, Pencil Sketch
  - Custom prompts for personalized transformations
  - Real-time image processing
- CTA: Large button linking to https://photo-fun.samkirk.com

Add to navigation in Header.tsx.
```

## Context
- **Document set**: v2-upgrade
- **Phase**: 3 — New Pages
- **Specification**: See docs/v2-upgrade-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Phase 0-2 should be complete. Header navigation update coordinates with REQ-012 (Tensor Logic also updates nav).

---
*Source: docs/v2-upgrade-TODO.md, Step 3.1*
