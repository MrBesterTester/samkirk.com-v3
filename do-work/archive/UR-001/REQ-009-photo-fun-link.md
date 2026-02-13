---
id: REQ-009
title: "Add Photo Fun link section"
status: completed
created_at: 2026-02-05T15:30:00-08:00
user_request: UR-001
related: [REQ-005, REQ-006, REQ-007, REQ-008, REQ-010]
batch: "v2-upgrade-phase-2"
claimed_at: 2026-02-05T16:24:00-08:00
route: A
completed_at: 2026-02-05T16:28:00-08:00
commit: 8c9b7de
source_step: "2.5"
source_doc: "docs/v2-upgrade-TODO.md"
blueprint_ref: "docs/v2-upgrade-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Add Photo Fun link section (Step 2.5)

## What
Add a Photo Fun section to the home page with a heading, description of AI photo editing features, and an external link to photo-fun.samkirk.com opening in a new tab.

## Checklist
- [x] **[Opus 4.5]** Add Photo Fun section with heading
- [x] **[Opus 4.5]** Write description of AI photo editing features
- [x] **[Opus 4.5]** Add external link to photo-fun.samkirk.com (new tab)
- [x] **[Gemini 3 Pro]** TEST: Click link, verify external site opens

## Blueprint Guidance
### 2.5 Add Photo Fun link section

- **Goal**: Link with description to Photo Fun app
- **Acceptance criteria**:
  - Description explains what Photo Fun does
  - Link opens photo-fun.samkirk.com in new tab
- **Test plan**: Click link, verify external site opens
- **Prompt**:

```text
Add Photo Fun section to home page:

Content:
- Heading: "Photo Fun"
- Description: AI-powered photo editing using Google Gemini. Transform your photos
  with artistic styles like Professional, Claymation, Cyberpunk, and Pencil Sketch.
- Link: "Try Photo Fun →" → https://photo-fun.samkirk.com (target="_blank")

Styling: Card or highlighted section to draw attention.
```

## Context
- **Document set**: v2-upgrade
- **Phase**: 2 — Home Page Redesign
- **Specification**: See docs/v2-upgrade-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
No direct dependency on other Phase 2 steps beyond page ordering.

---
*Source: docs/v2-upgrade-TODO.md, Step 2.5*

---

## Triage

**Route: A** - Simple

**Reasoning:** Clear content, specific text and link, page pattern established from previous REQs. Direct implementation.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Simple section addition with explicit heading, description, and external link. Pattern well established from REQ-008.

*Skipped by work action*

## Implementation Summary

- Added "Photo Fun" section to page.tsx between Dance Menu and Explore More
- Manual card (matching ToolPreview styling) with external `<a>` tag for target="_blank" support
- Description: AI-powered photo editing with artistic styles
- CTA: "Try Photo Fun" → https://photo-fun.samkirk.com (new tab, noopener noreferrer)

*Completed by work action (Route A)*

## Testing

**Tests run:** `npx vitest run src/app/page.test.tsx`
**Result:** ✓ 4/4 relevant tests passing (1 pre-existing failure unrelated)

*Verified by work action*
