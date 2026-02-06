---
id: REQ-033
title: "Update root README.md with dev guide link"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "7.3"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Sonnet 4"
batch: "master-test-phase-7"
related: [REQ-031, REQ-032]
---

# Update root README.md with dev guide link (Step 7.3)

## What
Add a link to `README_dev_guide.md` from the existing root `README.md`, and update the Testing section commands to include `npm run test:all`.

## Checklist
- [ ] Add `[Developer Guide](README_dev_guide.md)` link to Testing section or Key docs list
- [ ] Update Testing section commands to include `npm run test:all`
- [ ] TEST: Link resolves correctly

## Blueprint Guidance
- **Goal**: Add a link to `README_dev_guide.md` from the existing root `README.md`
- **File to modify**: `README.md` (project root — already exists with project overview, testing section, methodology section)
- **Implementation**: Add a link `[Developer Guide](README_dev_guide.md)` to the Testing section or Key docs list. Also update the Testing section's test counts and commands to match the new `npm run test:all` runner.
- **Test plan**: Link resolves correctly from project root

## Context
- **Document set**: master-test
- **Phase**: 7 — Developer Workflow
- **Specification**: See docs/master-test-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-032 (Step 7.2) — the dev guide must exist first.

---
*Source: docs/master-test-TODO.md, Step 7.3*
