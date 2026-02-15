---
id: UR-025
title: Clarify current-REQ implicit resolution in UR completion check
created_at: 2026-02-14T20:10:00Z
requests: [REQ-087]
word_count: 88
---

# Clarify current-REQ implicit resolution in UR completion check

## Full Verbatim Input

Verify this issue exists and fix it:

The UR completion check logic states "The current REQ counts as resolved implicitly (you just completed it in Step 7.1) — do not search `do-work/working/` for it", but this relies on agents understanding an unspecified rule. The algorithm doesn't explicitly explain how to identify "the current REQ" or how to skip the completion check for it when iterating through the `requests` array. An agent could fail to consolidate a UR because it checks locations (archive root, archive UR folder, user-requests UR folder) but the current REQ is still in `working/` and won't be found, causing the agent to incorrectly conclude the UR isn't ready for archival. @.agents/skills/do-work/actions/work.md:752-764 @.agents/skills/do-work/CHANGELOG.md:6-12

---
*Captured: 2026-02-14T20:10:00Z*
