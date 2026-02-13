---
id: REQ-048
title: "Add --full flag"
status: completed
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
claimed_at: 2026-02-13T18:43:00Z
route: B
completed_at: 2026-02-13T18:50:00Z
related: [REQ-043]
batch: "test-results-phase-3"
source_step: "3.1"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Add --full flag (Step 3.1)

## What
Add `--full` flag to test-results viewer that includes the test index section from the summary alongside the default output.

## Checklist
- [x] Parse `## Test Index` section from `summary.md`
- [x] Append test index table to default output
- [x] TEST: `npm run test:results -- --full`

## Blueprint Guidance

| Flag | Behavior |
|------|----------|
| `--full` | Also print the test index section |

## Context
- **Document set**: test-results
- **Phase**: 3 — Remaining Viewer Flags
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-043 (core viewer). Phase 1 must be complete.

---

## Triage

**Route: B** - Medium

**Reasoning:** Clear feature, but need to understand the viewer's current structure and summary.md format.

**Planning:** Not required

## Plan

**Planning not required** - Route B: Exploration-guided implementation

Rationale: Simple flag addition with clear behavior. Just need to find the viewer code and summary format.

*Skipped by work action*

## Exploration

- Viewer at `web/scripts/test-results.ts`
- `--full` placeholder at lines 497–500 (exits with "not implemented yet")
- `printDefaultView()` renders the main output at line 555
- `## Test Index` section in summary.md contains a table of File | Describe Blocks
- `parseTestIndex()` and `printTestIndex()` needed as new functions

*Explored directly by work action*

## Implementation Summary

- Added `parseTestIndex()` to extract Test Index rows from summary.md
- Added `TestIndexRow` interface: `{ path, describes }`
- Added `printTestIndex()` to render the test index in formatted terminal output
- Replaced `--full` early-exit stub with actual implementation
- When `--full` is passed, test index section prints after the default view

*Completed by work action (Route B)*

## Testing

**Tests run:** `npx tsc --noEmit` + `npx tsx scripts/test-results.ts --full`
**Result:** Type-check clean, `--full` flag displays test index after default summary

*Verified by work action*

---
*Source: docs/test-results-TODO.md, Step 3.1*
