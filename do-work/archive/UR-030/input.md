---
id: UR-030
title: Fix duplicate check to include archive/UR-* folders
created_at: 2026-02-16T12:00:00Z
requests: [REQ-094]
word_count: 67
---

# Fix duplicate check to include archive/UR-* folders

## Full Verbatim Input

Verify this issue exists and fix it:

Step 2 instructs agents to check for duplicate requests by listing filenames in `do-work/working/` and `do-work/archive/`, but omits checking inside `archive/UR-*/` folders. Completed REQs archived as part of a UR folder would be missed, allowing agents to create redundant requests for work already completed. This is inconsistent with the REQ numbering instructions (line 121) which correctly specify checking inside `archive/UR-*/`. @.agents/skills/do-work/actions/do.md:390-391

---
*Captured: 2026-02-16T12:00:00Z*
