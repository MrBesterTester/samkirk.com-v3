---
id: REQ-089
title: Run all tests and fix broken ones
status: done
created_at: 2026-02-14T12:00:00Z
user_request: UR-027
---

# Run All Tests and Fix Broken Ones

## What
Run the full test suite (unit tests via Vitest and E2E tests via Playwright). Identify any failing tests and fix the underlying issues causing failures.

## Context
- Unit tests: `npm test` (Vitest)
- E2E tests: `npx playwright test`
- Real LLM E2E: `npm run test:e2e:real`
- Fix the code causing test failures, not the tests themselves (unless the tests are genuinely wrong)

---
*Source: Please run all the tests and fix any that are broken.*
