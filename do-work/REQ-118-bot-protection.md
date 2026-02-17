---
id: REQ-118
title: "Configure bot protection"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-117]
batch: "vercel-migration-phase-5"
source_step: "5.2"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: ""
---

# Configure bot protection (Step 5.2)

## What
Sam enables Bot Protection (JS challenge for non-browser traffic) and AI Bot blocking (deny GPTBot, ClaudeBot, PerplexityBot, etc.) in the Vercel dashboard.

## Checklist
- [ ] **[Sam]** Enable Bot Protection: Challenge (JS challenge for non-browser traffic)
- [ ] **[Sam]** Enable AI Bot blocking: Deny (GPTBot, ClaudeBot, PerplexityBot, etc.)

## Blueprint Guidance

### Step 5.2: Configure bot protection

```
Manual step (Sam in Vercel dashboard):

1. Go to Project → Settings → Firewall
2. Enable Bot Protection:
   - Action: Challenge (JS challenge for non-browser traffic)
3. Enable AI Bot blocking:
   - Action: Deny
   - This blocks: GPTBot, ClaudeBot, PerplexityBot, Bytespider, etc.
```

## Context
- **Document set**: vercel-migration
- **Phase**: 5 — Vercel Security Configuration
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Owner**: Sam (dashboard action)

## Dependencies
Can be done after Phase 4 verification. Can run in parallel with REQ-117.

---
*Source: docs/vercel-migration-TODO.md, Step 5.2*
