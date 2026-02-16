# do-work/user-requests/

Incoming User Request (UR) folders. Each UR preserves the verbatim original input and links to its generated REQ files in the queue.

## Structure

```
user-requests/
├── UR-029/
│   └── input.md        # Verbatim user input + frontmatter
└── ...
```

## input.md Format

```yaml
---
id: UR-029
title: Short descriptive title
created_at: 2026-02-16T19:00:00Z
requests: [REQ-091, REQ-092, REQ-093]
---

# Title

## Full Verbatim Input
[Exact user input, preserved as-is]
```

## Lifecycle

1. **Created** by the `do` action when a user submits work
2. **REQ files** are generated and placed in the queue (`do-work/` root)
3. **Stays here** while REQs are being processed
4. **Moves to `archive/`** when all linked REQs complete — REQ files are pulled into the UR folder first
