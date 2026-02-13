---
id: REQ-046
title: "Write Fixture Updates section in summary.md"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-045, REQ-047]
batch: "test-results-phase-2"
source_step: "2.2"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# Write Fixture Updates section in summary.md (Step 2.2)

## What
Modify `writeArchive()` in `web/scripts/test-all.ts` to write a `## Fixture Updates` section in the test run summary, listing which fixtures were created or updated during the run.

## Checklist
- [ ] Insert `## Fixture Updates` section after Test Index in `writeArchive()`
- [ ] Table format: File | Suite | Type
- [ ] Count footer: `_N fixture(s) updated during this run._`
- [ ] Handle zero-update case: `No fixtures were updated during this run.`

## Blueprint Guidance

**In `writeArchive()`** (~line 893, after Test Index): write a new `## Fixture Updates` section:
```markdown
## Fixture Updates

| File | Suite | Type |
|------|-------|------|
| interview-chat/e2e-real-llm-transcript.md | E2E Real LLM | updated |

_1 fixture updated during this run._
```

## Context
- **Document set**: test-results
- **Phase**: 2 — Fixture Mtime Tracking in Test Runner
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-045 (fixture snapshot functions that produce the data to write).

---
*Source: docs/test-results-TODO.md, Step 2.2*
