---
name: sync-todo
description: Sync archived do-work REQ results back to TODO.md checkboxes
argument-hint: (TODO file path) | docs/v2-upgrade-TODO.md
---

# Sync TODO

**Purpose:** After `do work run` completes, sync archived REQ results back to the source TODO.md by checking off completed steps.

**Usage:**
```
/sync-todo                              # auto-detects source_doc from archived REQs
/sync-todo docs/v2-upgrade-TODO.md      # explicit TODO file
```

## How It Works

Reads archived REQ files that have `source_step` and `source_doc` frontmatter (created by `/ingest-todo`), then checks off the corresponding items in the TODO.md file.

## Step 1: Find Archived REQs with Source Metadata

Scan these locations for REQ files with `source_step` and `source_doc` frontmatter:
- `do-work/archive/` (top-level archived REQs)
- `do-work/archive/UR-*/` (REQs archived inside UR folders)

For each REQ, read the frontmatter and collect:
- `source_step` — the TODO step number (e.g., "0.1", "2.3")
- `source_doc` — the TODO file path (e.g., "docs/v2-upgrade-TODO.md")
- `status` — should be `completed` for archived REQs

If a specific TODO file was provided as an argument, filter to only REQs matching that `source_doc`.

## Step 2: Group by TODO File

Group the completed REQs by `source_doc`. This supports syncing multiple TODO files if REQs from different document sets were processed.

## Step 3: Check Off Completed Steps

For each TODO file with completed steps:

1. Read the TODO file
2. For each completed `source_step`:
   - Find the step's section (e.g., `### 0.1 Define new color palette`)
   - Change all `- [ ]` checkbox items under that step to `- [x]`
   - Only change items within that step's section (stop at the next `###` heading or `---` separator)
3. Write the updated TODO file

**Important:** Only check off items for steps whose REQ has `status: completed` in the archive. If a REQ was archived with a different status (e.g., `skipped`, `blocked`), leave those items unchecked.

## Step 4: Report

Print a summary:
```
Synced {TODO file}:

Checked off:
  - Step 0.1: Define new color palette (5 items)
  - Step 0.2: Copy profile photo asset (2 items)
  - Step 1.1: Update Header with location (3 items)

Already checked: Step 5.1 (was already complete)

Not in archive (still pending):
  - Step 2.1: Create Hero section with photo
  - Step 2.2: Create Tool Preview component
  ...

Total: {N}/{M} steps completed
```

## Edge Cases

- **Partial steps**: If a step had some items pre-checked before ingestion and the REQ is now archived as completed, check off all remaining items in that step.
- **No archived REQs found**: Report that no completed REQs with source metadata were found. Suggest running `do work run` first.
- **REQ archived but not completed**: If a REQ is in the archive but its status is not `completed`, skip it and note it in the report.
- **TODO file not found**: Report the error and list which `source_doc` values were found in the archive.
- **Multiple TODO files**: If no argument is provided and REQs reference multiple TODO files, sync all of them and report each separately.
