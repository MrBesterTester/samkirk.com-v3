# LLM Cost Security Hardening — Implementation TODO

> Generated from `docs/security-BLUEPRINT.md` per the Dylan Davis methodology.
>
> **Model labels** follow the heuristics:
> - **[Codex/Opus]** — Backend logic, refactoring, utilities
> - **[Sonnet 4]** — Quick fixes, minor tweaks
> - **[Gemini 3 Pro]** — Debugging, visual testing, E2E tests

---

## Table of Contents

- [Phase 1 — Tighten CAPTCHA Bypass](#phase-1--tighten-captcha-bypass-f1)
  - [1.1 Remove NODE_ENV from CAPTCHA bypass condition](#11-remove-node_env-from-captcha-bypass-condition)
- [Phase 2 — Centralize Tool Route Protection](#phase-2--centralize-tool-route-protection-f12)
  - [2.1 Create withToolProtection() wrapper](#21-create-withtoolprotection-wrapper)
  - [2.2 Migrate all 5 tool routes](#22-migrate-all-5-tool-routes)
- [Phase 3 — Cost Validation Script](#phase-3--cost-validation-script-f7)
  - [3.1 Create spend estimation validation script](#31-create-spend-estimation-validation-script)
- [Phase 4 — GCP Billing Budget](#phase-4--gcp-billing-budget-f6)
  - [4.1 Configure GCP Billing Budget](#41-configure-gcp-billing-budget-non-code-manual)

---

## Phase 1 — Tighten CAPTCHA Bypass (F1)

### 1.1 Remove NODE_ENV from CAPTCHA bypass condition

- [x] **[Sonnet 4]** Update `isE2ETestingEnabled()` in `web/src/lib/captcha.ts` to check only `E2E_TESTING === "true"`
- [x] **[Sonnet 4]** Update `isE2ETestingEnabled()` in `web/src/components/ReCaptcha.tsx` to check only `NEXT_PUBLIC_E2E_TESTING === "true"`
- [x] **[Sonnet 4]** TEST: Run `npm test` — all CAPTCHA-related tests pass
- [x] **[Gemini 3 Pro]** TEST: Run `npx playwright test` — all E2E tests pass (they set `E2E_TESTING=true`)

---

## Phase 2 — Centralize Tool Route Protection (F12)

### 2.1 Create withToolProtection() wrapper

- [x] **[Codex/Opus]** Create `web/src/lib/tool-protection.ts` with `withToolProtection()` function
  - Accepts `NextRequest`, returns `{ ok: true, sessionId } | { ok: false, response }`
  - Encapsulates: session check, captcha check, rate limit, spend cap
  - Error responses match existing route behavior exactly (same status codes, error codes, JSON shapes)
- [x] **[Codex/Opus]** Add unit tests in `web/src/lib/tool-protection.test.ts`
  - Cover: no session, expired session, captcha not passed, rate limited, spend cap exceeded, success
- [x] **[Codex/Opus]** TEST: Run `npm test` — all new and existing tests pass

### 2.2 Migrate all 5 tool routes

- [x] **[Codex/Opus]** Migrate `web/src/app/api/tools/resume/route.ts` to use `withToolProtection()`
- [x] **[Codex/Opus]** Migrate `web/src/app/api/tools/interview/route.ts` to use `withToolProtection()`
- [x] **[Codex/Opus]** Migrate `web/src/app/api/tools/fit/start/route.ts` to use `withToolProtection()`
- [x] **[Codex/Opus]** Migrate `web/src/app/api/tools/fit/generate/route.ts` to use `withToolProtection()`
- [x] **[Codex/Opus]** Migrate `web/src/app/api/tools/fit/answer/route.ts` (rate limit + spend cap on "ready" path only)
- [x] **[Codex/Opus]** TEST: Run `npm test` — all unit tests pass
- [x] **[Gemini 3 Pro]** TEST: Run `npx playwright test` — all E2E tests pass
- [x] **[Codex/Opus]** TEST: Run `npm run smoke:gcp` — GCP smoke tests pass (optional but recommended)

---

## Phase 3 — Cost Validation Script (F7)

### 3.1 Create spend estimation validation script

- [x] **[Codex/Opus]** Create `web/scripts/validate-spend.ts`
  - Reads Firestore `spendMonthly/{YYYY-MM}` document
  - Prints: estimated spend, budget, % used, pricing constants
  - Prints: GCP Billing console URL for comparison
  - Includes `LAST_PRICING_REVIEW` date; warns if stale >30 days
- [x] **[Codex/Opus]** Add `"validate-spend"` script to `web/package.json`
- [x] **[Codex/Opus]** TEST: Run `npm run lint` — no lint errors
- [x] **[Codex/Opus]** TEST: Run `npm run validate-spend` with GCP credentials — output is clear and correct

---

## Phase 4 — GCP Billing Budget (F6)

### 4.1 Configure GCP Billing Budget (non-code, manual)

- [ ] **[You]** Follow `docs/GCP-DEPLOY.md` Step 11 instructions in GCP Console
- [ ] **[You]** Create $20/month budget named `samkirk-v3-monthly`
- [ ] **[You]** Configure email alerts to `sam@samkirk.com` at 50%, 90%, 100% thresholds
- [ ] **[You]** Verify budget is visible in GCP Console → Billing → Budgets
- [ ] **[You]** Check off items 11.1 and 11.2 in `docs/GCP-DEPLOY.md`

---

## Summary

| Phase | Focus | Finding | Primary Model |
|-------|-------|---------|---------------|
| 1 | CAPTCHA bypass | F1 (MEDIUM) | Sonnet 4 |
| 2 | Centralized protection | F12 (MEDIUM) | Codex/Opus |
| 3 | Cost validation | F7 (MEDIUM) | Codex/Opus |
| 4 | GCP billing budget | F6 (HIGH) | Manual (GCP Console) |

---

**Workflow reminder:** After completing each step, check off items here. Start fresh chats between steps using `start step` or `continue step` with the `security` prefix to maintain context quality.
