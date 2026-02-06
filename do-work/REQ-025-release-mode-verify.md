---
id: REQ-025
title: "Release mode verification"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "4.2"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Gemini 3 Pro"
batch: "master-test-phase-4"
related: [REQ-024]
---

# Release mode verification (Step 4.2)

## What
Verify the `--release` mode of the master test runner: all suites must run (no skips allowed), `release_candidate: true` in frontmatter, manual verification checklist printed, and proper exit code behavior.

## Checklist
- [ ] Run `npm run test:all -- --release` with GCP credentials
- [ ] Verify all suites run (no skips allowed)
- [ ] Verify `release_candidate: true` in summary.md frontmatter
- [ ] Verify manual verification checklist printed
- [ ] Verify exit code 1 when suites are skipped (without GCP)

## Blueprint Guidance
- **Goal**: Verify `--release` mode behavior
- **Implementation**:
  1. Run `npm run test:all -- --release` with GCP credentials available
  2. Confirm all suites run (no skips)
  3. Confirm `release_candidate: true` in summary.md frontmatter
  4. Confirm manual verification checklist is printed
  5. Confirm exit code is 1 if any suite was skipped
- **Test plan**: Run with and without GCP credentials, verify different behaviors

## Context
- **Document set**: master-test
- **Phase**: 4 — Verification and Integration
- **Specification**: See docs/master-test-SPECIFICATION.md for full requirements (Section 5.5 Release Gate)
- **Model recommendation**: Gemini 3 Pro (advisory — use if your tool supports model selection)

## Dependencies
Depends on Phases 1-3 being complete. Step 4.1 should run first as a sanity check.

---
*Source: docs/master-test-TODO.md, Step 4.2*
