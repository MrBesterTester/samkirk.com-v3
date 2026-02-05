---
id: REQ-017
title: "Run existing tests"
status: pending
created_at: 2026-02-05T15:30:00-08:00
user_request: UR-001
source_step: "5.3"
source_doc: "docs/v2-upgrade-TODO.md"
blueprint_ref: "docs/v2-upgrade-BLUEPRINT.md"
model_hint: "Codex/Opus"
batch: "v2-upgrade-phase-5"
related: [REQ-016]
---

# Run existing tests (Step 5.3)

## What
Run all unit tests (`npm test`) and E2E tests (`npm run test:e2e:real`) to verify no regressions from the visual upgrade. Fix any failing tests.

## Checklist
- [ ] **[Codex/Opus]** Run `npm test` — all unit tests pass
- [ ] **[Gemini 3 Pro]** Run `npm run test:e2e:real` — all E2E tests pass
- [ ] **[Codex/Opus]** Fix any failing tests

## Blueprint Guidance
### 5.3 Run existing tests

- **Goal**: Ensure no regressions
- **Acceptance criteria**:
  - All unit tests pass
  - All E2E tests pass
- **Test plan**: `npm test` and `npm run test:e2e:real`
- **Prompt**:

```text
Run all tests to verify no regressions:

cd /Users/sam/Projects/samkirk-v3/web
npm test
npm run test:e2e:real

Fix any failing tests.
```

## Context
- **Document set**: v2-upgrade
- **Phase**: 5 — Cleanup & Verification
- **Specification**: See docs/v2-upgrade-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory — use if your tool supports model selection)

## Dependencies
All phases 0-4 must be complete. Should run after REQ-016 (visual comparison) to catch any last fixes.

---
*Source: docs/v2-upgrade-TODO.md, Step 5.3*
