---
id: REQ-063
title: "Rewrite hire-me page"
status: pending
created_at: 2026-02-13T00:00:00Z
user_request: UR-008
related: [REQ-058, REQ-059, REQ-060, REQ-061, REQ-062]
batch: "hire-me-unified-phase-3"
source_step: "3.1"
source_doc: "docs/hire-me-unified-TODO.md"
blueprint_ref: "docs/hire-me-unified-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Rewrite hire-me page (Step 3.1)

## What
Rewrite `web/src/app/hire-me/page.tsx` from a hub/link page to the unified chat-first page. Compose all Phase 1 components and wire them through the useHireMe hook. JobContextBar sits outside ToolGate; ChatStream + actions bar + ChatInput sit inside ToolGate.

## Checklist
- [ ] Rewrite `web/src/app/hire-me/page.tsx` as unified chat page
- [ ] Page header + description at top
- [ ] JobContextBar outside ToolGate
- [ ] ToolGate wrapping ChatStream + actions bar + ChatInput
- [ ] Wire all components through `useHireMe` hook
- [ ] Actions bar with downloads + "New Conversation" button

## Blueprint Guidance
**`web/src/app/hire-me/page.tsx`** — Rewrite from hub to unified page
- Imports all components above
- Wraps chat area in `ToolGate` (single captcha for all tools)
- Page header + description
- Composes: JobContextBar + ToolGate(ChatStream + ChatInput)

Layout from specification:
```
┌─────────────────────────────────────────┐
│ Hire Me — page header + description     │
├─────────────────────────────────────────┤
│ Job Context Bar (outside ToolGate)      │
│ ToolGate {                              │
│   ChatStream (scrollable)               │
│   Actions bar (downloads + new convo)   │
│   Preset chips (when job loaded)        │
│   ChatInput (textarea + send)           │
│ }                                       │
└─────────────────────────────────────────┘
```

## Context
- **Document set**: hire-me-unified
- **Phase**: 3 — Assemble the Page
- **Specification**: See docs/hire-me-unified-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory)

## Dependencies
Depends on Phase 1 (all components) and Phase 2 (useHireMe hook).

---
*Source: docs/hire-me-unified-TODO.md, Step 3.1*
