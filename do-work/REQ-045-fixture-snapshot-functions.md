---
id: REQ-045
title: "Add fixture snapshot functions"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-046, REQ-047]
batch: "test-results-phase-2"
source_step: "2.1"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Add fixture snapshot functions (Step 2.1)

## What
Add fixture mtime tracking functions to `web/scripts/test-all.ts` so that test run summaries can record which fixtures were created or updated during a run.

## Checklist
- [ ] Add `snapshotFixtureMtimes()` — walk `web/test-fixtures/` recursively, return `Map<string, number>`
- [ ] Add `diffFixtureMtimes()` — compare before/after snapshots, return changed files with type (created/updated)
- [ ] Add `attributeSuiteToFixture()` — use suite start/end timestamps for attribution
- [ ] Add `fixtureUpdates` field to `ArchiveOptions` interface

## Blueprint Guidance

### 2. Modify: `web/scripts/test-all.ts` (+~80 lines)

Add fixture mtime tracking so summary.md records which fixtures were updated.

**Before suites run** (~line 1000): snapshot mtimes of all files in `web/test-fixtures/` recursively via a new `snapshotFixtureMtimes()` function (~20 lines).

**After suites complete** (~line 1038): diff mtimes via `diffFixtureMtimes()` (~25 lines). Attribute each changed fixture to the suite that was running when it changed (suites run sequentially, so timestamp windows are unambiguous).

Changes to `ArchiveOptions` interface (line 817): add `fixtureUpdates` field.

## Context
- **Document set**: test-results
- **Phase**: 2 — Fixture Mtime Tracking in Test Runner
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Independent of Phase 1 (viewer script). REQ-046 and REQ-047 depend on these functions.

---
*Source: docs/test-results-TODO.md, Step 2.1*
