---
id: REQ-117
title: "Configure WAF rate limiting"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-118]
batch: "vercel-migration-phase-5"
source_step: "5.1"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: ""
---

# Configure WAF rate limiting (Step 5.1)

## What
Sam adds a WAF rule in the Vercel dashboard to rate limit `/api/tools/*` at 20 requests per 60 seconds per IP.

## Checklist
- [ ] **[Sam]** Add WAF rule in Vercel: rate limit `/api/tools/*` — 20 req/60s per IP

## Blueprint Guidance

### Step 5.1: Configure WAF rate limiting

```
Manual step (Sam in Vercel dashboard):

1. Go to Project → Settings → Firewall
2. Add rule:
   - Name: "Rate limit tool API routes"
   - Path: /api/tools/*
   - Rate limit: 20 requests per 60 seconds per IP
   - Action: Block (with 429 response)
3. Enable the rule
```

## Context
- **Document set**: vercel-migration
- **Phase**: 5 — Vercel Security Configuration
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Owner**: Sam (dashboard action)

## Dependencies
Can be done after Phase 4 verification. Can run in parallel with REQ-118.

---
*Source: docs/vercel-migration-TODO.md, Step 5.1*
