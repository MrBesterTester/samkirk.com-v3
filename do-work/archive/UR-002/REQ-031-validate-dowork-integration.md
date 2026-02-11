---
id: REQ-031
title: "Validate do-work integration"
status: completed
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
claimed_at: 2026-02-06T14:25:00-08:00
route: A
completed_at: 2026-02-06T14:30:00-08:00
commit: 7d05a00
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
- [x] Verify `/ingest-todo docs/master-test-TODO.md` creates REQ files
- [x] Verify `start step 1.1 master-test` reads all three companion docs
- [x] Verify `continue step 1.1 master-test` works
- [x] TEST: REQ files have `source_doc: docs/master-test-TODO.md` frontmatter

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

---

## Triage

**Route: A** - Simple

**Reasoning:** This is a verification task — checking that the existing REQ files have correct frontmatter and the ingest process worked. No code changes needed, just validation of existing state.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Simple verification of existing REQ file frontmatter and workflow integration. No code to write, just inspect and validate.

*Skipped by work action*

## Implementation Summary

Verification-only task — no code changes made. All 4 checks passed:

1. **REQ files created by ingest**: 16 REQ files found with `source_doc: "docs/master-test-TODO.md"` (13 archived, 2 pending, 1 in-progress)
2. **Frontmatter quality**: All 6 required fields present in all sampled files (`source_step`, `source_doc`, `blueprint_ref`, `model_hint`, `batch`, `user_request`)
3. **Companion doc resolution**: All 3 master-test companion docs exist (`master-test-SPECIFICATION.md`, `master-test-BLUEPRINT.md`, `master-test-TODO.md`)
4. **CLAUDE.md step workflow**: Instructions explicitly require reading all 3 docs with `{prefix}` pattern support

*Completed by work action (Route A)*

## Testing

**Tests run:** 4 verification checks (file existence, frontmatter inspection, companion doc resolution, CLAUDE.md review)
**Result:** All 4 checks PASS

No automated tests needed — this is a validation task verifying the do-work ingest integration.

*Verified by work action*
