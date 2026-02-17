---
id: REQ-108
title: "Create vercel.json"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-107, REQ-109]
batch: "vercel-migration-phase-2"
source_step: "2.2"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Codex/Opus"
---

# Create vercel.json (Step 2.2)

## What
Create `web/vercel.json` with function timeout configuration setting `maxDuration: 60` for all tool API routes.

## Checklist
- [ ] **[Codex/Opus] [AI]** Create `web/vercel.json` with `maxDuration: 60` for `app/api/tools/**/*.ts`

## Blueprint Guidance

### Step 2.2: Create vercel.json

Configure function timeouts for LLM tool routes.

```
Create web/vercel.json (in the web/ directory, next to package.json):

{
  "functions": {
    "app/api/tools/**/*.ts": {
      "maxDuration": 60
    }
  }
}

This sets a 60-second timeout for all tool API routes (fit, resume, interview) where LLM calls happen. All other routes use the default timeout.

No test needed — this is validated during Vercel deployment.
```

## Context
- **Document set**: vercel-migration
- **Phase**: 2 — Next.js Configuration for Vercel
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory)

## Dependencies
No code dependencies. Can be done in parallel with REQ-107 and REQ-109.

---
*Source: docs/vercel-migration-TODO.md, Step 2.2*
