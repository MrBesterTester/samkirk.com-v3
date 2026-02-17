---
id: REQ-100
title: Fix NextResponse<unknown> type errors in tool API routes
status: completed
created_at: 2026-02-16T19:10:00Z
user_request: UR-032
related: [REQ-101, REQ-102]
batch: ci-type-fixes
claimed_at: 2026-02-16T20:01:00-08:00
route: A
completed_at: 2026-02-16T20:04:00-08:00
---

# Fix NextResponse<unknown> type errors in tool API routes

## What
The error helper functions return `NextResponse<unknown>` which is not assignable to the typed `NextResponse<T>` expected by each route's return type. Fix the type annotations so `npx tsc --noEmit` passes.

## Context
Six locations across 5 files:
- `src/app/api/tools/fit/answer/route.ts` lines 132, 237
- `src/app/api/tools/fit/generate/route.ts` line 93
- `src/app/api/tools/fit/start/route.ts` line 118
- `src/app/api/tools/interview/route.ts` line 112
- `src/app/api/tools/resume/route.ts` line 106

All paths are relative to `web/`. Must pass `npx tsc --noEmit` from `web/` directory after fix.

---
*Source: Fix NextResponse<unknown> not assignable to typed NextResponse in 6 tool API routes*

---

## Triage

**Route: A** - Simple

**Reasoning:** Bug fix with specific file locations and clear error messages. Type-only change, no runtime behavior modification.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Type error fix with clear error messages and specific file locations. The root cause (error helper return types) is straightforward.

*Skipped by work action*

## Implementation Summary

- Modified `web/src/lib/tool-protection.ts`:
  - Changed `ToolProtectionResult.response` type from `NextResponse` (i.e., `NextResponse<unknown>`) to `NextResponse<never>`
  - Added private `protectionError()` helper that wraps `NextResponse.json()` with a single `as NextResponse<never>` cast
  - Replaced all 5 `NextResponse.json(...)` calls in `withToolProtection` with `protectionError(...)` calls
- Zero changes to the 5 route files — fix is at the root cause level
- Zero runtime behavior changes — only compile-time types changed

*Completed by work action (Route A)*

## Testing

**Tests run:** `npx tsc --noEmit` from `web/`
**Result:** All 6 NextResponse<unknown> errors resolved

**Pre-existing errors (not introduced by this REQ):**
- NODE_ENV read-only assignment errors in test files (REQ-101)
- ProcessEnv type errors in env.test.ts (REQ-102)

*Verified by work action*
