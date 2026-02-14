---
id: REQ-061
title: "Rich Card Components"
status: pending
created_at: 2026-02-13T00:00:00Z
user_request: UR-008
related: [REQ-057, REQ-060, REQ-062]
batch: "hire-me-unified-phase-1"
source_step: "1.5"
source_doc: "docs/hire-me-unified-TODO.md"
blueprint_ref: "docs/hire-me-unified-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Rich Card Components (Step 1.5)

## What
Build the three rich chat card components that render inline in the chat stream: FitReportCard (scores + categories), ResumePreviewCard (header + stats + download), and FitQuestionCard (interactive follow-up questions with read-only state after answering).

## Checklist
- [ ] Build `FitReportCard.tsx` — overall score, categories, recommendation, download button
- [ ] Build `ResumePreviewCard.tsx` — header, summary, stats grid, download button
- [ ] Build `FitQuestionCard.tsx` — question text, options/textarea, submit, progress indicator
- [ ] FitQuestionCard: disabled state after answered (shows selected answer)

## Blueprint Guidance
**`FitReportCard.tsx`** — Rich chat card for fit results
- Overall score badge, category breakdown, recommendation, unknowns
- Download button inline
- Adapted from current `Results` component in fit/page.tsx

**`ResumePreviewCard.tsx`** — Rich chat card for resume results
- Header, summary, stats grid
- Download button inline
- Adapted from current `ResumePreview` + `Results` in resume/page.tsx

**`FitQuestionCard.tsx`** — Interactive chat card for fit follow-ups
- Question text, radio options or textarea, submit button
- Progress indicator ("Question 2 of 5")
- Adapted from current `FollowUpQuestion` component
- Disabled after answered (shows selected answer)

## Context
- **Document set**: hire-me-unified
- **Phase**: 1 — Extract Shared Components
- **Specification**: See docs/hire-me-unified-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory)

## Dependencies
Depends on Step 1.1 (directory creation). Adapt from existing fit and resume page components. ChatStream (Step 1.4) will import these.

---
*Source: docs/hire-me-unified-TODO.md, Step 1.5*
