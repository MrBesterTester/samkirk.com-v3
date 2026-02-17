---
id: REQ-099
title: "Configure GCP Billing Budget"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-031
related: [REQ-095, REQ-096, REQ-097, REQ-098]
batch: "security-phase-4"
source_step: "4.1"
source_doc: "docs/security-TODO.md"
blueprint_ref: "docs/security-BLUEPRINT.md"
model_hint: "Manual (You)"
---

# Configure GCP Billing Budget (Step 4.1)

## What
Complete the GCP Billing Budget configuration required by the original spec (F6 — HIGH). This is a non-code, manual step performed in the GCP Console.

## Checklist
- [ ] **[You]** Follow `docs/GCP-DEPLOY.md` Step 11 instructions in GCP Console
- [ ] **[You]** Create $20/month budget named `samkirk-v3-monthly`
- [ ] **[You]** Configure email alerts to `sam@samkirk.com` at 50%, 90%, 100% thresholds
- [ ] **[You]** Verify budget is visible in GCP Console → Billing → Budgets
- [ ] **[You]** Check off items 11.1 and 11.2 in `docs/GCP-DEPLOY.md`

## Blueprint Guidance
### 4.1 Configure GCP Billing Budget (non-code, manual)

- **Goal**: Complete the GCP Billing Budget configuration required by the original spec.
- **Reference**: `docs/GCP-DEPLOY.md` Step 11 has the full instructions.
- **Acceptance criteria**:
  - Budget named `samkirk-v3-monthly` exists in GCP console.
  - Amount: $20.00/month.
  - Alert thresholds at 50%, 90%, 100% of actual spend.
  - Email notifications go to `sam@samkirk.com`.
  - Items 11.1 and 11.2 in `docs/GCP-DEPLOY.md` are checked off.
- **Test plan**:
  - Verify budget is visible in GCP Console.
  - Verify a test alert email is received (or check Cloud Monitoring notification channels).

## Context
- **Document set**: security
- **Phase**: 4 — GCP Billing Budget (F6)
- **Specification**: See docs/security-SPECIFICATION.md for full requirements
- **Model recommendation**: Manual (You) — this is a human task, not automatable

## Dependencies
Independent — can be done at any time. However, this is the highest severity finding (F6 HIGH), so consider prioritizing it.

---
*Source: docs/security-TODO.md, Step 4.1*
