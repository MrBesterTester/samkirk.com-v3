---
id: REQ-095
title: "Remove NODE_ENV from CAPTCHA bypass condition"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-031
claimed_at: 2026-02-16T21:30:00-08:00
route: A
completed_at: 2026-02-16T21:35:00-08:00
related: [REQ-096, REQ-097, REQ-098, REQ-099]
batch: "security-phase-1"
source_step: "1.1"
source_doc: "docs/security-TODO.md"
blueprint_ref: "docs/security-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Remove NODE_ENV from CAPTCHA bypass condition (Step 1.1)

## What
Tighten the CAPTCHA bypass so it only triggers when `E2E_TESTING === "true"`, removing the unnecessary `NODE_ENV === "development"` condition from both the server-side and client-side implementations.

## Checklist
- [x] **[Sonnet 4]** Update `isE2ETestingEnabled()` in `web/src/lib/captcha.ts` to check only `E2E_TESTING === "true"`
- [x] **[Sonnet 4]** Update `isE2ETestingEnabled()` in `web/src/components/ReCaptcha.tsx` to check only `NEXT_PUBLIC_E2E_TESTING === "true"`
- [x] **[Sonnet 4]** TEST: Run `npm test` — all CAPTCHA-related tests pass
- [x] **[Gemini 3 Pro]** TEST: Run `npx playwright test` — all E2E tests pass (they set `E2E_TESTING=true`)

## Blueprint Guidance
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

## Context
- **Document set**: security
- **Phase**: 1 — Tighten CAPTCHA Bypass (F1)
- **Specification**: See docs/security-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Phase 1 is independent — can be done first or in parallel with Phase 2.

---
*Source: docs/security-TODO.md, Step 1.1*

---

## Triage

**Route: A** - Simple

**Reasoning:** Bug fix / security tightening with explicit file paths, line numbers, and before/after code provided. No ambiguity.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Exact code changes are specified in the request with file paths and line numbers. Simple condition removal in two files.

*Skipped by work action*

## Implementation Summary

- Updated `isE2ETestingEnabled()` in `web/src/lib/captcha.ts` (line 76) — removed `|| process.env.NODE_ENV === "development"`
- Updated `isE2ETestingEnabled()` in `web/src/components/ReCaptcha.tsx` (line 205) — removed `|| process.env.NODE_ENV === "development"`

*Completed by work action (Route A)*

## Testing

**Tests run:** `cd web && npm test`
**Result:** All 1255 tests passing (38 suites), including 14 captcha tests and 6 ReCaptcha tests

**Existing tests verified:**
- `web/src/lib/captcha.test.ts` — 14 tests passing
- `web/src/components/ReCaptcha.test.tsx` — 6 tests passing

*Verified by work action*
