---
id: REQ-100
title: Fix NextResponse<unknown> type errors in tool API routes
status: pending
created_at: 2026-02-16T19:10:00Z
user_request: UR-032
related: [REQ-101, REQ-102]
batch: ci-type-fixes
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
