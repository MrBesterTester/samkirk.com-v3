---
id: REQ-038
title: Run all tests and fix any failures
status: completed
created_at: 2026-02-12T20:00:00Z
user_request: UR-004
claimed_at: 2026-02-12T21:55:00Z
route: B
completed_at: 2026-02-12T22:20:00Z
---

# Run All Tests and Fix Any Failures

## What
Run the full test suite (unit tests via Vitest and E2E tests via Playwright) and fix any tests that fail.

## Context
- Unit tests: `npm test` (Vitest)
- E2E tests: `npx playwright test`
- Test-all script may exist: `npm run test:all`
- Fix failing tests by addressing root causes, not by disabling or skipping tests

---
*Source: run all the tests and fix any that fail.*

---

## Triage

**Route: B** - Medium

**Reasoning:** Clear task (run tests, fix failures) but need to explore the test infrastructure and understand any failure root causes before fixing.

**Planning:** Not required

## Plan

**Planning not required** - Route B: Exploration-guided implementation

Rationale: The task is straightforward — run test suites, diagnose failures, fix them. Exploration of test output will guide the fixes.

*Skipped by work action*

## Implementation Summary

No code changes were required. All tests pass when run correctly.

- **Unit tests (Vitest):** 38 files, 1232 tests — all passing
- **E2E tests (Playwright):** 47 tests — all passing

The 17 E2E test failures observed initially were an environment issue, not a code bug. The dev server was running without `E2E_TESTING=true` and `NEXT_PUBLIC_E2E_TESTING=true` environment variables. The `ToolGate` component requires these to bypass captcha verification in test mode. When Playwright manages its own server (via the `webServer` config in `playwright.config.ts`), it correctly sets these env vars and all tests pass.

*Completed by work action (Route B)*

## Testing

**Tests run:** `npm test` (Vitest) and `npx playwright test` (Playwright)
**Result:** All tests passing (1232 unit + 47 E2E = 1279 total)

**Root cause of initial E2E failures:** The locally running dev server lacked E2E environment variables (`E2E_TESTING`, `NEXT_PUBLIC_E2E_TESTING`). Playwright's `webServer` config sets these when it launches its own server, but `reuseExistingServer: true` reuses whatever's already running. Killing the existing server and letting Playwright start a fresh one resolved all 17 failures.

*Verified by work action*
