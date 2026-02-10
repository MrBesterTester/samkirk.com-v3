---
id: UR-002
title: "Ingest: master-test TODO (16 steps)"
created_at: 2026-02-06T12:00:00-08:00
requests: [REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027, REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, REQ-033]
word_count: 1180
---

# Ingest: master-test TODO

## Summary
Ingested 16 unchecked steps from docs/master-test-TODO.md into do-work REQ files.
Document set: master-test-SPECIFICATION.md, master-test-BLUEPRINT.md, master-test-TODO.md.

## Extracted Requests

| ID | Step | Title | Model Hint |
|----|------|-------|------------|
| REQ-018 | 1.1 | Add skip guard to route.test.ts | Sonnet 4 |
| REQ-019 | 1.2 | Add skip guard to full-app.spec.ts | Sonnet 4 |
| REQ-020 | 2.1 | Create test-all.ts | Opus 4.5 |
| REQ-021 | 2.2 | Add test:all script to package.json | Sonnet 4 |
| REQ-022 | 2.3 | Add gitignore for raw logs | Sonnet 4 |
| REQ-023 | 3.1 | Implement archive writing in test-all.ts | Opus 4.5 |
| REQ-024 | 4.1 | Full verification run | Gemini 3 Pro |
| REQ-025 | 4.2 | Release mode verification | Gemini 3 Pro |
| REQ-026 | 5.1 | Triage route.test.ts tests (3 tests) | Opus 4.5 |
| REQ-027 | 5.2 | Triage full-app.spec.ts tests (4 tests) | Opus 4.5 |
| REQ-028 | 6.1 | Create test catalog | Codex/Opus |
| REQ-029 | 6.2 | Create feature-test matrix | Codex/Opus |
| REQ-030 | 6.3 | Create verification registry | Codex/Opus |
| REQ-031 | 7.1 | Validate do-work integration | Codex/Opus |
| REQ-032 | 7.2 | Create Developer Guide | Opus 4.5 |
| REQ-033 | 7.3 | Update root README.md with dev guide link | Sonnet 4 |

## Full Verbatim Input

# Master Test Suite for samkirk-v3 — TODO

> Generated from `docs/master-test-BLUEPRINT.md` per the Dylan Davis methodology.
>
> **Model labels** follow the heuristics:
> - **[Opus 4.5]** — Backend logic, script creation, TypeScript implementation
> - **[Sonnet 4]** — Quick fixes, skip guards, config changes
> - **[Gemini 3 Pro]** — Debugging, visual testing, E2E verification
> - **[Codex/Opus]** — File operations, documentation, catalog creation

---

## Phase 1 — Skip Guards

### 1.1 Add skip guard to `route.test.ts`

- [x] **[Sonnet 4]** Add `hasGcpCredentials()` check at top of file
- [x] **[Sonnet 4]** Move `getPublicBucket()` from describe-scope into `beforeAll` behind guard
- [x] **[Sonnet 4]** Add `it.skipIf(!gcpAvailable)` to all 3 test cases
- [x] **[Sonnet 4]** Guard `beforeAll`/`afterAll` bodies with early return
- [x] **[Sonnet 4]** TEST: `npm test` — 1225+ pass, 0 fail (3 extra skips)

### 1.2 Add skip guard to `full-app.spec.ts`

- [x] **[Sonnet 4]** Add `dotenv` config loading at top
- [x] **[Sonnet 4]** Add `const gcpAvailable = Boolean(process.env.GCP_PROJECT_ID)`
- [x] **[Sonnet 4]** Add `test.skip(!gcpAvailable, "Requires GCP credentials")` to 4 tests
- [x] **[Sonnet 4]** TEST: `npm run test:e2e` — 24+ pass, 0 fail (4 skips)

---

## Phase 2 — Master Test Runner

### 2.1 Create `test-all.ts`

