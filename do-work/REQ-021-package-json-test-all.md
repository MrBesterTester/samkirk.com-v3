---
id: REQ-021
title: "Add test:all script to package.json"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "2.2"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Sonnet 4"
batch: "master-test-phase-2"
related: [REQ-020, REQ-022]
---

# Add test:all script to package.json (Step 2.2)

## What
Wire up the `test:all` npm script in `web/package.json` to run the master test runner created in Step 2.1.

## Checklist
- [ ] Add `"test:all": "npx tsx scripts/test-all.ts"` to `web/package.json`
- [ ] TEST: `npm run test:all -- --unit` works

## Blueprint Guidance
- **Goal**: Wire up the npm script
- **File to modify**: `web/package.json`
- **Implementation**: Add `"test:all": "npx tsx scripts/test-all.ts"` to scripts
- **Test plan**: `npm run test:all -- --help` (or `--unit`) works

## Context
- **Document set**: master-test
- **Phase**: 2 — Master Test Runner
- **Specification**: See docs/master-test-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-020 (Step 2.1) — the test-all.ts script must exist first.

---
*Source: docs/master-test-TODO.md, Step 2.2*
