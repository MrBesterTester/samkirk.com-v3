---
id: UR-007
title: "Ingest: test-results TODO (14 steps)"
created_at: 2026-02-13T18:00:00Z
requests: [REQ-043, REQ-044, REQ-045, REQ-046, REQ-047, REQ-048, REQ-049, REQ-050, REQ-051, REQ-052, REQ-053, REQ-054, REQ-055, REQ-056]
word_count: 680
---

# Ingest: test-results TODO

## Summary
Ingested 14 unchecked steps from docs/test-results-TODO.md into do-work REQ files.
Document set: test-results-BLUEPRINT.md, test-results-TODO.md (no SPECIFICATION — blueprint serves as spec).

## Extracted Requests

| ID | Step | Title | Model Hint |
|----|------|-------|------------|
| REQ-043 | 1.1 | Create test-results.ts core viewer | Opus 4.5 |
| REQ-044 | 1.2 | Add --list mode | Opus 4.5 |
| REQ-045 | 2.1 | Add fixture snapshot functions | Opus 4.5 |
| REQ-046 | 2.2 | Write Fixture Updates section in summary.md | Opus 4.5 |
| REQ-047 | 2.3 | Wire mtime tracking into main() | Opus 4.5 |
| REQ-048 | 3.1 | Add --full flag | Sonnet 4 |
| REQ-049 | 3.2 | Add --log suite flag | Sonnet 4 |
| REQ-050 | 3.3 | Add --run timestamp flag | Sonnet 4 |
| REQ-051 | 3.4 | Add --fixtures flag | Sonnet 4 |
| REQ-052 | 3.5 | Add --diff flag | Sonnet 4 |
| REQ-053 | 3.6 | Add --json flag | Sonnet 4 |
| REQ-054 | 4.1 | Register npm script | Sonnet 4 |
| REQ-055 | 4.2 | Create dev guide instructions | Sonnet 4 |
| REQ-056 | 5.1 | End-to-end verification | Sonnet 4 |

## Full Verbatim Input

# Test Results Viewer — TODO

> Blueprint: [`docs/test-results-BLUEPRINT.md`](test-results-BLUEPRINT.md)
>
> Tracks implementation of `npm run test:results` convenience command and fixture linkage in test summaries.

---

## Phase 1: Core Viewer Script

- [ ] **[Opus 4.5]** 1.1 Create `web/scripts/test-results.ts` with default mode (latest run summary)
  - [ ] Add `log()`, ANSI color helpers matching existing script conventions
  - [ ] Parse CLI args (`--list`, `--run`, `--full`, `--log`, `--fixtures`, `--diff`, `--json`)
  - [ ] Implement `findLatestArchive()` — sort `do-work/archive/test-runs/` lexicographically
  - [ ] Implement `parseSummaryFrontmatter()` — regex-based YAML extraction (timestamp, suites_run, overall, gcp_available, triggered_by, release_candidate)
  - [ ] Implement `parseSummaryTable()` — extract suite rows (name, status, passed, failed, skipped, duration)
  - [ ] Implement `parseFixtureUpdates()` — extract Fixture Updates section (added in Phase 2)
  - [ ] Print formatted terminal output: header, summary table, fixture updates, archive path
  - [ ] TEST: Run against existing archives in `do-work/archive/test-runs/`

- [ ] **[Opus 4.5]** 1.2 Add `--list` mode
  - [ ] Scan all archive directories, parse each `summary.md` frontmatter
  - [ ] Print reverse-chronological table: timestamp, overall status, suites run
  - [ ] TEST: Verify all 7+ existing archives appear correctly

## Phase 2: Fixture Mtime Tracking in Test Runner

- [ ] **[Opus 4.5]** 2.1 Add fixture snapshot functions to `web/scripts/test-all.ts`
  - [ ] Add `snapshotFixtureMtimes()` — walk `web/test-fixtures/` recursively, return `Map<string, number>`
  - [ ] Add `diffFixtureMtimes()` — compare before/after snapshots, return changed files with type (created/updated)
  - [ ] Add `attributeSuiteToFixture()` — use suite start/end timestamps for attribution
  - [ ] Add `fixtureUpdates` field to `ArchiveOptions` interface

