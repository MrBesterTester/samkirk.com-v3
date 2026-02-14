---
id: REQ-059
title: "ChatInput"
status: pending
created_at: 2026-02-13T00:00:00Z
user_request: UR-008
related: [REQ-057, REQ-058, REQ-060, REQ-061, REQ-062]
batch: "hire-me-unified-phase-1"
source_step: "1.3"
source_doc: "docs/hire-me-unified-TODO.md"
blueprint_ref: "docs/hire-me-unified-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# ChatInput (Step 1.3)

## What
Build the bottom input area with an auto-resizing textarea, send button, and preset action chips ("Analyze My Fit", "Generate Resume") that appear above the input when a job is loaded.

## Checklist
- [ ] Build `ChatInput.tsx` with auto-resizing textarea + send button
- [ ] Add preset chips row ("Analyze My Fit", "Generate Resume") above input
- [ ] Chips visible only when job loaded and no flow active
- [ ] Disabled state during loading
- [ ] Enter to send, Shift+Enter for newline

## Blueprint Guidance
**`ChatInput.tsx`** — Bottom input area
- Auto-resizing textarea + send button (reuse existing pattern)
- Preset chips row above input (visible when job loaded and no flow active)
- Disabled during active loading

## Context
- **Document set**: hire-me-unified
- **Phase**: 1 — Extract Shared Components
- **Specification**: See docs/hire-me-unified-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory)

## Dependencies
Depends on Step 1.1 (directory creation). Adapt from interview page's existing ChatInput pattern.

---
*Source: docs/hire-me-unified-TODO.md, Step 1.3*
