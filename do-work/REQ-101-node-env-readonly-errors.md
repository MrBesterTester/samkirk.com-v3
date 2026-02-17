---
id: REQ-101
title: Fix NODE_ENV read-only assignment errors in test files
status: pending
created_at: 2026-02-16T19:10:00Z
user_request: UR-032
related: [REQ-100, REQ-102]
batch: ci-type-fixes
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
