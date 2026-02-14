---
id: REQ-065
title: "Remove dead code"
status: pending
created_at: 2026-02-13T00:00:00Z
user_request: UR-008
related: [REQ-064]
batch: "hire-me-unified-phase-4"
source_step: "4.2"
source_doc: "docs/hire-me-unified-TODO.md"
blueprint_ref: "docs/hire-me-unified-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Remove dead code (Step 4.2)

## What
Clean up unused imports, components, and orphaned files from the old tool pages now that they've been replaced with redirects.

## Checklist
- [ ] Remove unused imports and components from old pages
- [ ] Clean up any orphaned component files specific to old pages

## Blueprint Guidance
Remove dead code from old pages. After replacing with redirects, the old page-specific components (FitToolContent, ResumeToolContent, InterviewToolContent, and their sub-components) may be orphaned if not imported elsewhere.

Scan for:
- Components only imported by old hire-me tool pages
- Utility functions only used by those components
- Types only referenced by those components

Do NOT remove:
- API route handlers (`/api/tools/fit/*`, `/api/tools/resume`, `/api/tools/interview`)
- `ToolGate.tsx` (still used)
- `JobInputForm` (may still be referenced by JobContextBar or other code)
- Shared types used by the new components

## Context
- **Document set**: hire-me-unified
- **Phase**: 4 — Redirects + Cleanup
- **Specification**: See docs/hire-me-unified-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory — quick fix)

## Dependencies
Depends on Step 4.1 (redirects in place) and Phase 3 (unified page using new components).

---
*Source: docs/hire-me-unified-TODO.md, Step 4.2*
