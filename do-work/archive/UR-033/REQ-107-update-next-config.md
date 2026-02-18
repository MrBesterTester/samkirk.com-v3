---
id: REQ-107
title: "Update next.config.ts"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-16T20:01:00-08:00
route: A
completed_at: 2026-02-16T20:03:00-08:00
related: [REQ-108, REQ-109]
batch: "vercel-migration-phase-2"
source_step: "2.1"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Codex/Opus"
---

# Update next.config.ts (Step 2.1)

## What
Remove `output: "standalone"` from `web/next.config.ts` (no longer needed for Vercel) and update the comment to remove Docker references. Verify build and dev server still work.

## Checklist
- [x] **[Codex/Opus] [AI]** Remove `output: "standalone"` from `web/next.config.ts`
- [x] **[Codex/Opus] [AI]** Update comment (remove Docker reference)
- [x] **[Codex/Opus] [AI]** TEST: Run `npm run build` — build succeeds
- [x] **[Codex/Opus] [AI]** TEST: Run `npm run dev` — dev server works

## Blueprint Guidance

### Step 2.1: Update next.config.ts

Remove Docker-specific config and prepare for Vercel deployment.

```
Read web/next.config.ts.

Update web/next.config.ts:
- REMOVE the `output: "standalone"` line (Vercel handles deployment natively; standalone is Docker-only)
- KEEP the `devIndicators: false` setting
- KEEP the www → apex redirect (Vercel supports Next.js redirects natively)
- Update the comment from "Enable standalone output for Docker deployment" to remove Docker reference

The file should look like:
  const nextConfig: NextConfig = {
    devIndicators: false,
    async redirects() { ... same as before ... },
  };

Run: npm run build (verify build succeeds without standalone output)
Run: npm run dev (verify dev server still works)
```

## Context
- **Document set**: vercel-migration
- **Phase**: 2 — Next.js Configuration for Vercel
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory)

## Dependencies
Phase 1 code changes (REQ-103–105) should be complete first. Can run in parallel with REQ-108 and REQ-109.

---

## Triage

**Route: A** - Simple

**Reasoning:** Config change in an explicitly named file (`web/next.config.ts`). Remove one line and update one comment. Clear scope.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Single file config change with explicit instructions. No architectural decisions needed.

*Skipped by work action*

## Implementation Summary

- Removed `output: "standalone"` from `web/next.config.ts`
- Removed Docker-related comment
- Preserved `devIndicators: false` and www→apex redirect

*Completed by work action (Route A)*

## Testing

**Tests run:** `npm run build` and `npm run dev` (from web/)
**Result:** ✓ Build succeeded (31 static pages, 5.9s), dev server started successfully

**No new tests needed** — config value removal, existing build/dev verification sufficient.

*Verified by work action*

---
*Source: docs/vercel-migration-TODO.md, Step 2.1*
