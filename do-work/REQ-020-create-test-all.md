---
id: REQ-020
title: "Create test-all.ts"
status: pending
created_at: 2026-02-06T12:00:00-08:00
user_request: UR-002
source_step: "2.1"
source_doc: "docs/master-test-TODO.md"
blueprint_ref: "docs/master-test-BLUEPRINT.md"
model_hint: "Opus 4.5"
batch: "master-test-phase-2"
related: [REQ-021, REQ-022]
---

# Create test-all.ts (Step 2.1)

## What
Create the master test runner script at `web/scripts/test-all.ts` that orchestrates all test suites with CLI argument parsing, GCP credential auto-detection, sequential suite execution, test count parsing, colored summary table output, and `--release` mode.

## Checklist
- [ ] Create `web/scripts/test-all.ts` with CLI arg parsing
- [ ] Implement GCP credential auto-detection
- [ ] Implement sequential suite execution via `child_process.spawn`
- [ ] Parse test counts from Vitest and Playwright stdout patterns
- [ ] Build test index (scan for `describe`/`test.describe` strings)
- [ ] Print colored summary table to console
- [ ] Implement `--release` mode (implies `--gcp`, no-skip, verification checklist)
- [ ] TEST: `npm run test:all -- --unit --e2e` runs and produces output

## Blueprint Guidance
- **Goal**: Single-entry-point test runner that orchestrates all suites
- **File to create**: `web/scripts/test-all.ts` (~250 lines)
- **CLI interface**:
  - `npm run test:all` — all suites, auto-detect GCP
  - `npm run test:all -- --unit` — unit tests only
  - `npm run test:all -- --e2e` — Playwright E2E only
  - `npm run test:all -- --e2e-real` — real LLM E2E (requires GCP + seeded resume)
  - `npm run test:all -- --smoke` — GCP smoke tests
  - `npm run test:all -- --no-gcp` — force-skip all GCP-dependent tests
  - `npm run test:all -- --gcp` — force-include GCP tests (fail if creds bad)
  - `npm run test:all -- --interactive` — e2e runs in Playwright UI mode
  - `npm run test:all -- --verbose` — stream child process stdout in real time
  - `npm run test:all -- --release` — release-qualifying run
  - `npm run test:all -- --ref UR-XXX/REQ-YYY` — cross-link to work unit
  - `npm run test:all -- --no-archive` — skip writing to archive (dry run)
- **Architecture**:
  1. Parse CLI args (including `--release` which implies `--gcp` and all-suites)
  2. Load `dotenv` from `.env.local`
  3. Detect GCP credentials (check env vars + lightweight `bucket.exists()` call)
  4. If `--release`: fail immediately if GCP credentials are missing
  5. Run selected suites sequentially via `child_process.spawn`
  6. Parse test counts from stdout (Vitest pattern: `Tests 1225 passed`; Playwright pattern: `24 passed`)
  7. Build test index: scan test files for top-level `describe("...")` / `test.describe("...")` strings
  8. Print colored summary table to console
  9. If `--release`: print manual verification checklist from verification registry
  10. Write `summary.md` + raw logs to `do-work/archive/test-runs/YYYY-MM-DD_HH-MM-SS/`
  11. Exit 0 if all passed/skipped, exit 1 if any failed
- **Suite definitions**:
  - Unit Tests: `npx vitest run` (GCP: No)
  - E2E Tests: `npx playwright test` (GCP: No)
  - E2E Real LLM: `npx tsx scripts/e2e-real-llm.ts` (GCP: Yes)
  - GCP Smoke: `npx tsx scripts/smoke-gcp.ts` (GCP: Yes)
- **No new dependencies needed.** Uses `dotenv` (already in devDeps), `child_process`, `@google-cloud/storage` (already in deps).

## Context
- **Document set**: master-test
- **Phase**: 2 — Master Test Runner
- **Specification**: See docs/master-test-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory — use if your tool supports model selection)

## Dependencies
Phase 1 (skip guards) should complete before this step to ensure clean test output. Steps 2.2 and 2.3 depend on this step.

---
*Source: docs/master-test-TODO.md, Step 2.1*
