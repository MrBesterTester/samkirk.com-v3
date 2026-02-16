# do-work/archive/

Completed and failed work, organized by User Request (UR) folders.

## Structure

Each UR folder is a self-contained unit with the original input and all completed REQ files:

```
archive/
├── UR-001/                 # Archived user request
│   ├── input.md            # Original verbatim input
│   ├── REQ-001-task.md     # Completed REQ with full workflow log
│   ├── REQ-002-task.md
│   └── verify-report.md    # Quality evaluation (if verified)
├── UR-002/
│   └── ...
├── hold/                   # Paused work
├── legacy/                 # Pre-UR-system files
└── test-runs/              # Test/dry-run archives
```

## What's in a Completed REQ

Each archived REQ file is a living log of the work performed:

- **Frontmatter**: id, status, timestamps, route, commit hash
- **Triage**: Route decision (A/B/C) and reasoning
- **Plan**: Implementation plan (Route C) or "not required" (Routes A/B)
- **Exploration**: Codebase findings (Routes B/C)
- **Implementation Summary**: What was changed
- **Testing**: Test results and coverage

## UR Archival

A UR folder moves here only when **all** its REQs are completed. Failed REQs archive individually (not into the UR folder) and block UR closure until retried or force-archived.
