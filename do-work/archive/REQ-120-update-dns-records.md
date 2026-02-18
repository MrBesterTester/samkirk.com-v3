---
id: REQ-120
title: "Update DNS records"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-17T12:00:00-08:00
route: A
completed_at: 2026-02-17T13:15:00-08:00
related: [REQ-119, REQ-121]
batch: "vercel-migration-phase-6"
source_step: "6.2"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: ""
---

# Update DNS records (Step 6.2)

## What
Sam updates DNS A/CNAME records at the domain registrar per Vercel's instructions, waits for propagation, and verifies SSL certificate auto-provisioning.

## Checklist
- [x] **[Sam]** Update DNS A/CNAME records per Vercel instructions
- [x] **[Sam]** Wait for DNS propagation
- [x] **[Sam]** Verify SSL certificate auto-provisioned by Vercel

## Blueprint Guidance

### Step 6.2: Update DNS records

```
Manual step (Sam at domain registrar):

1. Update DNS A/CNAME records per Vercel's instructions
2. Typical setup:
   - A record: samkirk.com → 76.76.21.21 (Vercel IP)
   - CNAME: www.samkirk.com → cname.vercel-dns.com
3. Wait for DNS propagation (can take up to 48h, usually minutes)
4. Vercel auto-provisions SSL certificate once DNS resolves
```

## Context
- **Document set**: vercel-migration
- **Phase**: 6 — DNS Cutover and Domain Configuration
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Owner**: Sam (domain registrar action)

## Dependencies
Depends on REQ-119 (domain must be added to Vercel first). REQ-121 depends on DNS propagation completing.

---
*Source: docs/vercel-migration-TODO.md, Step 6.2*

---

## Triage

**Route: A** - Simple

**Reasoning:** Fully manual task — all checklist items are tagged [Sam]. No AI implementation required. DNS records must be updated at the domain registrar by the user.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: All checklist items are human-only tasks (DNS registrar actions). No code changes needed.

*Skipped by work action*

## Implementation Summary

DNS records updated at Microsoft 365 admin center (admin.microsoft.com) for samkirk.com:

- Added **A record**: `@` → `216.198.79.1` (new Vercel IP, replacing blueprint's older `76.76.21.21`)
- Added **CNAME record**: `www` → `972b3d2e641c184d.vercel-dns-017.com` (project-specific Vercel DNS, replacing blueprint's generic `cname.vercel-dns.com`)

DNS propagated within minutes. Vercel dashboard confirmed:
- `samkirk.com` — Valid Configuration
- `www.samkirk.com` — Valid Configuration, SSL certificate generating

*Completed by work action (Route A) — manual steps performed by Sam with browser automation assistance*

## Testing

**Tests run:** Vercel domain configuration refresh
**Result:** Both samkirk.com and www.samkirk.com show Valid Configuration on Vercel dashboard. SSL certificate auto-provisioning in progress.

*Verified by work action*
