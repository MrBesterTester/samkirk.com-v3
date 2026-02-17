---
id: REQ-120
title: "Update DNS records"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
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
- [ ] **[Sam]** Update DNS A/CNAME records per Vercel instructions
- [ ] **[Sam]** Wait for DNS propagation
- [ ] **[Sam]** Verify SSL certificate auto-provisioned by Vercel

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
