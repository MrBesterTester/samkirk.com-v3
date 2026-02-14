---
id: REQ-083
title: "Download buttons all download the same report"
status: pending
created_at: 2026-02-14T13:00:00-08:00
user_request: UR-021
---

# Download buttons all download the same report

## What
The download buttons on the Hire Me page (Fit Report, Custom Resume, Interview Summary) all download the same file instead of their respective artifacts. Each button should download its own distinct report.

## Context
The Hire Me page actions bar shows download buttons for completed tool outputs (fit report, custom resume, interview transcript). Currently all buttons appear to trigger the same download regardless of which button is clicked. Additionally, all downloaded files have the same filename beginning with "submission..." rather than descriptive names distinguishing the report type. The `download(submissionId)` function in the `useHireMe` hook is responsible for triggering downloads via `/api/submissions/[id]/download`.

---
*Source: "The download buttons download all the same report."*
