---
id: REQ-060
title: "ChatStream"
status: pending
created_at: 2026-02-13T00:00:00Z
user_request: UR-008
related: [REQ-057, REQ-058, REQ-059, REQ-061, REQ-062]
batch: "hire-me-unified-phase-1"
source_step: "1.4"
source_doc: "docs/hire-me-unified-TODO.md"
blueprint_ref: "docs/hire-me-unified-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# ChatStream (Step 1.4)

## What
Build the scrollable chat message container that renders typed messages (user bubbles, assistant bubbles, system text, and rich cards) with auto-scroll and a welcome message when empty.

## Checklist
- [ ] Build `ChatStream.tsx` as scrollable message container
- [ ] Render typed messages with appropriate components per message type
- [ ] Auto-scroll to bottom on new messages
- [ ] Welcome message when messages array is empty
- [ ] Message type renderers: user bubble, assistant bubble, system text

## Blueprint Guidance
**`ChatStream.tsx`** — Scrollable message area
- Renders typed messages with appropriate components
- Auto-scrolls to bottom on new messages
- Welcome message when empty

Message types from specification:
| Type | Rendering |
|------|-----------|
| `user` | Blue bubble (right-aligned) |
| `assistant` | Gray bubble (left-aligned, "Sam Kirk" label) |
| `system` | Centered muted text |
| `fit-question` | Interactive card (rendered by FitQuestionCard) |
| `fit-report` | Rich card (rendered by FitReportCard) |
| `resume-preview` | Rich card (rendered by ResumePreviewCard) |
| `error` | Red-bordered card with retry button |

## Context
- **Document set**: hire-me-unified
- **Phase**: 1 — Extract Shared Components
- **Specification**: See docs/hire-me-unified-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory)

## Dependencies
Depends on Step 1.1 (directory creation) and Step 1.5 (rich card components) for rendering fit/resume/question cards. Adapt from interview page's message rendering.

---
*Source: docs/hire-me-unified-TODO.md, Step 1.4*
