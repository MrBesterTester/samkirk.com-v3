---
id: REQ-119
title: "Add custom domain to Vercel"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-120, REQ-121]
batch: "vercel-migration-phase-6"
source_step: "6.1"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: ""
---

# Add custom domain to Vercel (Step 6.1)

## What
Sam adds `samkirk.com` and `www.samkirk.com` to the Vercel project domains in the dashboard.

## Checklist
- [ ] **[Sam]** Add `samkirk.com` and `www.samkirk.com` to Vercel project domains

## Blueprint Guidance

### Step 6.1: Add custom domain to Vercel

```
Manual step (Sam in Vercel dashboard):

1. Go to Project → Settings → Domains
2. Add "samkirk.com"
3. Vercel will provide DNS records to configure
4. Also add "www.samkirk.com" (Vercel will auto-redirect to apex via Next.js config)
```

## Context
- **Document set**: vercel-migration
- **Phase**: 6 — DNS Cutover and Domain Configuration
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Owner**: Sam (dashboard action)

## Dependencies
Depends on Phase 4-5 being complete (site verified and security configured). REQ-120 depends on this.

---
*Source: docs/vercel-migration-TODO.md, Step 6.1*
