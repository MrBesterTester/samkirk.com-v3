---
id: REQ-044
title: "Add --list mode"
status: completed
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
claimed_at: 2026-02-13T18:16:00Z
route: A
completed_at: 2026-02-13T18:20:00Z
related: [REQ-043]
batch: "test-results-phase-1"
source_step: "1.2"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Add --list mode (Step 1.2)

## What
Add `--list` flag to the test-results viewer that scans all archived test runs and prints a reverse-chronological table showing timestamp, overall status, and suites run.

## Checklist
- [x] Scan all archive directories, parse each `summary.md` frontmatter
- [x] Print reverse-chronological table: timestamp, overall status, suites run
- [x] TEST: Verify all 7+ existing archives appear correctly

## Blueprint Guidance

| Flag | Behavior |
|------|----------|
| `--list` | List all archived runs (timestamp, status, suites) |

Implementation uses the same `parseSummaryFrontmatter()` function created in Step 1.1, applied to every archive directory in `do-work/archive/test-runs/`.

## Context
- **Document set**: test-results
- **Phase**: 1 — Core Viewer Script
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-043 (core viewer with parseSummaryFrontmatter).

---
*Source: docs/test-results-TODO.md, Step 1.2*

---

## Triage

**Route: A** - Simple

**Reasoning:** Clear feature — add --list flag to existing script using existing parseSummaryFrontmatter(). File to modify is known.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Simple addition to existing script. Uses already-implemented parsing functions. Output format is well-defined.

*Skipped by work action*

## Implementation Summary

- Added `printListView()` function to `web/scripts/test-results.ts`
- Replaced `--list` stub with real implementation
- Scans all archive dirs, parses frontmatter, displays reverse-chronological table
- Colored PASS/FAIL status, shows suites run per archive

*Completed by work action (Route A)*

## Testing

**Tests run:** `npx tsx scripts/test-results.ts --list`
**Result:** ✓ All 7 archives displayed correctly (newest first, colored status)

*Verified by work action*
