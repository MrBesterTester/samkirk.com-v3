---
id: REQ-067
title: "Manual verification"
status: pending
created_at: 2026-02-13T00:00:00Z
user_request: UR-008
related: [REQ-066]
batch: "hire-me-unified-phase-5"
source_step: "5.2"
source_doc: "docs/hire-me-unified-TODO.md"
blueprint_ref: "docs/hire-me-unified-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Manual verification (Step 5.2)

## What
Manually test all three flows (fit, resume, chat) through the unified page, verify sessionStorage persistence, and confirm old URL redirects work.

## Checklist
- [ ] Load `/hire-me` — chat interface with welcome message and collapsed job context bar
- [ ] Type question without job loaded — interview chat works
- [ ] Paste job posting — bar collapses, presets appear
- [ ] "Analyze My Fit" — questions + report card in chat
- [ ] "Generate Resume" — resume preview card in chat
- [ ] Download buttons work
- [ ] `/hire-me/fit` redirects to `/hire-me`
- [ ] Page refresh restores job context from sessionStorage

## Blueprint Guidance
Manual verification checklist from the specification:
1. Load `/hire-me` — see chat interface with welcome message and collapsed job context bar
2. Type a question without loading a job — interview chat works normally
3. Expand context bar, paste a job posting, submit — bar collapses showing "Job loaded", preset chips appear
4. Click "Analyze My Fit" — system message + follow-up questions appear as interactive cards
5. Answer all questions — fit report card appears with scores and download button
6. Click "Generate Resume" — system message + resume preview card appears with download
7. Click download buttons — artifacts download correctly
8. Visit `/hire-me/fit` — redirects to `/hire-me`
9. Refresh page — job context restored from sessionStorage

## Context
- **Document set**: hire-me-unified
- **Phase**: 5 — Test
- **Specification**: See docs/hire-me-unified-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory — use browser automation for visual checks)

## Dependencies
Depends on Step 5.1 (automated tests pass first). Requires a running dev server.

---
*Source: docs/hire-me-unified-TODO.md, Step 5.2*
