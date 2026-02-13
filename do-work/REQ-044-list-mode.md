---
id: REQ-044
title: "Add --list mode"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
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
- [ ] Scan all archive directories, parse each `summary.md` frontmatter
- [ ] Print reverse-chronological table: timestamp, overall status, suites run
- [ ] TEST: Verify all 7+ existing archives appear correctly

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
