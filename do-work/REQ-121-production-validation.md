---
id: REQ-121
title: "Final production validation"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-119, REQ-120]
batch: "vercel-migration-phase-6"
source_step: "6.3"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Gemini 3 Pro"
---

# Final production validation (Step 6.3)

## What
Verify the production site loads on samkirk.com with valid SSL, www redirects correctly, run full E2E suite, test all LLM tools, admin flows, and verify WAF rules are active.

## Checklist
- [ ] **[Sam]** Verify `https://samkirk.com` loads with valid SSL
- [ ] **[Sam]** Verify `https://www.samkirk.com` redirects to apex
- [ ] **[Gemini 3 Pro] [AI]** Run full E2E suite against production URL
- [ ] **[Sam]** Test all three LLM tools end-to-end on production
- [ ] **[Sam]** Test admin OAuth login + uploads on production
- [ ] **[Sam]** Verify Vercel WAF rules are active in Firewall logs

## Blueprint Guidance

### Step 6.3: Final production validation

```
After DNS propagation:

1. Verify https://samkirk.com loads (SSL valid, correct content)
2. Verify https://www.samkirk.com redirects to https://samkirk.com
3. Run full E2E suite against production URL
4. Test all three LLM tools end-to-end
5. Test admin OAuth login + uploads
6. Verify WAF rules are active (check Vercel Firewall logs)
7. Verify bot protection (curl with non-browser user-agent should be challenged)
```

## Context
- **Document set**: vercel-migration
- **Phase**: 6 — DNS Cutover and Domain Configuration
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Gemini 3 Pro (advisory — E2E testing)

## Dependencies
Depends on REQ-120 (DNS propagation must be complete).

---
*Source: docs/vercel-migration-TODO.md, Step 6.3*
