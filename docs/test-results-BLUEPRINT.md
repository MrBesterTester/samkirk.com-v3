# Plan: Improve Test Result Viewing

## Context

Viewing test results today requires manual `ls -t | head -1` followed by `cat` on individual files — too much friction for something done after every test run. Additionally, the test reports have no link between the test fixtures in `web/test-fixtures/` and the tests that generate them. The user suggested a `do work review` parameter but expressed concern about overextending do-work.

## Recommendation: `npm run test:results` (no do-work changes)

Every existing do-work action (do, work, verify, cleanup, version) mutates state — creating REQ files, processing queues, moving archives. "Review test results" is purely read-only. Adding it to do-work would break its conceptual pattern and, since the action would just shell out to an npm script anyway, it adds a routing layer with no benefit. A simple `npm run test:results` is more discoverable (`npm run` lists it), more composable (pipe to `grep`), and requires no skill infrastructure.

---

## Changes

### 1. New file: `web/scripts/test-results.ts` (~250 lines)

Convenience script following existing conventions (`log()` with `✓/✗/→` prefixes, ANSI colors, section headers with `===`).

**Default (no flags)** — shows latest run summary + fixture updates:
```
===================================================================
  LAST TEST RUN: 2026-02-09 17:03:27 PST    Overall: PASS
===================================================================

| Suite          | Status | Passed | Failed | Skipped | Duration |
|----------------|--------|--------|--------|---------|----------|
| Unit Tests     | PASSED |   1231 |      0 |       0 |      14s |
| E2E Tests      | PASSED |     47 |      0 |       0 |      32s |
| ...            |        |        |        |         |          |

  Fixtures Updated:
    interview-chat/e2e-real-llm-transcript.md  (E2E Real LLM)
    interview-chat/e2e-downloaded-bundle.zip   (E2E Tests)

  Archive: do-work/archive/test-runs/2026-02-09_17-03-27/
===================================================================
```

**Supported flags:**

| Flag | Behavior |
|------|----------|
| `--list` | List all archived runs (timestamp, status, suites) |
| `--run <timestamp>` | Show a specific run instead of latest |
| `--full` | Also print the test index section |
| `--log <suite>` | Print raw `.log` file for that suite (e.g. `--log e2e-tests`) |
| `--fixtures` | Full fixture inventory with mtimes and generating test |
| `--diff` | Compare latest two runs (status changes, count deltas) |
| `--json` | Output parsed summary as JSON |

Implementation: parses YAML frontmatter from `summary.md` with regex (no YAML library — frontmatter is 6 simple keys). Reads fixture update data from the new summary section (see change #2).

### 2. Modify: `web/scripts/test-all.ts` (+~80 lines)

Add fixture mtime tracking so summary.md records which fixtures were updated.

**Before suites run** (~line 1000): snapshot mtimes of all files in `web/test-fixtures/` recursively via a new `snapshotFixtureMtimes()` function (~20 lines).

**After suites complete** (~line 1038): diff mtimes via `diffFixtureMtimes()` (~25 lines). Attribute each changed fixture to the suite that was running when it changed (suites run sequentially, so timestamp windows are unambiguous).

**In `writeArchive()`** (~line 893, after Test Index): write a new `## Fixture Updates` section:
```markdown
## Fixture Updates

| File | Suite | Type |
|------|-------|------|
| interview-chat/e2e-real-llm-transcript.md | E2E Real LLM | updated |

_1 fixture updated during this run._
```

Changes to `ArchiveOptions` interface (line 817): add `fixtureUpdates` field.

### 3. Modify: `web/package.json` (+1 line)

Add at line 17 (before `test:all`):
```json
"test:results": "npx tsx scripts/test-results.ts",
```

### 4. Modify: `README_dev_guide.md` — create user-level instructions

Replace the "Viewing Previous Results" section with a proper usage guide for `npm run test:results`. The current section has raw `ls -t` + `cat` commands — replace with:

**Command reference** with examples for each flag:
```bash
npm run test:results                         # Latest run summary + fixture updates
npm run test:results -- --list               # All archived runs
npm run test:results -- --full               # Latest with test index
npm run test:results -- --log e2e-tests      # Raw E2E log output
npm run test:results -- --fixtures           # Fixture inventory
npm run test:results -- --diff               # Compare last two runs
npm run test:results -- --json               # Machine-readable JSON output
```

**Common workflows** section showing task-oriented recipes:
- "Check latest results" → `npm run test:results`
- "Compare runs after a fix" → `npm run test:results -- --diff`
- "Debug a suite failure" → `npm run test:results -- --log <suite>`
- "See what fixtures changed" → `npm run test:results -- --fixtures`

Keep the Playwright HTML report and `.last-run.json` lines as-is (they serve a different purpose).

Update the Test Fixtures section to explain that fixture updates now appear automatically in test run summaries, linking the fixtures back to the tests that generated them.

---

## Implementation Sequence

1. Create `web/scripts/test-results.ts` with basic mode + `--list`
2. Add fixture mtime snapshotting/diffing to `test-all.ts`
3. Add remaining flags (`--full`, `--log`, `--fixtures`, `--diff`, `--json`) to `test-results.ts`
4. Register npm script in `package.json`
5. Update `README_dev_guide.md`

## Verification

1. Run `npm run test:all -- --unit --no-gcp` to generate a fresh archive with the new Fixture Updates section
2. Run `npm run test:results` and confirm it shows the latest summary
3. Run `npm run test:results -- --list` and confirm all archived runs appear
4. Run `npm run test:results -- --log unit-tests` and confirm raw log output
5. Run `npm run test:results -- --diff` and confirm comparison works
6. Run `npm run test:results -- --fixtures` and confirm fixture inventory

## Files

| File | Action |
|------|--------|
| `web/scripts/test-results.ts` | **Create** (~250 lines) |
| `web/scripts/test-all.ts` | **Modify** (+~80 lines around lines 817, 1000, 1038) |
| `web/package.json` | **Modify** (+1 line at line 17) |
| `README_dev_guide.md` | **Modify** (replace ~15 lines in "Viewing Previous Results") |
