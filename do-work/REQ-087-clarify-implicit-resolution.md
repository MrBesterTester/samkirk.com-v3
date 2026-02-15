---
id: REQ-087
title: Clarify current-REQ implicit resolution in UR completion check
status: pending
created_at: 2026-02-14T20:10:00Z
user_request: UR-025
---

# Clarify Current-REQ Implicit Resolution in UR Completion Check

## What
The UR completion check at work.md:756 says the current REQ "counts as resolved implicitly" but doesn't explicitly tell agents how to handle this when iterating the `requests` array. An agent checking each REQ ID against archive/UR locations will miss the current REQ (still in `working/`) and incorrectly conclude the UR isn't ready for archival.

## Why
The instruction is ambiguous enough that a literal-minded agent could fail to consolidate a UR. The algorithm needs to spell out: "When you encounter the current REQ's ID in the array, skip the location search — you already know it's resolved because you just completed it in Step 7.1."

## Context
- Verify the issue exists at `work.md:752-764` and `CHANGELOG.md:6-12`
- The fix from 0.12.2 removed `working/` as a search location but the replacement guidance ("counts as resolved implicitly") isn't actionable enough
- The cleanup action (cleanup.md:23-26) doesn't have this problem because it never runs while a REQ is in `working/`
- Fix should make the iteration algorithm explicit: for each REQ ID in the array, if it matches the current REQ being archived → resolved; otherwise search the three locations

---
*Source: The UR completion check logic states "The current REQ counts as resolved implicitly..." but this relies on agents understanding an unspecified rule.*
