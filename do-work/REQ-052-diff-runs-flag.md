---
id: REQ-052
title: "Add --diff flag"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-043]
batch: "test-results-phase-3"
source_step: "3.5"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Add --diff flag (Step 3.5)

## What
Add `--diff` flag that compares the two most recent test runs, showing status changes, pass/fail count deltas, and duration deltas.

## Checklist
- [ ] Find two most recent archives
- [ ] Compare: suites that changed status, pass/fail count deltas, duration deltas
- [ ] Print side-by-side comparison
- [ ] TEST: `npm run test:results -- --diff`

## Blueprint Guidance

| Flag | Behavior |
|------|----------|
| `--diff` | Compare latest two runs (status changes, count deltas) |

## Context
- **Document set**: test-results
- **Phase**: 3 — Remaining Viewer Flags
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-043 (core viewer with parseSummaryTable). Phase 1 must be complete.

---
*Source: docs/test-results-TODO.md, Step 3.5*
