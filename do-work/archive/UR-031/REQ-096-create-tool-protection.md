---
id: REQ-096
title: "Create withToolProtection() wrapper"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-031
claimed_at: 2026-02-16T21:36:00-08:00
route: B
completed_at: 2026-02-16T21:47:00-08:00
related: [REQ-095, REQ-097, REQ-098, REQ-099]
batch: "security-phase-2"
source_step: "2.1"
source_doc: "docs/security-TODO.md"
blueprint_ref: "docs/security-BLUEPRINT.md"
model_hint: "Codex/Opus"
---

# Create withToolProtection() wrapper (Step 2.1)

## What
Extract the repeated 4-check security pattern (session → captcha → rate limit → spend cap) from the tool routes into a single reusable `withToolProtection()` function, with comprehensive unit tests.

## Checklist
- [x] **[Codex/Opus]** Create `web/src/lib/tool-protection.ts` with `withToolProtection()` function
  - Accepts `NextRequest`, returns `{ ok: true, sessionId } | { ok: false, response }`
  - Encapsulates: session check, captcha check, rate limit, spend cap
  - Error responses match existing route behavior exactly (same status codes, error codes, JSON shapes)
- [x] **[Codex/Opus]** Add unit tests in `web/src/lib/tool-protection.test.ts`
  - Cover: no session, expired session, captcha not passed, rate limited, spend cap exceeded, success
- [x] **[Codex/Opus]** TEST: Run `npm test` — all new and existing tests pass

## Blueprint Guidance
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

## Context
- **Document set**: security
- **Phase**: 2 — Centralize Tool Route Protection (F12)
- **Specification**: See docs/security-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory — use if your tool supports model selection)

## Dependencies
Must complete before REQ-097 (which migrates routes to use this wrapper).

---
*Source: docs/security-TODO.md, Step 2.1*

---

## Triage

**Route: B** - Medium

**Reasoning:** Clear feature request (extract pattern into wrapper function) but need to explore existing route implementations to understand the exact 4-check pattern, status codes, error shapes, and imports to replicate.

**Planning:** Not required

## Plan

**Planning not required** - Route B: Exploration-guided implementation

Rationale: The wrapper function's design is well-specified in the request. Need to explore existing routes to extract the exact pattern.

*Skipped by work action*

## Exploration

**Canonical pattern found in `resume/route.ts` (lines 118-191):** 4 sequential checks — session (401), captcha (403), rate limit (429), spend cap (503). All routes follow this pattern with variations:
- `interview/route.ts`: spend cap only on "message" action
- `fit/answer/route.ts`: rate limit + spend cap only on "ready" path
- `resume`, `fit/start`, `fit/generate`: always all 4 checks

**Key findings:**
- `hasCaptchaPassed()` is duplicated inline in all 5 route files — should be centralized
- Imports: `getSessionIdFromCookies`/`isSessionValid` from `@/lib/session`, `enforceRateLimit`/`RateLimitError` from `@/lib/rate-limit`, `enforceSpendCap`/`SpendCapError` from `@/lib/spend-cap`
- Error shapes: session/captcha errors have no `contactEmail`; rate limit/spend cap include `contactEmail`
- Test patterns use vitest with `vi.mock()` before imports, `vi.clearAllMocks()` in `beforeEach`
- Wrapper should support options for conditional rate limit/spend cap checks
- Return type should include `sessionId` for route handlers to use

*Generated by Explore agent*

## Implementation Summary

- Created `web/src/lib/tool-protection.ts` with `withToolProtection()` function
  - Centralizes 4-check pattern: session → captcha → rate limit → spend cap
  - Returns `{ ok: true, sessionId }` or `{ ok: false, response }` with exact error shapes
  - Supports `skipRateLimit` and `skipSpendCap` options for conditional checks
  - Centralizes `hasCaptchaPassed()` helper (previously duplicated in 5 routes)
- Created `web/src/lib/tool-protection.test.ts` with 29 unit tests
  - Covers all failure modes, success path, skip options, short-circuit behavior, defaults

*Completed by work action (Route B)*

## Testing

**Tests run:** `cd web && npm test`
**Result:** All 1284 tests passing (39 suites)

**New tests added:**
- `web/src/lib/tool-protection.test.ts` — 29 tests covering all failure modes, options, and success path

**Existing tests verified:**
- All 1255 pre-existing tests still passing

*Verified by work action*
