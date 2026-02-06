---
id: REQ-023
title: "Implement archive writing in test-all.ts"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "3.1"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Opus 4.5"
batch: "master-test-phase-3"
related: [REQ-020]
---

# Implement archive writing in test-all.ts (Step 3.1)

## What
Add test results archive functionality to the master test runner: create timestamped archive directories, write `summary.md` with frontmatter, write raw logs per suite (gitignored), and support `--ref` and `--no-archive` flags.

## Checklist
- [ ] Create archive directory `do-work/archive/test-runs/YYYY-MM-DD_HH-MM-SS/`
- [ ] Write `summary.md` with frontmatter (timestamp, triggered_by, gcp_available, overall)
- [ ] Write summary table and test index to `summary.md`
- [ ] Write raw logs per suite (gitignored)
- [ ] Implement `--ref` flag for REQ cross-linking
- [ ] Implement `--no-archive` flag to skip writing
- [ ] If `--release`: include `release_candidate: true` in frontmatter
- [ ] TEST: `npm run test:all` — archives `summary.md` to `do-work/archive/test-runs/`

## Blueprint Guidance
- **Goal**: After all suites complete, write `summary.md` and raw logs to the archive
- **File to modify**: `web/scripts/test-all.ts` (built in Phase 2)
- **Archive directory structure**:
  ```
  do-work/archive/test-runs/
  ├── 2026-02-05_17-30-00/
  │   ├── summary.md       # Layer 1: Audit-friendly (committed)
  │   ├── unit.log         # Layer 2: Raw output (gitignored)
  │   ├── e2e.log
  │   └── smoke.log
  ```
- **summary.md template**: ~50-80 lines with YAML frontmatter (timestamp, triggered_by, release_candidate, gcp_available, suites_run, overall), summary table, test index, manual verifications, and cross-references
- **Cross-linking mechanism**:
  - Forward link (REQ -> test-run): `test-all.ts` accepts `--ref UR-001/REQ-017`
  - Back-link (test-run -> REQ): The `## Testing` section in a REQ file references the summary
  - Ad-hoc runs: `triggered_by` is omitted from frontmatter

## Context
- **Document set**: master-test
- **Phase**: 3 — Test Results Archive
- **Specification**: See docs/master-test-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-020 (Step 2.1) — the test-all.ts script must exist first. Phase 2 should be complete.

---
*Source: docs/master-test-TODO.md, Step 3.1*
