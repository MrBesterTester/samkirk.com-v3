---
id: REQ-132
title: Add .gitleaksignore for fake test key
status: completed
created_at: 2026-02-18T15:15:00-08:00
user_request: UR-038
claimed_at: 2026-02-18T15:30:00-08:00
route: A
completed_at: 2026-02-18T15:31:00-08:00
---

# Add .gitleaksignore for fake test key

## What
Create a `.gitleaksignore` file at the project root containing the fingerprint for the fake RSA private key in `web/src/lib/gcp-credentials.test.ts`, so gitleaks stops flagging it as a false positive.

## Context
During `/ship`, `gitleaks detect --source .` reports 1 leak — a dummy key (`"-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----"`) used in unit tests. The fingerprint is:

```
8f855882b8f4e233e2897edcb3df96c881ece6a1:web/src/lib/gcp-credentials.test.ts:private-key:7
```

Adding this fingerprint to `.gitleaksignore` will suppress the false positive while keeping gitleaks active for real leaks. Both the local `/ship` scan and the GitHub Actions CI gitleaks step should respect this file.

---
*Source: add a .gitleaksignore for the fake test key*

---

## Triage

**Route: A** - Simple

**Reasoning:** Single file creation with explicit content (a fingerprint string). The file path and contents are fully specified in the request.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Creating a single file with explicitly provided content. No architectural decisions needed.

*Skipped by work action*

## Implementation Summary

- Created `.gitleaksignore` at project root with fingerprint for the fake RSA test key
- gitleaks scan confirmed: 310 commits scanned, 0 leaks found (clean exit)

*Completed by work action (Route A)*

## Testing

**Tests run:** `gitleaks detect --source .`
**Result:** ✓ 0 leaks found (310 commits scanned, clean exit code 0)

No unit tests needed — config file creation only.

*Verified by work action*
