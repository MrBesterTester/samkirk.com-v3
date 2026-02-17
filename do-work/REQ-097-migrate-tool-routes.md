---
id: REQ-097
title: "Migrate all 5 tool routes"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-031
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
- [ ] **[Codex/Opus]** Migrate `web/src/app/api/tools/resume/route.ts` to use `withToolProtection()`
- [ ] **[Codex/Opus]** Migrate `web/src/app/api/tools/interview/route.ts` to use `withToolProtection()`
- [ ] **[Codex/Opus]** Migrate `web/src/app/api/tools/fit/start/route.ts` to use `withToolProtection()`
- [ ] **[Codex/Opus]** Migrate `web/src/app/api/tools/fit/generate/route.ts` to use `withToolProtection()`
- [ ] **[Codex/Opus]** Migrate `web/src/app/api/tools/fit/answer/route.ts` (rate limit + spend cap on "ready" path only)
- [ ] **[Codex/Opus]** TEST: Run `npm test` — all unit tests pass
- [ ] **[Gemini 3 Pro]** TEST: Run `npx playwright test` — all E2E tests pass
- [ ] **[Codex/Opus]** TEST: Run `npm run smoke:gcp` — GCP smoke tests pass (optional but recommended)

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
