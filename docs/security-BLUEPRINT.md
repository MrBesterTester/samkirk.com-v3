# LLM Cost Security Hardening — Blueprint

This document is the "how" plan for implementing `docs/security-SPECIFICATION.md`. It covers four findings from the security review, ordered by severity and dependency.

> **Methodology note:** Per `docs/Dylan-Davis-50plus-method.md`, the recommended model for Blueprint/Architecture work is **Claude Opus 4.5**.

## Guiding principles

- **Minimal blast radius**: Each step is a small, testable change. No step changes behavior for end users.
- **No new dependencies**: All fixes use existing libraries and patterns already in the codebase.
- **Tests first, then refactor**: Ensure existing tests pass before and after each change.
- **GCP console work is separate**: The billing budget step is a non-code checklist (manual GCP console task).

## Current repo reality (starting point)

- 5 tool API routes, each independently implementing 4 security checks (session, captcha, rate limit, spend cap).
- CAPTCHA bypass triggers on both `E2E_TESTING === "true"` and `NODE_ENV === "development"`.
- App-level spend cap is fully implemented in `web/src/lib/spend-cap.ts` and enforced via `web/src/lib/vertex-ai.ts`.
- GCP Billing Budget is documented in `docs/GCP-DEPLOY.md` Step 11 but not yet configured.
- Hardcoded token pricing constants in `spend-cap.ts`.

## Implementation phases + steps

---

## Phase 1 — Tighten CAPTCHA bypass (F1)

### 1.1 Remove `NODE_ENV` from CAPTCHA bypass condition

- **Goal**: CAPTCHA bypass should only trigger when `E2E_TESTING === "true"`, not when `NODE_ENV === "development"`.
- **Files to modify**:
  - `web/src/lib/captcha.ts` — line 76: `isE2ETestingEnabled()`
  - `web/src/components/ReCaptcha.tsx` — line 204: `isE2ETestingEnabled()`
- **Acceptance criteria**:
  - Both `isE2ETestingEnabled()` functions check only `E2E_TESTING === "true"` (server) / `NEXT_PUBLIC_E2E_TESTING === "true"` (client).
  - `NODE_ENV === "development"` is no longer part of the condition.
  - Existing CAPTCHA unit tests pass.
  - E2E tests still pass (they set `E2E_TESTING=true` explicitly).
- **Test plan**:
  - Run `npm test` — all CAPTCHA tests pass.
  - Run `npx playwright test` — E2E tests pass (they use `E2E_TESTING=true`).
- **Prompt**:

```text
In web/src/lib/captcha.ts, find the isE2ETestingEnabled() function (line 76).
Change it from:
  return process.env.E2E_TESTING === "true" || process.env.NODE_ENV === "development";
To:
  return process.env.E2E_TESTING === "true";

In web/src/components/ReCaptcha.tsx, find the isE2ETestingEnabled() function (around line 204).
Change it from:
  return process.env.NEXT_PUBLIC_E2E_TESTING === "true" || process.env.NODE_ENV === "development";
To:
  return process.env.NEXT_PUBLIC_E2E_TESTING === "true";

Then run: npm test and npm run lint.
```

---

## Phase 2 — Centralize tool route protection (F12)

### 2.1 Create `withToolProtection()` wrapper

- **Goal**: Extract the repeated 4-check pattern (session → captcha → rate limit → spend cap) into a single reusable function.
- **Files to create**:
  - `web/src/lib/tool-protection.ts` — the shared wrapper
- **Design**:
  - Function signature: `withToolProtection(request: NextRequest): Promise<ToolProtectionResult>`
  - `ToolProtectionResult` is either `{ ok: true, sessionId: string }` or `{ ok: false, response: NextResponse }`.
  - On failure, the response is pre-built with the correct status code, error code, and message (matching existing behavior exactly).
  - The wrapper calls, in order:
    1. `getSessionIdFromCookies()` + `isSessionValid()`
    2. `hasCaptchaPassed(sessionId)`
    3. `enforceRateLimit(request)`
    4. `enforceSpendCap()`