- [x] **[Opus 4.5]** Create `web/scripts/test-all.ts` with CLI arg parsing
- [x] **[Opus 4.5]** Implement GCP credential auto-detection
- [x] **[Opus 4.5]** Implement sequential suite execution via `child_process.spawn`
- [x] **[Opus 4.5]** Parse test counts from Vitest and Playwright stdout patterns
- [x] **[Opus 4.5]** Build test index (scan for `describe`/`test.describe` strings)
- [x] **[Opus 4.5]** Print colored summary table to console
- [x] **[Opus 4.5]** Implement `--release` mode (implies `--gcp`, no-skip, verification checklist)
- [x] **[Opus 4.5]** TEST: `npm run test:all -- --unit --e2e` runs and produces output

### 2.2 Add `test:all` script to package.json

- [x] **[Sonnet 4]** Add `"test:all": "npx tsx scripts/test-all.ts"` to `web/package.json`
- [x] **[Sonnet 4]** TEST: `npm run test:all -- --unit` works

### 2.3 Add gitignore for raw logs

- [x] **[Sonnet 4]** Add `do-work/archive/test-runs/*/*.log` to `.gitignore`
- [x] **[Sonnet 4]** TEST: `git status` does not show `.log` files after a test run

---

## Phase 3 — Test Results Archive

### 3.1 Implement archive writing in `test-all.ts`

- [x] **[Opus 4.5]** Create archive directory `do-work/archive/test-runs/YYYY-MM-DD_HH-MM-SS/`
- [x] **[Opus 4.5]** Write `summary.md` with frontmatter (timestamp, triggered_by, gcp_available, overall)
- [x] **[Opus 4.5]** Write summary table and test index to `summary.md`
- [x] **[Opus 4.5]** Write raw logs per suite (gitignored)
- [x] **[Opus 4.5]** Implement `--ref` flag for REQ cross-linking
- [x] **[Opus 4.5]** Implement `--no-archive` flag to skip writing
- [x] **[Opus 4.5]** If `--release`: include `release_candidate: true` in frontmatter
- [x] **[Opus 4.5]** TEST: `npm run test:all` — archives `summary.md` to `do-work/archive/test-runs/`

---

## Phase 4 — Verification and Integration

### 4.1 Full verification run

- [x] **[Gemini 3 Pro]** Run `npm run test:all` and verify console output format
- [x] **[Gemini 3 Pro]** Verify `summary.md` written to archive with correct content
- [x] **[Gemini 3 Pro]** Verify raw logs written but gitignored
- [x] **[Gemini 3 Pro]** Verify exit code behavior (0 on pass, 1 on fail)

### 4.2 Release mode verification

- [x] **[Gemini 3 Pro]** Run `npm run test:all -- --release` with GCP credentials
- [x] **[Gemini 3 Pro]** Verify all suites run (no skips allowed)
- [x] **[Gemini 3 Pro]** Verify `release_candidate: true` in summary.md frontmatter
- [x] **[Gemini 3 Pro]** Verify manual verification checklist printed
- [x] **[Gemini 3 Pro]** Verify exit code 1 when suites are skipped (without GCP)

---

## Phase 5 — Triage (Task B)

### 5.1 Triage `route.test.ts` tests (3 tests)

- [x] **[Opus 4.5]** Evaluate test #1 ("serve existing file") — overlap with smoke-gcp Section 1?
- [x] **[Opus 4.5]** Evaluate test #2 ("return 404") — candidate for mock-based rewrite?
- [x] **[Opus 4.5]** Evaluate test #3 ("block traversal") — convert to pure unit test
- [x] **[Opus 4.5]** Implement triage decisions (keep/rewrite/delete per test)
- [x] **[Gemini 3 Pro]** TEST: `npm run test:all` — no regressions after triage

### 5.2 Triage `full-app.spec.ts` tests (4 tests)

