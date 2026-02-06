---
id: REQ-028
title: "Create test catalog"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "6.1"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Codex/Opus"
batch: "master-test-phase-6"
related: [REQ-029, REQ-030]
---

# Create test catalog (Step 6.1)

## What
Create `docs/test-catalog.md` with structured metadata for all tests across all suites, using sequential TEST-XXX IDs and the metadata format from SPECIFICATION section 5.3.

## Checklist
- [ ] Create `docs/test-catalog.md`
- [ ] Catalog all unit tests with TEST-XXX IDs and metadata
- [ ] Catalog all E2E tests with metadata
- [ ] Catalog smoke tests and E2E Real LLM tests with metadata
- [ ] TEST: Every test file has a corresponding catalog entry

## Blueprint Guidance
- **Goal**: Create `docs/test-catalog.md` with metadata for all tests
- **File to create**: `docs/test-catalog.md`
- **Implementation**:
  - Catalog every existing test using the metadata format from SPECIFICATION section 5.3
  - Assign sequential TEST-XXX IDs
  - Include: headline, description, type, suite, features covered, implementation file, inputs, expected outputs, how to run, GCP required
- **Test plan**: Every test file has a corresponding catalog entry; every entry has all required fields

## Context
- **Document set**: master-test
- **Phase**: 6 — Documentation
- **Specification**: See docs/master-test-SPECIFICATION.md Section 5.3 (Test and Verification Metadata)
- **Model recommendation**: Codex/Opus (advisory — use if your tool supports model selection)

## Dependencies
Phase 5 (triage) should complete first so the catalog reflects the final state of tests after triage decisions.

---
*Source: docs/master-test-TODO.md, Step 6.1*
