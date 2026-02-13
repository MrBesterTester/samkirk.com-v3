---
id: REQ-047
title: "Wire mtime tracking into main()"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-045, REQ-046]
batch: "test-results-phase-2"
source_step: "2.3"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Wire mtime tracking into main() (Step 2.3)

## What
Connect the fixture snapshot/diff functions to the main test runner flow: snapshot before suite execution, diff after, and pass the results to `writeArchive()`.

## Checklist
- [ ] Snapshot before suite execution (~line 1000)
- [ ] Diff after suite execution (~line 1038)
- [ ] Pass `fixtureUpdates` to `writeArchive()`
- [ ] TEST: Run `npm run test:all -- --unit --no-gcp` and verify Fixture Updates section in new `summary.md`

## Blueprint Guidance

**Before suites run** (~line 1000): snapshot mtimes of all files in `web/test-fixtures/` recursively via `snapshotFixtureMtimes()`.

**After suites complete** (~line 1038): diff mtimes via `diffFixtureMtimes()`. Attribute each changed fixture to the suite that was running when it changed (suites run sequentially, so timestamp windows are unambiguous).

Pass `fixtureUpdates` to `writeArchive()` via the `ArchiveOptions` interface.

## Context
- **Document set**: test-results
- **Phase**: 2 — Fixture Mtime Tracking in Test Runner
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-045 (functions) and REQ-046 (writeArchive section). This is the integration step that ties Phase 2 together.

---
*Source: docs/test-results-TODO.md, Step 2.3*
