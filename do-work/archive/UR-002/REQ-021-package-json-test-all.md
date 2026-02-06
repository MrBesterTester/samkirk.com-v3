---
id: REQ-021
title: "Add test:all script to package.json"
status: completed
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
claimed_at: 2026-02-06T14:00:00-08:00
route: A
completed_at: 2026-02-06T14:02:00-08:00
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

---

## Triage

**Route: A** - Simple

**Reasoning:** Single config value addition to package.json. File and exact change are explicitly specified.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Adding one npm script line to package.json. No architectural decisions needed.

*Skipped by work action*

## Implementation Summary

- No changes needed — `"test:all": "npx tsx scripts/test-all.ts"` already exists in `web/package.json`
- Script was likely added during REQ-020 (Step 2.1)

*Completed by work action (Route A)*

## Testing

**Tests run:** `npm run test:all`
**Result:** ✓ Master test runner invokes successfully (42 test files discovered, 317 describe blocks)

**Notes:** 2 pre-existing test failures unrelated to this change (GCP auth token issue in route.test.ts, spy expectation mismatch in auth.test.ts)

*Verified by work action*
