---
id: REQ-096
title: "Create withToolProtection() wrapper"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-031
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
- [ ] **[Codex/Opus]** Create `web/src/lib/tool-protection.ts` with `withToolProtection()` function
  - Accepts `NextRequest`, returns `{ ok: true, sessionId } | { ok: false, response }`
  - Encapsulates: session check, captcha check, rate limit, spend cap
  - Error responses match existing route behavior exactly (same status codes, error codes, JSON shapes)
- [ ] **[Codex/Opus]** Add unit tests in `web/src/lib/tool-protection.test.ts`
  - Cover: no session, expired session, captcha not passed, rate limited, spend cap exceeded, success
- [ ] **[Codex/Opus]** TEST: Run `npm test` — all new and existing tests pass

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
