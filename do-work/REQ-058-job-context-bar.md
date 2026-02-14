---
id: REQ-058
title: "JobContextBar"
status: pending
created_at: 2026-02-13T00:00:00Z
user_request: UR-008
related: [REQ-057, REQ-059, REQ-060, REQ-061, REQ-062]
batch: "hire-me-unified-phase-1"
source_step: "1.2"
source_doc: "docs/hire-me-unified-TODO.md"
blueprint_ref: "docs/hire-me-unified-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# JobContextBar (Step 1.2)

## What
Build a collapsible top bar component that manages job posting input. It has three visual states: collapsed-empty (prompts user to add a job), expanded (shows paste/URL/file input tabs), and collapsed-loaded (shows job title/company with swap/remove buttons). Persists to sessionStorage.

## Checklist
- [ ] Build `JobContextBar.tsx` with three states: collapsed-empty, expanded (input form), collapsed-loaded
- [ ] Reuse paste/URL/file tab logic from existing `JobInputForm`
- [ ] Persist job context to sessionStorage
- [ ] Restore job context from sessionStorage on mount
- [ ] Emit `onJobLoaded` / `onJobCleared` callbacks

## Blueprint Guidance
**`JobContextBar.tsx`** — Collapsible top bar
- Collapsed (no job): "Add a job posting to unlock fit analysis and custom resume" + expand button
- Expanded: Same paste/URL/file tabs as current `JobInputForm` + submit + cancel
- Loaded: Shows job title/company (or "Job posting loaded") + swap/remove buttons
- Persists to sessionStorage

## Context
- **Document set**: hire-me-unified
- **Phase**: 1 — Extract Shared Components
- **Specification**: See docs/hire-me-unified-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory)

## Dependencies
Depends on Step 1.1 (directory creation). The existing `JobInputForm` component should be referenced for paste/URL/file tab logic.

---
*Source: docs/hire-me-unified-TODO.md, Step 1.2*
