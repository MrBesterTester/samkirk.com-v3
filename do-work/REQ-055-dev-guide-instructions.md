---
id: REQ-055
title: "Create dev guide instructions"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-043, REQ-054]
batch: "test-results-phase-4"
source_step: "4.2"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Create dev guide instructions (Step 4.2)

## What
Update `README_dev_guide.md` to replace manual archive inspection commands with a proper usage guide for `npm run test:results`, including examples for each flag and common workflows.

## Checklist
- [ ] Replace "Viewing Previous Results" section with a usage guide for `npm run test:results`
- [ ] Include examples for each flag with expected output descriptions
- [ ] Document common workflows: "check latest results", "compare runs", "debug a suite failure", "see what fixtures changed"
- [ ] Keep Playwright HTML report and `.last-run.json` lines as-is (they serve a different purpose)
- [ ] Update Test Fixtures section to explain that fixture updates now appear automatically in test run summaries

## Blueprint Guidance

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

## Context
- **Document set**: test-results
- **Phase**: 4 — Registration and Documentation
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on all Phase 1-3 steps being complete so the documentation reflects the actual implemented feature.

---
*Source: docs/test-results-TODO.md, Step 4.2*
