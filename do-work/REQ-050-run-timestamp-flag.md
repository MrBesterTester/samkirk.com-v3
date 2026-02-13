---
id: REQ-050
title: "Add --run timestamp flag"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-043]
batch: "test-results-phase-3"
source_step: "3.3"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Add --run timestamp flag (Step 3.3)

## What
Add `--run <timestamp>` flag that selects a specific archived test run by partial timestamp match instead of defaulting to the latest.

## Checklist
- [ ] Partial match on archive directory name (e.g. `2026-02-09` matches first dir starting with that prefix)
- [ ] Error if no match or ambiguous match
- [ ] TEST: `npm run test:results -- --run 2026-02-09`

## Blueprint Guidance

| Flag | Behavior |
|------|----------|
| `--run <timestamp>` | Show a specific run instead of latest |

## Context
- **Document set**: test-results
- **Phase**: 3 — Remaining Viewer Flags
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-043 (core viewer with findLatestArchive). Phase 1 must be complete.

---
*Source: docs/test-results-TODO.md, Step 3.3*
