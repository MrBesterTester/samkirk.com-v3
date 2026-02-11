---
id: REQ-035
title: Fix DNS for tensor-logic.samkirk.com (bare subdomain)
status: pending
created_at: 2026-02-10T00:00:00Z
---

## Problem

`https://tensor-logic.samkirk.com` doesn't resolve, but `https://www.tensor-logic.samkirk.com` works fine. The site link currently uses the `www.` variant as a workaround.

## Root Cause

The DNS zone for `samkirk.com` likely has a CNAME (or A) record for `www.tensor-logic` but not for `tensor-logic` itself.

## Fix

1. In your DNS provider, add a record for the bare subdomain pointing to the same target as the `www` variant:
   ```
   tensor-logic    CNAME  <same-target-as-www.tensor-logic>
   ```
2. Verify `https://tensor-logic.samkirk.com` resolves after propagation.
3. Update the link in `web/src/app/explorations/tensor-logic/page.tsx` back to `https://tensor-logic.samkirk.com` (remove the `www.` workaround).
4. Optionally configure a redirect so `www.tensor-logic` redirects to `tensor-logic` (or vice versa) for consistency.
