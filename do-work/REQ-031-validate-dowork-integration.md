---
id: REQ-031
title: "Validate do-work integration"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "7.1"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Codex/Opus"
batch: "master-test-phase-7"
related: [REQ-032, REQ-033]
---

# Validate do-work integration (Step 7.1)

## What
Verify that the do-work integration works correctly with the master-test document set: `/ingest-todo` creates REQ files, `start step` and `continue step` read all three companion docs, and REQ files have proper `source_doc` frontmatter.

## Checklist
- [ ] Verify `/ingest-todo docs/master-test-TODO.md` creates REQ files
- [ ] Verify `start step 1.1 master-test` reads all three companion docs
- [ ] Verify `continue step 1.1 master-test` works
- [ ] TEST: REQ files have `source_doc: docs/master-test-TODO.md` frontmatter

## Blueprint Guidance
This step validates the Dylan Davis bridge integration for the master-test document set. The `/ingest-todo` skill should parse the TODO, resolve the `master-test` prefix to find the companion SPECIFICATION and BLUEPRINT, and create REQ files with proper `source_step`, `source_doc`, `blueprint_ref`, `model_hint`, and `batch` frontmatter.

## Context
- **Document set**: master-test
- **Phase**: 7 — Developer Workflow
- **Specification**: See docs/master-test-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory — use if your tool supports model selection)

## Dependencies
This step is self-referential (it validates the ingest process that created these REQ files). It can be verified after the initial ingest is complete.

---
*Source: docs/master-test-TODO.md, Step 7.1*
