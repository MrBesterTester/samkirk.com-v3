---
id: REQ-053
title: "Add --json flag"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-043]
batch: "test-results-phase-3"
source_step: "3.6"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Add --json flag (Step 3.6)

## What
Add `--json` flag that outputs the parsed test summary as a machine-readable JSON object containing frontmatter, suite results, and fixture updates.

## Checklist
- [ ] Output parsed summary as JSON object (frontmatter + suite results + fixture updates)
- [ ] TEST: `npm run test:results -- --json | node -e "JSON.parse(require('fs').readFileSync(0,'utf8'))"`

## Blueprint Guidance

| Flag | Behavior |
|------|----------|
| `--json` | Output parsed summary as JSON |

## Context
- **Document set**: test-results
- **Phase**: 3 — Remaining Viewer Flags
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-043 (core viewer with all parse functions). Phase 1 must be complete.

---
*Source: docs/test-results-TODO.md, Step 3.6*
