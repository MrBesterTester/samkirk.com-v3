---
id: REQ-049
title: "Add --log suite flag"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-043]
batch: "test-results-phase-3"
source_step: "3.2"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Add --log suite flag (Step 3.2)

## What
Add `--log <suite>` flag that prints the raw log file for a specific test suite from the selected archive.

## Checklist
- [ ] Resolve `<suite>.log` path in selected archive directory
- [ ] Print raw log contents (or error if file missing / suite was skipped)
- [ ] TEST: `npm run test:results -- --log unit-tests`

## Blueprint Guidance

| Flag | Behavior |
|------|----------|
| `--log <suite>` | Print raw `.log` file for that suite (e.g. `--log e2e-tests`) |

## Context
- **Document set**: test-results
- **Phase**: 3 — Remaining Viewer Flags
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-043 (core viewer). Phase 1 must be complete.

---
*Source: docs/test-results-TODO.md, Step 3.2*
