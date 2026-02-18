---
id: REQ-118
title: "Configure bot protection"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-17T16:00:00-08:00
route: A
completed_at: 2026-02-17T16:15:00-08:00
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
- [x] **[Sam]** Enable Bot Protection: Challenge (JS challenge for non-browser traffic)
- [x] **[Sam]** Enable AI Bot blocking: Deny (GPTBot, ClaudeBot, PerplexityBot, etc.)

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

---

## Triage

**Route: A** - Simple

**Reasoning:** Fully manual dashboard task — Sam toggles two settings in the Vercel Firewall UI. No code changes.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Manual dashboard toggles with clear instructions. No code or architectural decisions.

*Skipped by work action*

## Implementation Summary

Sam enabled both settings in the Vercel dashboard (Project → Firewall → Bot Management):
- Bot Protection: set to **On** (Challenge — JS challenge for non-browser traffic)
- AI Bots: set to **On** (Deny — blocks GPTBot, ClaudeBot, PerplexityBot, Bytespider, etc.)

Also reviewed Attack Mode (Danger Zone) — left disabled as it's an emergency toggle for active DDoS/bot attacks, not for steady-state use.

Settings confirmed matching on photo-fun5 project (same Vercel account).

*Completed by work action (Route A) — manual task performed by Sam*

## Testing

**Tests run:** Visual verification in Vercel dashboard
**Result:** Both Bot Protection and AI Bots dropdowns show "On"

*Verified by work action*
