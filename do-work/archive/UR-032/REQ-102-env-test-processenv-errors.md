---
id: REQ-102
title: Fix ProcessEnv missing NODE_ENV in env.test.ts
status: completed
created_at: 2026-02-16T19:10:00Z
user_request: UR-032
related: [REQ-100, REQ-101]
batch: ci-type-fixes
claimed_at: 2026-02-16T20:12:00-08:00
route: A
completed_at: 2026-02-16T20:15:00-08:00
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

---

## Triage

**Route: A** - Simple

**Reasoning:** Type error fix in a single file with 3 specific locations. Mock objects just need NODE_ENV added.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Single file with clear error — mock ProcessEnv objects missing required NODE_ENV property.

*Skipped by work action*

## Implementation Summary

- Modified `web/src/lib/env.test.ts`:
  - Added `NODE_ENV: "test" as const` to `baseEnv` object (fixes errors at lines 20, 37)
  - Changed cast from `Record<string, string>` to `NodeJS.ProcessEnv` (fixes error at line 30)
- Zero runtime behavior changes — only type annotations adjusted

*Completed by work action (Route A)*

## Testing

**Tests run:** `npx vitest run src/lib/env.test.ts`
**Result:** All 3 tests passing

**Type check:** `npx tsc --noEmit` — zero errors across entire project

*Verified by work action*
