---
id: REQ-056
title: "End-to-end verification"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-043, REQ-044, REQ-045, REQ-046, REQ-047, REQ-048, REQ-049, REQ-050, REQ-051, REQ-052, REQ-053, REQ-054, REQ-055]
batch: "test-results-phase-5"
source_step: "5.1"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# End-to-end verification (Step 5.1)

## What
Run the full verification suite to confirm all test-results features work correctly end-to-end, including fixture tracking in test-all.ts and all viewer flags.

## Checklist
- [ ] Run `npm run test:all -- --unit --no-gcp` to generate fresh archive with Fixture Updates section
- [ ] Run `npm run test:results` — confirm latest summary displayed
- [ ] Run `npm run test:results -- --list` — confirm all archives listed
- [ ] Run `npm run test:results -- --log unit-tests` — confirm raw log output
- [ ] Run `npm run test:results -- --diff` — confirm two-run comparison
- [ ] Run `npm run test:results -- --fixtures` — confirm fixture inventory
- [ ] Run `npm run test:results -- --json` — confirm valid JSON output

## Blueprint Guidance

### Verification

1. Run `npm run test:all -- --unit --no-gcp` to generate a fresh archive with the new Fixture Updates section
2. Run `npm run test:results` and confirm it shows the latest summary
3. Run `npm run test:results -- --list` and confirm all archived runs appear
4. Run `npm run test:results -- --log unit-tests` and confirm raw log output
5. Run `npm run test:results -- --diff` and confirm comparison works
6. Run `npm run test:results -- --fixtures` and confirm fixture inventory

## Context
- **Document set**: test-results
- **Phase**: 5 — Verification
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on ALL previous steps (REQ-043 through REQ-055). This is the final verification gate.

---
*Source: docs/test-results-TODO.md, Step 5.1*
