---
id: UR-038
title: Add .gitleaksignore for fake test key
created_at: 2026-02-18T15:15:00-08:00
requests: [REQ-132]
word_count: 67
---

# Add .gitleaksignore for fake test key

## Full Verbatim Input

add a .gitleaksignore for the fake test key. During the /ship pipeline, gitleaks flagged a false positive: a fake RSA private key in web/src/lib/gcp-credentials.test.ts (fingerprint: 8f855882b8f4e233e2897edcb3df96c881ece6a1:web/src/lib/gcp-credentials.test.ts:private-key:7). This is a test-only dummy key ("-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----") used in unit tests. Create a .gitleaksignore file at the project root containing this fingerprint so gitleaks stops reporting it as a leak. The fingerprint to add is: 8f855882b8f4e233e2897edcb3df96c881ece6a1:web/src/lib/gcp-credentials.test.ts:private-key:7

---
*Captured: 2026-02-18T15:15:00-08:00*
