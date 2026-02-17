---
id: REQ-116
title: "Run E2E tests against Vercel preview"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-113, REQ-114, REQ-115]
batch: "vercel-migration-phase-4"
source_step: "4.4"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Gemini 3 Pro"
---

# Run E2E tests against Vercel preview (Step 4.4)

## What
Run the existing Playwright E2E test suite against the Vercel preview URL and fix any Vercel-specific failures.

## Checklist
- [ ] **[Gemini 3 Pro] [AI]** Run Playwright E2E tests with `PLAYWRIGHT_BASE_URL` set to Vercel preview URL
- [ ] **[Gemini 3 Pro] [AI]** Fix any E2E failures specific to Vercel deployment

## Blueprint Guidance

### Step 4.4: Run E2E tests against Vercel preview

```
Run the existing E2E test suite against the Vercel preview URL:

  PLAYWRIGHT_BASE_URL=https://samkirk-v3.vercel.app npx playwright test

If tests reference localhost:3000, update the Playwright config to support an env override for the base URL.

Fix any failures before proceeding to DNS cutover.
```

## Context
- **Document set**: vercel-migration
- **Phase**: 4 — Deploy and Verify on Vercel Preview
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Gemini 3 Pro (advisory — E2E debugging)

## Dependencies
Depends on REQ-113 (successful deployment) and REQ-114 (basic smoke test passing).

---
*Source: docs/vercel-migration-TODO.md, Step 4.4*
