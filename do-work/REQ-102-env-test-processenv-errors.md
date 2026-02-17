---
id: REQ-102
title: Fix ProcessEnv missing NODE_ENV in env.test.ts
status: pending
created_at: 2026-02-16T19:10:00Z
user_request: UR-032
related: [REQ-100, REQ-101]
batch: ci-type-fixes
---

# Fix ProcessEnv missing NODE_ENV in env.test.ts

## What
Mock `ProcessEnv` objects in `env.test.ts` are missing the required `NODE_ENV` property. Add it to the mock objects so `npx tsc --noEmit` passes.

## Context
Three locations in 1 file:
- `src/lib/env.test.ts` lines 20, 30, 37

All paths are relative to `web/`. Must pass `npx tsc --noEmit` from `web/` directory after fix.

---
*Source: ProcessEnv missing NODE_ENV in env.test.ts:20,30,37*
