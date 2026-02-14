# List Action

> **Part of the do-work skill.** Invoked when routing determines the user wants to see queue status. Shows pending, held, and archived request counts.

## Workflow

### Step 1: Scan the Queue

List files in these locations using shell commands (the `do-work/` folder may be gitignored):

| Location | What lives there |
|----------|-----------------|
| `do-work/` root | Pending REQ files (the active queue) |
| `do-work/working/` | In-progress REQ files (currently being built) |
| `do-work/archive/hold/` | Held REQ files (parked, not queued) |
| `do-work/archive/` | Completed/failed REQ files and closed UR folders |

### Step 2: Read Pending REQs

For each `REQ-*.md` file in `do-work/` root:
- Read the frontmatter to extract `id`, `title`, and `status`

### Step 3: Read In-Progress REQs

For each `REQ-*.md` file in `do-work/working/`:
- Read the frontmatter to extract `id`, `title`, and `status`

### Step 4: Read Held REQs

For each `REQ-*.md` file in `do-work/archive/hold/`:
- Read the frontmatter to extract `id`, `title`, and `status`

### Step 5: Count Archived

Count total archived REQ files across `do-work/archive/` (including inside `UR-*/` subfolders, but excluding `hold/`).

### Step 6: Display Summary

Output a concise summary table:

```
**Do-Work Queue**

| # | REQ | Status | Title |
|---|-----|--------|-------|
| 1 | REQ-068 | pending | Fix smoke test issue |
| 2 | REQ-071 | pending | Fix chat layout |

**2 pending**, 0 in progress, 3 on hold, 67 archived.
```

Rules:
- Show pending REQs first, then in-progress, then held — each group in ID order
- Use a single summary line at the bottom with counts
- If a section is empty, still include its count (as 0) in the summary line
- Keep it compact — no explanations, no suggestions, just the data
