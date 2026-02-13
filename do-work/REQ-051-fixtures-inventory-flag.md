---
id: REQ-051
title: "Add --fixtures flag"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-043]
batch: "test-results-phase-3"
source_step: "3.4"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Add --fixtures flag (Step 3.4)

## What
Add `--fixtures` flag that displays a full inventory of all test fixture files with their modification times and the test that generates them.

## Checklist
- [ ] Walk `web/test-fixtures/` recursively, list all files with mtime
- [ ] Annotate auto-generated files with their generating test (hardcoded known locations + mtime heuristic for unknown)
- [ ] TEST: `npm run test:results -- --fixtures`

## Blueprint Guidance

| Flag | Behavior |
|------|----------|
| `--fixtures` | Full fixture inventory with mtimes and generating test |

## Context
- **Document set**: test-results
- **Phase**: 3 — Remaining Viewer Flags
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-043 (core viewer). Phase 1 must be complete.

---
*Source: docs/test-results-TODO.md, Step 3.4*