- [x] **[Opus 4.5]** Evaluate tests #4-6 ("captcha gate loads") — redundant with dedicated spec files?
- [x] **[Opus 4.5]** Evaluate test #7 ("session init") — overlap with smoke-gcp Section 3?
- [x] **[Opus 4.5]** Implement triage decisions (keep/rewrite/delete per test)
- [x] **[Gemini 3 Pro]** TEST: `npm run test:all` — no regressions after triage

---

## Phase 6 — Documentation

### 6.1 Create test catalog

- [x] **[Codex/Opus]** Create `docs/test-catalog.md`
- [x] **[Codex/Opus]** Catalog all unit tests with TEST-XXX IDs and metadata
- [x] **[Codex/Opus]** Catalog all E2E tests with metadata
- [x] **[Codex/Opus]** Catalog smoke tests and E2E Real LLM tests with metadata
- [x] **[Codex/Opus]** TEST: Every test file has a corresponding catalog entry

### 6.2 Create feature-test matrix

- [x] **[Codex/Opus]** Create `docs/feature-test-matrix.md`
- [x] **[Codex/Opus]** Extract features from `docs/SPECIFICATION.md`
- [x] **[Codex/Opus]** Map each feature to test(s) and/or verification(s)
- [x] **[Codex/Opus]** Identify and document coverage gaps
- [x] **[Codex/Opus]** TEST: No feature row is empty

### 6.3 Create verification registry

- [x] **[Codex/Opus]** Create `docs/verification-registry.md`
- [x] **[Codex/Opus]** Document VER-001: Visual inspect resume PDF layout
- [x] **[Codex/Opus]** Document VER-002: OAuth flow in fresh browser session
- [x] **[Codex/Opus]** Document VER-003: Cloud Run deployment serves traffic
- [x] **[Codex/Opus]** TEST: Runner `--release` output references registry entries

---

## Phase 7 — Developer Workflow

### 7.1 Validate do-work integration

- [x] **[Codex/Opus]** Verify `/ingest-todo docs/master-test-TODO.md` creates REQ files
- [x] **[Codex/Opus]** Verify `start step 1.1 master-test` reads all three companion docs
- [x] **[Codex/Opus]** Verify `continue step 1.1 master-test` works
- [x] **[Codex/Opus]** TEST: REQ files have `source_doc: docs/master-test-TODO.md` frontmatter

### 7.2 Create Developer Guide

- [x] **[Opus 4.5]** Create `README_dev_guide.md` at project root
- [x] **[Opus 4.5]** Write do-work test workflows (new test, fix/rewrite, triage)
- [x] **[Opus 4.5]** Write manual verification procedures
- [x] **[Opus 4.5]** Write test running commands (release vs debugging)
- [x] **[Opus 4.5]** Write suite reference table and conventions
- [x] **[Opus 4.5]** Write manual fallback section (`start step` / `continue step`)
- [x] **[Opus 4.5]** TEST: All commands in guide match implemented test runner

### 7.3 Update root README.md with dev guide link

- [x] **[Sonnet 4]** Add `[Developer Guide](README_dev_guide.md)` link to Testing section or Key docs list
- [x] **[Sonnet 4]** Update Testing section commands to include `npm run test:all`
- [x] **[Sonnet 4]** TEST: Link resolves correctly

---

## Summary

| Phase | Focus | Primary Model |
|-------|-------|---------------|
| 1 | Skip Guards | Sonnet 4 |
| 2 | Master Test Runner | Opus 4.5 |
| 3 | Test Results Archive | Opus 4.5 |
| 4 | Verification & Integration | Gemini 3 Pro |
| 5 | Triage (Task B) | Opus 4.5 + Gemini 3 Pro |
| 6 | Documentation | Codex/Opus |
| 7 | Developer Workflow | Codex/Opus |

---

**Workflow reminder:** After completing each step, check off items here. Use `/ingest-todo docs/master-test-TODO.md` to process via do-work, or `start step X.Y master-test` for manual fallback.

---
*Captured: 2026-02-06T12:00:00-08:00*
