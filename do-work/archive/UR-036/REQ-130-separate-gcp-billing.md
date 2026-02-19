---
id: REQ-130
title: "Separate Google billing accounts for samkirk-v3 and photo-fun"
status: completed
created_at: 2026-02-18T12:45:00-08:00
user_request: UR-036
claimed_at: 2026-02-18T13:00:00-08:00
route: A
completed_at: 2026-02-18T13:15:00-08:00
---

# Separate Google Billing Accounts

## What
Examine the Google Cloud account structure for two projects — samkirk-v3 (this project) and photo-fun (../photo-fun5) — to determine whether they have separate billing accounts. If they share a billing account, create a plan to separate them so expenses can be tracked independently.

## Context
- Two GCP projects on the same Google account (sam@samkirk.com)
- samkirk-v3: this project
- photo-fun: located at ../photo-fun5 (administered via aistudio.google.com)
- Goal: independent expense tracking per project
- May require creating a second billing account and re-linking one project

## Assets
None

---
*Source: "I have two different projects in Google, one for this project and one for project, photo-fun, in ../photo-fun3. They need to have separate biling accounts so I can track their expenses seaprately. Please examine the account structure in Google to see if this is the case and make a plan to make it so if not."*

---

## Triage

**Route: A** - Simple

**Reasoning:** Investigation and verification task — check billing accounts in GCP Console and AI Studio. No code changes.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Manual investigation of GCP billing structure. No code changes needed.

*Skipped by work action*

## Implementation Summary

Investigated the billing account structure across both projects:

- **samkirk-v3** → `samkirk-com-billing` (014330-8720B9-7BC6ED)
- **photo-fun5** (photo-fun-dev, gen-lang-client-0547124709) → `photo-fun-billing` (014163-7BB87C-3F0DBC, renamed from "My Billing Account 1")

Key findings:
- The two projects were already on **separate billing accounts** — no re-linking needed
- Renamed "My Billing Account 1" → "photo-fun-billing" for clarity
- photo-fun5 uses Google AI Studio (aistudio.google.com) with the `photo-fun-dev` GCP project, NOT `photo-fun4` as initially assumed
- `photo-fun4-billing` was identified as orphaned ($0 current usage) and user closed it
- AI Studio spend for photo-fun-dev: $8.30 over 28 days (Gemini API, Paid tier 1)

*Completed by work action (Route A)*

## Testing

**Tests run:** Manual verification in GCP Console and Google AI Studio
**Result:** All criteria confirmed

- Billing accounts are separate
- Renamed for clarity: `samkirk-com-billing` and `photo-fun-billing`
- Orphaned `photo-fun4-billing` closed by user

*Verified by work action*
