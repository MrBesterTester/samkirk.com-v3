---
id: REQ-007
title: "Add Hiring Manager tools section"
status: pending
created_at: 2026-02-05T15:30:00-08:00
user_request: UR-001
source_step: "2.3"
source_doc: "docs/v2-upgrade-TODO.md"
blueprint_ref: "docs/v2-upgrade-BLUEPRINT.md"
model_hint: "Opus 4.5"
batch: "v2-upgrade-phase-2"
related: [REQ-005, REQ-006, REQ-008, REQ-009, REQ-010]
---

# Add Hiring Manager tools section (Step 2.3)

## What
Add a "Hiring Manager?" section to the home page with three ToolPreview cards for Fit, Resume, and Interview tools, laid out as a grid on desktop and stacked on mobile.

## Checklist
- [ ] **[Opus 4.5]** Add "Hiring Manager?" section heading
- [ ] **[Opus 4.5]** Create "How Do I Fit?" preview card with CTA
- [ ] **[Opus 4.5]** Create "Custom Resume" preview card with CTA
- [ ] **[Opus 4.5]** Create "Interview Me Now" preview with sample Q&A
- [ ] **[Opus 4.5]** Layout: grid on desktop, stack on mobile
- [ ] **[Gemini 3 Pro]** TEST: Click CTAs, verify navigation works

## Blueprint Guidance
### 2.3 Add Hiring Manager tools section

- **Goal**: Preview + CTA for Fit, Resume, Interview tools
- **Acceptance criteria**:
  - All three tools have preview cards
  - Interview Me includes sample Q&A exchange
  - CTAs link to respective tool pages
- **Test plan**: Click CTAs, verify navigation
- **Prompt**:

```text
Add Hiring Manager section to home page (web/src/app/page.tsx):

Section heading: "Hiring Manager?" (or similar)

Three ToolPreview cards:
1. How Do I Fit?
   - Description: Get a detailed fit analysis for your role
   - CTA: "Analyze Fit" → /tools/fit

2. Custom Resume
   - Description: Generate a tailored 2-page resume
   - CTA: "Generate Resume" → /tools/resume

3. Interview Me Now
   - previewContent: Sample Q&A (e.g., "Q: What's your experience with AI?")
   - CTA: "Start Interview" → /tools/interview

Layout: Grid on desktop, stack on mobile.
```

## Context
- **Document set**: v2-upgrade
- **Phase**: 2 — Home Page Redesign
- **Specification**: See docs/v2-upgrade-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-006 (ToolPreview component must exist first).

---
*Source: docs/v2-upgrade-TODO.md, Step 2.3*
