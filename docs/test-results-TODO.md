# Test Results Viewer — TODO

> Blueprint: [`docs/test-results-BLUEPRINT.md`](test-results-BLUEPRINT.md)
>
> Tracks implementation of `npm run test:results` convenience command and fixture linkage in test summaries.

---

## Phase 1: Core Viewer Script

- [x] **[Opus 4.5]** 1.1 Create `web/scripts/test-results.ts` with default mode (latest run summary)
  - [x] Add `log()`, ANSI color helpers matching existing script conventions
  - [x] Parse CLI args (`--list`, `--run`, `--full`, `--log`, `--fixtures`, `--diff`, `--json`)
  - [x] Implement `findLatestArchive()` — sort `do-work/archive/test-runs/` lexicographically
  - [x] Implement `parseSummaryFrontmatter()` — regex-based YAML extraction (timestamp, suites_run, overall, gcp_available, triggered_by, release_candidate)
  - [x] Implement `parseSummaryTable()` — extract suite rows (name, status, passed, failed, skipped, duration)
  - [x] Implement `parseFixtureUpdates()` — extract Fixture Updates section (added in Phase 2)
  - [x] Print formatted terminal output: header, summary table, fixture updates, archive path
  - [x] TEST: Run against existing archives in `do-work/archive/test-runs/`

- [x] **[Opus 4.5]** 1.2 Add `--list` mode
  - [x] Scan all archive directories, parse each `summary.md` frontmatter
  - [x] Print reverse-chronological table: timestamp, overall status, suites run
  - [x] TEST: Verify all 7+ existing archives appear correctly

## Phase 2: Fixture Mtime Tracking in Test Runner

- [x] **[Opus 4.5]** 2.1 Add fixture snapshot functions to `web/scripts/test-all.ts`
  - [x] Add `snapshotFixtureMtimes()` — walk `web/test-fixtures/` recursively, return `Map<string, number>`
  - [x] Add `diffFixtureMtimes()` — compare before/after snapshots, return changed files with type (created/updated)
  - [x] Add `attributeSuiteToFixture()` — use suite start/end timestamps for attribution
  - [x] Add `fixtureUpdates` field to `ArchiveOptions` interface

- [x] **[Opus 4.5]** 2.2 Write Fixture Updates section in `summary.md`
  - [x] Insert `## Fixture Updates` section after Test Index in `writeArchive()`
  - [x] Table format: File | Suite | Type
  - [x] Count footer: `_N fixture(s) updated during this run._`
  - [x] Handle zero-update case: `No fixtures were updated during this run.`

- [x] **[Opus 4.5]** 2.3 Wire mtime tracking into `main()`
  - [x] Snapshot before suite execution (~line 1000)
  - [x] Diff after suite execution (~line 1038)
  - [x] Pass `fixtureUpdates` to `writeArchive()`
  - [x] TEST: Run `npm run test:all -- --unit --no-gcp` and verify Fixture Updates section in new `summary.md`

## Phase 3: Remaining Viewer Flags

- [x] **[Sonnet 4]** 3.1 Add `--full` flag (include test index)
  - [x] Parse `## Test Index` section from `summary.md`
  - [x] Append test index table to default output
  - [x] TEST: `npm run test:results -- --full`

- [x] **[Sonnet 4]** 3.2 Add `--log <suite>` flag
  - [x] Resolve `<suite>.log` path in selected archive directory
  - [x] Print raw log contents (or error if file missing / suite was skipped)
  - [x] TEST: `npm run test:results -- --log unit-tests`

- [x] **[Sonnet 4]** 3.3 Add `--run <timestamp>` flag
  - [x] Partial match on archive directory name (e.g. `2026-02-09` matches first dir starting with that prefix)
  - [x] Error if no match or ambiguous match
  - [x] TEST: `npm run test:results -- --run 2026-02-09`

- [x] **[Sonnet 4]** 3.4 Add `--fixtures` flag (fixture inventory)
  - [x] Walk `web/test-fixtures/` recursively, list all files with mtime
  - [x] Annotate auto-generated files with their generating test (hardcoded known locations + mtime heuristic for unknown)
  - [x] TEST: `npm run test:results -- --fixtures`

- [x] **[Sonnet 4]** 3.5 Add `--diff` flag (compare latest two runs)
  - [x] Find two most recent archives
  - [x] Compare: suites that changed status, pass/fail count deltas, duration deltas
  - [x] Print side-by-side comparison
  - [x] TEST: `npm run test:results -- --diff`

- [x] **[Sonnet 4]** 3.6 Add `--json` flag
  - [x] Output parsed summary as JSON object (frontmatter + suite results + fixture updates)
  - [x] TEST: `npm run test:results -- --json | node -e "JSON.parse(require('fs').readFileSync(0,'utf8'))"`

## Phase 4: Registration and Documentation

- [x] **[Sonnet 4]** 4.1 Register npm script in `web/package.json`
  - [x] Add `"test:results": "npx tsx scripts/test-results.ts"` before `test:all`

- [x] **[Sonnet 4]** 4.2 Create user-level instructions in `README_dev_guide.md`
  - [x] Replace "Viewing Previous Results" section with a usage guide for `npm run test:results`
  - [x] Include examples for each flag with expected output descriptions
  - [x] Document common workflows: "check latest results", "compare runs", "debug a suite failure", "see what fixtures changed"
  - [x] Keep Playwright HTML report and `.last-run.json` lines as-is (they serve a different purpose)
  - [x] Update Test Fixtures section to explain that fixture updates now appear automatically in test run summaries

## Phase 5: Verification

- [x] **[Sonnet 4]** 5.1 End-to-end verification
  - [x] Run `npm run test:all -- --unit --no-gcp` to generate fresh archive with Fixture Updates section
  - [x] Run `npm run test:results` — confirm latest summary displayed
  - [x] Run `npm run test:results -- --list` — confirm all archives listed
  - [x] Run `npm run test:results -- --log unit-tests` — confirm raw log output
  - [x] Run `npm run test:results -- --diff` — confirm two-run comparison
  - [x] Run `npm run test:results -- --fixtures` — confirm fixture inventory
  - [x] Run `npm run test:results -- --json` — confirm valid JSON output
