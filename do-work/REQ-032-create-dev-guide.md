---
id: REQ-032
title: "Create Developer Guide"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "7.2"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Opus 4.5"
batch: "master-test-phase-7"
related: [REQ-031, REQ-033]
---

# Create Developer Guide (Step 7.2)

## What
Create `README_dev_guide.md` at the project root as a standalone reference document for day-to-day test workflows, distilled from BLUEPRINT Phase 7 sections 7.1-7.8.

## Checklist
- [ ] Create `README_dev_guide.md` at project root
- [ ] Write do-work test workflows (new test, fix/rewrite, triage)
- [ ] Write manual verification procedures
- [ ] Write test running commands (release vs debugging)
- [ ] Write suite reference table and conventions
- [ ] Write manual fallback section (`start step` / `continue step`)
- [ ] TEST: All commands in guide match implemented test runner

## Blueprint Guidance
- **Goal**: Create a standalone developer guide at the project root that consolidates the day-to-day test workflows from the blueprint into a reference document
- **File to create**: `README_dev_guide.md` (project root)
- **Content** (distilled from BLUEPRINT sections 7.1-7.8):
  - How do-work handles test work (pipeline overview)
  - Writing a new test (do-work commands + conventions + suite reference table)
  - Fixing or rewriting an existing test (with guiding principles reference)
  - Triage workflows
  - Performing a manual verification (release checklist + failure handling)
  - Running tests (release vs debugging commands)
  - Planned test work from a TODO cycle
  - Manual fallback (`start step` / `continue step`)
- **Key difference from BLUEPRINT Phase 7**: The dev guide is a **reference document** for daily use, not an implementation plan. Written in second-person ("To write a new test, run..."), assumes no context on the Dylan Davis methodology.

## Context
- **Document set**: master-test
- **Phase**: 7 — Developer Workflow
- **Specification**: See docs/master-test-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Depends on Phases 1-6 being complete so the guide accurately reflects the implemented system.

---
*Source: docs/master-test-TODO.md, Step 7.2*
