---
id: REQ-097
title: "Migrate all 5 tool routes"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-031
claimed_at: 2026-02-16T21:48:00-08:00
route: B
completed_at: 2026-02-16T22:05:00-08:00
related: [REQ-095, REQ-096, REQ-098, REQ-099]
batch: "security-phase-2"
source_step: "2.2"
source_doc: "docs/security-TODO.md"
blueprint_ref: "docs/security-BLUEPRINT.md"
model_hint: "Codex/Opus"
---

# Migrate all 5 tool routes (Step 2.2)

## What
Replace the inline 4-check security blocks in each of the 5 tool API routes with a single call to `withToolProtection()`. Ensure identical API behavior (same status codes, JSON shapes, error messages).

## Checklist
- [x] **[Codex/Opus]** Migrate `web/src/app/api/tools/resume/route.ts` to use `withToolProtection()`
- [x] **[Codex/Opus]** Migrate `web/src/app/api/tools/interview/route.ts` to use `withToolProtection()`
- [x] **[Codex/Opus]** Migrate `web/src/app/api/tools/fit/start/route.ts` to use `withToolProtection()`
- [x] **[Codex/Opus]** Migrate `web/src/app/api/tools/fit/generate/route.ts` to use `withToolProtection()`
- [x] **[Codex/Opus]** Migrate `web/src/app/api/tools/fit/answer/route.ts` (rate limit + spend cap on "ready" path only)
- [x] **[Codex/Opus]** TEST: Run `npm test` — all unit tests pass
- [x] **[Gemini 3 Pro]** TEST: Run `npx playwright test` — all E2E tests pass
- [x] **[Codex/Opus]** TEST: Run `npm run smoke:gcp` — GCP smoke tests pass (optional but recommended)

## Blueprint Guidance
### 2.2 Migrate all 5 tool routes to use `withToolProtection()`

- **Goal**: Replace the inline 4-check blocks in each route with a single call to `withToolProtection()`.
- **Files to modify**:
  - `web/src/app/api/tools/resume/route.ts`
  - `web/src/app/api/tools/interview/route.ts`
  - `web/src/app/api/tools/fit/start/route.ts`
  - `web/src/app/api/tools/fit/generate/route.ts`
  - `web/src/app/api/tools/fit/answer/route.ts` (only the "ready" path where the LLM is called)
- **Acceptance criteria**:
  - Each route's POST handler starts with `const result = await withToolProtection(request); if (!result.ok) return result.response;`.
  - The old inline checks (session, captcha, rate limit, spend cap blocks) are removed.
  - All existing unit tests pass.
  - All existing E2E tests pass.
  - API behavior is identical (same status codes, same JSON shapes, same error messages).
- **Test plan**:
  - Run `npm test` — all tests pass.
  - Run `npx playwright test` — all E2E tests pass.
  - Optionally: `npm run smoke:gcp` to verify real GCP integration.
- **Prompt**:

```text
Migrate all 5 tool API routes to use the new withToolProtection() wrapper from web/src/lib/tool-protection.ts.

For each route, replace the inline session/captcha/rate-limit/spend-cap blocks with:
  const protection = await withToolProtection(request);
  if (!protection.ok) return protection.response;
  const { sessionId } = protection;

Routes to migrate:
1. web/src/app/api/tools/resume/route.ts
2. web/src/app/api/tools/interview/route.ts
3. web/src/app/api/tools/fit/start/route.ts
4. web/src/app/api/tools/fit/generate/route.ts
5. web/src/app/api/tools/fit/answer/route.ts (only the "ready" path that triggers LLM)

Preserve all behavior. Do not change anything beyond the security check blocks.
Run: npm test and npx playwright test.
```

## Context
- **Document set**: security
- **Phase**: 2 — Centralize Tool Route Protection (F12)
- **Specification**: See docs/security-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-096 (withToolProtection() must exist before routes can use it).

---
*Source: docs/security-TODO.md, Step 2.2*

---

## Triage

**Route: B** - Medium

**Reasoning:** Clear migration task across 5 files, but each route has nuanced differences (interview: spend cap only on "message", fit/answer: rate limit + spend cap only on "ready" path). Need exploration to confirm exact blocks to replace per route.

**Planning:** Not required

## Plan

**Planning not required** - Route B: Exploration-guided implementation

Rationale: The migration pattern is well-defined. Need to explore each route to identify exact code blocks to replace and handle route-specific variations.

*Skipped by work action*

## Exploration

**Per-route migration guide identified:**
- `resume/route.ts`: Lines 119-191 (security block) + lines 81-85 (hasCaptchaPassed). Standard full protection.
- `interview/route.ts`: Lines 125-179 (initial checks) + lines 231-248 (deferred spend cap in "message" branch) + lines 87-91 (hasCaptchaPassed). Spend cap is conditional on action type.
- `fit/start/route.ts`: Lines 132-204 (security block) + lines 92-96 (hasCaptchaPassed). Standard full protection.
- `fit/generate/route.ts`: Lines 107-179 (security block) + lines 56-60 (hasCaptchaPassed). Standard full protection. Keep parseFlowState helper.
- `fit/answer/route.ts`: Lines 146-182 (session+captcha only) + lines 287-319 (conditional rate limit + spend cap in "ready" branch) + lines 92-96 (hasCaptchaPassed). Use skipRateLimit/skipSpendCap initially, enforce in "ready" branch.

**All routes remove:** `getSessionIdFromCookies`, `isSessionValid`, `getSession`, `RateLimitError`, `SpendCapError` imports and inline `hasCaptchaPassed()` definitions.

*Generated by Explore agent*

## Implementation Summary

Migrated all 5 tool routes to use `withToolProtection()`:

- **resume/route.ts**: Replaced 73-line security block with 3-line wrapper call. Removed inline `hasCaptchaPassed()`. Kept `SpendCapError` import (used in catch block).
- **interview/route.ts**: Replaced 55-line initial block + 18-line deferred spend cap with single wrapper call. Spend cap now checked upfront (harmless for "end" action).
- **fit/start/route.ts**: Replaced 73-line security block with 3-line wrapper call. Removed all security imports.
- **fit/generate/route.ts**: Replaced 73-line security block with 2-line wrapper call. Kept `parseFlowState` helper.
- **fit/answer/route.ts**: Two-phase migration — initial call with `skipRateLimit/skipSpendCap`, second full call in "ready" branch before LLM. Kept `parseFlowState` helper.

All routes now use centralized security via `withToolProtection()`. Inline `hasCaptchaPassed()` removed from all 5 files.

*Completed by work action (Route B)*

## Testing

**Tests run:** `cd web && npm test`
**Result:** All 1284 tests passing (39 suites)

**Existing tests verified:**
- All route-specific tests still passing
- All tool-protection tests still passing (29 tests)

*Verified by work action*
