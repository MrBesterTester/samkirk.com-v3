---
id: REQ-024
title: "Full verification run"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "4.1"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Gemini 3 Pro"
batch: "master-test-phase-4"
related: [REQ-025]
---

# Full verification run (Step 4.1)

## What
Run the complete master test suite and verify that all moving parts work: console output format, archive writing, gitignore for raw logs, and exit code behavior.

## Checklist
- [ ] Run `npm run test:all` and verify console output format
- [ ] Verify `summary.md` written to archive with correct content
- [ ] Verify raw logs written but gitignored
- [ ] Verify exit code behavior (0 on pass, 1 on fail)

## Blueprint Guidance
- **Goal**: Run the complete master test suite and verify all moving parts
- **Implementation**:
  1. Run `npm run test:all` (auto-detect GCP)
  2. Confirm console output matches expected format
  3. Confirm `summary.md` written to archive
  4. Confirm raw logs written but gitignored
  5. Confirm exit code behavior (0 on pass, 1 on fail)
- **Test plan**: Manual execution and inspection of all outputs

## Context
- **Document set**: master-test
- **Phase**: 4 — Verification and Integration
- **Specification**: See docs/master-test-SPECIFICATION.md for full requirements
- **Model recommendation**: Gemini 3 Pro (advisory — use if your tool supports model selection)

## Dependencies
Depends on Phases 1-3 being complete (skip guards, test runner, archive writing).

---
*Source: docs/master-test-TODO.md, Step 4.1*
