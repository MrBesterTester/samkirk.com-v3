---
id: REQ-086
title: Fix node_modules prerequisite check path in dev guide
status: pending
created_at: 2026-02-14T20:05:00Z
user_request: UR-024
---

# Fix Node Dependencies Prerequisite Check Path in Dev Guide

## What
Fix the prerequisite check for Node dependencies in `README_dev_guide.md` (lines 168-169) which points to a non-existent file path `web/node_modules/.package-lock.json`. The correct path is `web/package-lock.json`.

## Why
The wrong path causes the check to always report "not done" even after successfully running `npm install`, misleading developers into thinking dependencies aren't installed.

## Context
- Verify the issue exists at `README_dev_guide.md:168-169` before fixing
- The correct check file is `web/package-lock.json` (or alternatively `web/node_modules/.package-lock.json` — verify which actually exists after `npm install`)
- Simple path correction — no logic changes needed

---
*Source: Verify this issue exists and fix it: The prerequisite check for Node dependencies points to a non-existent file path `web/node_modules/.package-lock.json`. The correct path is `web/package-lock.json` at the project root.*
