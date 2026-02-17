---
id: UR-032
title: Fix CI TypeScript type errors
created_at: 2026-02-16T19:10:00Z
requests: [REQ-100, REQ-101, REQ-102]
word_count: 85
---

# Fix CI TypeScript type errors

## Summary

Three categories of TypeScript type errors are failing the GitHub Actions CI build-and-test job (`npx tsc --noEmit`). All pass locally but fail in CI.

## Full Verbatim Input

Fix three categories of TypeScript type errors failing CI: (1) NextResponse<unknown> not assignable to typed NextResponse in 6 tool API routes - src/app/api/tools/fit/answer/route.ts:132,237, src/app/api/tools/fit/generate/route.ts:93, src/app/api/tools/fit/start/route.ts:118, src/app/api/tools/interview/route.ts:112, src/app/api/tools/resume/route.ts:106. (2) Cannot assign to NODE_ENV because read-only in test files - src/lib/api-errors.test.ts:438,472,480,509 and src/lib/session.test.ts:130,154,160,166. (3) ProcessEnv missing NODE_ENV in env.test.ts:20,30,37. All must pass `npx tsc --noEmit` from web/ directory after fixes.

---
*Captured: 2026-02-16T19:10:00Z*