- [ ] **[Opus 4.5]** 2.2 Write Fixture Updates section in `summary.md`
  - [ ] Insert `## Fixture Updates` section after Test Index in `writeArchive()`
  - [ ] Table format: File | Suite | Type
  - [ ] Count footer: `_N fixture(s) updated during this run._`
  - [ ] Handle zero-update case: `No fixtures were updated during this run.`

- [ ] **[Opus 4.5]** 2.3 Wire mtime tracking into `main()`
  - [ ] Snapshot before suite execution (~line 1000)
  - [ ] Diff after suite execution (~line 1038)
  - [ ] Pass `fixtureUpdates` to `writeArchive()`
  - [ ] TEST: Run `npm run test:all -- --unit --no-gcp` and verify Fixture Updates section in new `summary.md`

## Phase 3: Remaining Viewer Flags

- [ ] **[Sonnet 4]** 3.1 Add `--full` flag (include test index)
  - [ ] Parse `## Test Index` section from `summary.md`
  - [ ] Append test index table to default output
  - [ ] TEST: `npm run test:results -- --full`

- [ ] **[Sonnet 4]** 3.2 Add `--log <suite>` flag
  - [ ] Resolve `<suite>.log` path in selected archive directory
  - [ ] Print raw log contents (or error if file missing / suite was skipped)
  - [ ] TEST: `npm run test:results -- --log unit-tests`

- [ ] **[Sonnet 4]** 3.3 Add `--run <timestamp>` flag
  - [ ] Partial match on archive directory name (e.g. `2026-02-09` matches first dir starting with that prefix)
  - [ ] Error if no match or ambiguous match
  - [ ] TEST: `npm run test:results -- --run 2026-02-09`

- [ ] **[Sonnet 4]** 3.4 Add `--fixtures` flag (fixture inventory)
  - [ ] Walk `web/test-fixtures/` recursively, list all files with mtime
  - [ ] Annotate auto-generated files with their generating test (hardcoded known locations + mtime heuristic for unknown)
  - [ ] TEST: `npm run test:results -- --fixtures`

- [ ] **[Sonnet 4]** 3.5 Add `--diff` flag (compare latest two runs)
  - [ ] Find two most recent archives
  - [ ] Compare: suites that changed status, pass/fail count deltas, duration deltas
  - [ ] Print side-by-side comparison
  - [ ] TEST: `npm run test:results -- --diff`

- [ ] **[Sonnet 4]** 3.6 Add `--json` flag
  - [ ] Output parsed summary as JSON object (frontmatter + suite results + fixture updates)
  - [ ] TEST: `npm run test:results -- --json | node -e "JSON.parse(require('fs').readFileSync(0,'utf8'))"`

## Phase 4: Registration and Documentation

- [ ] **[Sonnet 4]** 4.1 Register npm script in `web/package.json`
  - [ ] Add `"test:results": "npx tsx scripts/test-results.ts"` before `test:all`

- [ ] **[Sonnet 4]** 4.2 Create user-level instructions in `README_dev_guide.md`
  - [ ] Replace "Viewing Previous Results" section with a usage guide for `npm run test:results`
  - [ ] Include examples for each flag with expected output descriptions
  - [ ] Document common workflows: "check latest results", "compare runs", "debug a suite failure", "see what fixtures changed"
  - [ ] Keep Playwright HTML report and `.last-run.json` lines as-is (they serve a different purpose)
  - [ ] Update Test Fixtures section to explain that fixture updates now appear automatically in test run summaries

## Phase 5: Verification

- [ ] **[Sonnet 4]** 5.1 End-to-end verification
  - [ ] Run `npm run test:all -- --unit --no-gcp` to generate fresh archive with Fixture Updates section
  - [ ] Run `npm run test:results` — confirm latest summary displayed
  - [ ] Run `npm run test:results -- --list` — confirm all archives listed
  - [ ] Run `npm run test:results -- --log unit-tests` — confirm raw log output
  - [ ] Run `npm run test:results -- --diff` — confirm two-run comparison
  - [ ] Run `npm run test:results -- --fixtures` — confirm fixture inventory
  - [ ] Run `npm run test:results -- --json` — confirm valid JSON output

---
*Captured: 2026-02-13T18:00:00Z*
