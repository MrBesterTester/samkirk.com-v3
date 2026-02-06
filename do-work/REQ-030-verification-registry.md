---
id: REQ-030
title: "Create verification registry"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "6.3"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Codex/Opus"
batch: "master-test-phase-6"
related: [REQ-028, REQ-029]
---

# Create verification registry (Step 6.3)

## What
Create `docs/verification-registry.md` documenting the manual verification procedures (VER-001 through VER-003) with full metadata per SPECIFICATION section 5.3.

## Checklist
- [ ] Create `docs/verification-registry.md`
- [ ] Document VER-001: Visual inspect resume PDF layout
- [ ] Document VER-002: OAuth flow in fresh browser session
- [ ] Document VER-003: Cloud Run deployment serves traffic
- [ ] TEST: Runner `--release` output references registry entries

## Blueprint Guidance
- **Goal**: Create `docs/verification-registry.md` for manual verification procedures
- **File to create**: `docs/verification-registry.md`
- **Implementation**:
  - Document initial verifications: VER-001 (PDF layout), VER-002 (OAuth flow), VER-003 (Cloud Run deployment)
  - Use the metadata format from SPECIFICATION section 5.3 (verification variant)
  - Include step-by-step procedures for each
- **Test plan**: The master test runner's `--release` output references these entries

## Context
- **Document set**: master-test
- **Phase**: 6 — Documentation
- **Specification**: See docs/master-test-SPECIFICATION.md Section 5.3 (verification metadata fields)
- **Model recommendation**: Codex/Opus (advisory — use if your tool supports model selection)

## Dependencies
Can be done in parallel with other Phase 6 steps. The runner (Phase 2-3) should reference these entries in `--release` output.

---
*Source: docs/master-test-TODO.md, Step 6.3*
