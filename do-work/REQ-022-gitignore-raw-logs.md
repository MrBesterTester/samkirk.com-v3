---
id: REQ-022
title: "Add gitignore for raw logs"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "2.3"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Sonnet 4"
batch: "master-test-phase-2"
related: [REQ-020, REQ-021]
---

# Add gitignore for raw logs (Step 2.3)

## What
Add a `.gitignore` entry to keep raw test log files out of git while allowing the committed `summary.md` files.

## Checklist
- [ ] Add `do-work/archive/test-runs/*/*.log` to `.gitignore`
- [ ] TEST: `git status` does not show `.log` files after a test run

## Blueprint Guidance
- **Goal**: Keep raw logs out of git, commit only summary.md
- **File to modify**: `.gitignore`
- **Implementation**: Add `do-work/archive/test-runs/*/*.log`
- **Test plan**: `git status` does not show `.log` files after a test run

## Context
- **Document set**: master-test
- **Phase**: 2 — Master Test Runner
- **Specification**: See docs/master-test-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Independent of other Phase 2 steps but logically part of the runner setup.

---
*Source: docs/master-test-TODO.md, Step 2.3*