- **Acceptance criteria**:
  - The wrapper returns the same HTTP status codes, error codes, and JSON shapes as the existing inline checks.
  - Unit tests cover all 4 failure modes plus the success path.
- **Test plan**:
  - Unit tests for `withToolProtection()` covering: no session, expired session, captcha not passed, rate limited, spend cap exceeded, and success.
  - Run `npm test`.
- **Prompt**:

```text
Create web/src/lib/tool-protection.ts.

Extract the 4-check security pattern from the existing tool routes into a reusable function.
Look at web/src/app/api/tools/resume/route.ts lines 118-191 for the exact pattern to extract.

The function should:
- Accept a NextRequest
- Return { ok: true, sessionId: string } on success
- Return { ok: false, response: NextResponse } on failure, with the exact same status codes, error codes, and JSON shapes as the existing routes

Add unit tests in web/src/lib/tool-protection.test.ts.
Run: npm test and npm run lint.
```

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

---

## Phase 3 — Cost validation script (F7)

### 3.1 Create spend estimation validation script

- **Goal**: Provide a way to compare the app's estimated spend (Firestore `spendMonthly` doc) against actual GCP billing, so pricing drift can be detected.
- **Files to create**:
  - `web/scripts/validate-spend.ts` — reads current month's Firestore spend doc and prints it alongside instructions for checking actual GCP billing.
- **Design**:
  - Read the `spendMonthly/{YYYY-MM}` Firestore document.
  - Print: estimated spend, budget, percentage used, and the hardcoded pricing constants.
  - Print: instructions to compare against GCP Billing console (with a direct URL).
  - Print: a warning if the pricing constants haven't been reviewed in >30 days (based on a `LAST_PRICING_REVIEW` constant in the script).
- **Acceptance criteria**:
  - Script runs with `npx tsx web/scripts/validate-spend.ts`.
  - Output is clear and actionable.
  - No secrets are printed.
- **Test plan**:
  - Run the script locally with GCP credentials.
  - Verify the output includes the expected fields.
- **Prompt**:

```text
Create web/scripts/validate-spend.ts.

This script reads the current month's spend tracking from Firestore and prints a comparison report.

Requirements:
- Import from the existing spend-cap.ts module to reuse types and constants.
- Read spendMonthly/{YYYY-MM} from Firestore.
- Print: estimated spend, budget, % used, pricing constants.
- Print a URL to the GCP Billing console for the project.
- Include a LAST_PRICING_REVIEW date constant; warn if >30 days stale.
- Add a "validate-spend" script to web/package.json.

No unit tests needed (this is a manual validation script).
Run: npm run lint.
```

---

## Phase 4 — GCP Billing Budget (F6)

### 4.1 Configure GCP Billing Budget (non-code, manual)

- **Goal**: Complete the GCP Billing Budget configuration required by the original spec.
- **Reference**: `docs/GCP-DEPLOY.md` Step 11 has the full instructions.
- **Acceptance criteria**:
  - Budget named `samkirk-v3-monthly` exists in GCP console.
  - Amount: $20.00/month.
  - Alert thresholds at 50%, 90%, 100% of actual spend.
  - Email notifications go to `sam@samkirk.com`.
  - Items 11.1 and 11.2 in `docs/GCP-DEPLOY.md` are checked off.
- **Test plan**:
  - Verify budget is visible in GCP Console.
  - Verify a test alert email is received (or check Cloud Monitoring notification channels).
- **Prompt**:

```text
This is a manual step. Follow the instructions in docs/GCP-DEPLOY.md Step 11 (section "11.1-11.2 Create Budget with Email Alerts").

After completing:
- Check off items 11.1 and 11.2 in docs/GCP-DEPLOY.md.
- Check off "Billing budget email notification tested" in the Final Verification section.
```
