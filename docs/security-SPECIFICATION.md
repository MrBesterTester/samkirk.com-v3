# LLM Cost Security Hardening — Specification

## 1) Summary

Harden the existing LLM cost-overrun defenses in `samkirk.com` v3. The app already implements a 4-layer defense (session → CAPTCHA → rate limit → spend cap), but a security review identified gaps between the original spec (`docs/SPECIFICATION.md` §10) and the deployed implementation.

## 2) Goals

- Close all HIGH and MEDIUM findings from the security review.
- Ensure the GCP-level billing backstop required by the original spec is configured.
- Reduce maintenance risk by centralizing the 4 security checks that each tool route must enforce.
- Eliminate unnecessary attack surface in the CAPTCHA bypass logic.

## 3) Non-goals

- Changing the rate limit window or request count (10 req / 10 min is unchanged).
- Changing the spend cap amount ($20/month is unchanged).
- Adding new security layers (e.g., WAF, bot detection beyond reCAPTCHA v2).
- Fixing LOW/INFO findings (IP binding on sessions, session revocation, Firestore rules audit) — these are acceptable for V1.

## 4) Findings to Address

### F6 (HIGH) — GCP Billing Budget backstop not configured

The original spec (§10.3) requires **both** app-level cost estimation **and** a GCP Billing Budget as a backstop. The app-level cap is implemented. The GCP Billing Budget is not — `docs/GCP-DEPLOY.md` Step 11 items are unchecked.

**Required outcome**: GCP Billing Budget of $20/month configured with email alerts at 50%, 90%, and 100% thresholds to `sam@samkirk.com`.

### F12 (MEDIUM) — No centralized middleware for tool routes

Each of the 5 tool API routes independently implements all 4 security checks (session, CAPTCHA, rate limit, spend cap). A new route could omit a check with no compile-time or runtime safety net.

**Required outcome**: A shared `withToolProtection()` wrapper (or equivalent) that encapsulates all 4 checks. All existing tool routes migrated to use it.

### F1 (MEDIUM) — CAPTCHA bypass too broad

The E2E/dev CAPTCHA bypass activates on `NODE_ENV === "development"` in addition to `E2E_TESTING === "true"`. The `NODE_ENV` condition is unnecessary since local dev also sets `E2E_TESTING` when needed.

**Required outcome**: CAPTCHA bypass gated exclusively on `E2E_TESTING === "true"`.

### F7 (MEDIUM) — Cost estimation may undercount

Hardcoded token pricing constants may diverge from actual Vertex AI billing for the deployed model (`gemini-3-pro-preview`). No mechanism exists to detect or alert on drift.

**Required outcome**: A lightweight validation script or checklist item that compares estimated spend (from the Firestore `spendMonthly` doc) against actual GCP billing, run periodically (e.g., monthly).

## 5) Acceptance Criteria

- GCP Billing Budget exists with $20/month limit and 3 alert thresholds.
- All 5 tool routes use the shared protection wrapper; no route directly calls the 4 checks individually.
- CAPTCHA bypass in both `captcha.ts` and `ReCaptcha.tsx` only triggers when `E2E_TESTING === "true"`.
- A cost validation script or documented procedure exists for periodic spend comparison.
- All existing unit tests continue to pass.
- All existing E2E tests continue to pass.
