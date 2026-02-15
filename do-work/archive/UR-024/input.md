---
id: UR-024
title: Fix node_modules prerequisite check path in dev guide
created_at: 2026-02-14T20:05:00Z
requests: [REQ-086]
word_count: 48
---

# Fix node_modules prerequisite check path in dev guide

## Full Verbatim Input

Verify this issue exists and fix it:

The prerequisite check for Node dependencies points to a non-existent file path `web/node_modules/.package-lock.json`. The correct path is `web/package-lock.json` at the project root. This causes the check to always report "not done" even after successfully running `npm install`, misleading developers into thinking dependencies aren't installed when they are. @README_dev_guide.md:168-169

---
*Captured: 2026-02-14T20:05:00Z*
