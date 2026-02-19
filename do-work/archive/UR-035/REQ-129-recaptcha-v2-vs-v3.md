---
id: REQ-129
title: "Investigate reCAPTCHA v2 vs v3 differences"
status: completed
created_at: 2026-02-18T12:30:00-08:00
user_request: UR-035
completed_at: 2026-02-18T00:00:00-08:00
---

# Investigate reCAPTCHA v2 vs v3 Differences

## What
Research and compare reCAPTCHA v2 (used in samkirk-v3) vs reCAPTCHA v3 (used in photo-fun at ../photo-fun3). Investigate which is more secure and whether v3 is truly more complex than v2 to implement, given the user has now implemented both.

## Context
- samkirk-v3 uses reCAPTCHA v2 (checkbox/invisible challenge)
- photo-fun (../photo-fun3) uses reCAPTCHA v3 (score-based, no user interaction)
- Both are configured on the same Google account
- User wants to understand the security trade-offs and implementation complexity differences from firsthand experience with both

## Resolution
Addressed in `docs/SECURITY-comparison-report.md`, section 1 (reCAPTCHA), subsection "v2 vs v3 Complexity (REQ-129)". Finding: v3 is harder to implement correctly (score thresholds, low-score fallbacks); v2 Checkbox is straightforward pass/fail and arguably better for gating expensive LLM calls where explicit user friction is a feature.

---
*Source: "Please investigate the differences between v2 and v3 reCAPTCHA on Google it pertains to this project, samkirk-v3, which has v2 reCAPTCHA and another project, photo-fun, in ../photo-fun3, which has v3 on the Google account. I am concerned about which is more secure and whether or not v3 is truly more complex than v2 because I have now done both."*
