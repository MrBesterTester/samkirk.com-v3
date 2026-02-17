---
id: REQ-101
title: Fix NODE_ENV read-only assignment errors in test files
status: completed
created_at: 2026-02-16T19:10:00Z
user_request: UR-032
related: [REQ-100, REQ-102]
batch: ci-type-fixes
claimed_at: 2026-02-16T20:06:00-08:00
route: A
completed_at: 2026-02-16T20:10:00-08:00
---

# Fix NODE_ENV read-only assignment errors in test files

## What
Test files directly assign `process.env.NODE_ENV = '...'` which TypeScript rejects as read-only. Fix these assignments so `npx tsc --noEmit` passes.

## Context
Eight locations across 2 files:
- `src/lib/api-errors.test.ts` lines 438, 472, 480, 509
- `src/lib/session.test.ts` lines 130, 154, 160, 166

All paths are relative to `web/`. Must pass `npx tsc --noEmit` from `web/` directory after fix.

---
*Source: Cannot assign to NODE_ENV because read-only in test files*

---

## Triage

**Route: A** - Simple

**Reasoning:** Type error fix with specific file locations and line numbers. NODE_ENV is declared `readonly` by Next.js types but needs runtime mutation in tests.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Well-understood pattern — test files need to mutate `process.env.NODE_ENV` which Next.js types declare as readonly.

*Skipped by work action*

## Implementation Summary

- Added `// @ts-expect-error` comments above each of the 8 `process.env.NODE_ENV = ...` assignments
- `web/src/lib/api-errors.test.ts` — 4 locations (lines 438, 473, 481, 510)
- `web/src/lib/session.test.ts` — 4 locations (lines 131, 155, 161, 167)
- Zero runtime behavior changes — `@ts-expect-error` is the standard pattern for test files that need to reassign readonly env vars

*Completed by work action (Route A)*

## Testing

**Tests run:** `npx vitest run src/lib/api-errors.test.ts src/lib/session.test.ts`
**Result:** All 141 tests passing (107 + 34)

**Type check:** `npx tsc --noEmit` — all NODE_ENV errors resolved

*Verified by work action*
