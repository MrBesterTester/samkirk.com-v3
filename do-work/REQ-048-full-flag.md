---
id: REQ-048
title: "Add --full flag"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
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
- [ ] Parse `## Test Index` section from `summary.md`
- [ ] Append test index table to default output
- [ ] TEST: `npm run test:results -- --full`

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
*Source: docs/test-results-TODO.md, Step 3.1*
