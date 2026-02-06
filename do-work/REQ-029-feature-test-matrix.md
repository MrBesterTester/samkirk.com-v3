---
id: REQ-029
title: "Create feature-test matrix"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "6.2"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Codex/Opus"
batch: "master-test-phase-6"
related: [REQ-028, REQ-030]
---

# Create feature-test matrix (Step 6.2)

## What
Create `docs/feature-test-matrix.md` mapping every feature from SPECIFICATION.md to its tests and/or verifications, identifying and documenting coverage gaps.

## Checklist
- [ ] Create `docs/feature-test-matrix.md`
- [ ] Extract features from `docs/SPECIFICATION.md`
- [ ] Map each feature to test(s) and/or verification(s)
- [ ] Identify and document coverage gaps
- [ ] TEST: No feature row is empty

## Blueprint Guidance
- **Goal**: Create `docs/feature-test-matrix.md` mapping features to tests
- **File to create**: `docs/feature-test-matrix.md`
- **Implementation**:
  - Extract features from `docs/SPECIFICATION.md`
  - Map each feature to its test(s) and/or verification(s) from the catalog
  - Identify coverage gaps (features with no tests)
  - Format per SPECIFICATION section 5.4 rules
- **Test plan**: No feature row is empty; every test appears in at least one feature row

## Context
- **Document set**: master-test
- **Phase**: 6 — Documentation
- **Specification**: See docs/master-test-SPECIFICATION.md Section 5.4 (Feature-Test Matrix)
- **Model recommendation**: Codex/Opus (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-028 (Step 6.1) — the test catalog must exist to map features to tests.

---
*Source: docs/master-test-TODO.md, Step 6.2*
