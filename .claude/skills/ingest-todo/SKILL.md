---
name: ingest-todo
description: Parse a Dylan Davis TODO.md into do-work REQ files for autonomous processing
argument-hint: (TODO file path) | docs/v2-upgrade-TODO.md
---

# Ingest TODO

**Purpose:** Parse a Dylan Davis TODO.md file and generate do-work REQ files for autonomous processing.

**Usage:**
```
/ingest-todo                              # defaults to docs/v2-upgrade-TODO.md
/ingest-todo docs/v2-upgrade-TODO.md      # explicit path
/ingest-todo docs/v3-upgrade-TODO.md      # future upgrade cycles
```

## How It Works

This skill bridges the Dylan Davis 50+ methodology (SPECIFICATION + BLUEPRINT + TODO) with the do-work execution layer. Each numbered step in the TODO becomes one REQ file in the do-work queue.

## Step 1: Resolve the Document Set

Given a TODO file path (default: `docs/v2-upgrade-TODO.md`):

1. Extract the prefix from the filename: `v2-upgrade-TODO.md` → prefix is `v2-upgrade`
2. Resolve companion documents using the naming convention:
   - **SPECIFICATION**: `docs/{prefix}-SPECIFICATION.md`
   - **BLUEPRINT**: `docs/{prefix}-BLUEPRINT.md`
   - **TODO**: `docs/{prefix}-TODO.md` (the input file)
3. Verify all three files exist. If any are missing, report the error and stop.
4. Read all three documents into context.

## Step 2: Parse the TODO

Scan the TODO file for all **unchecked** steps. A step is a numbered section like `### 0.1 Define new color palette` containing checkbox items (`- [ ]`).

For each unchecked step, extract:
- **Step number**: e.g., `0.1`, `2.3`
- **Phase number and name**: from the parent `## Phase N` heading (e.g., Phase 0 — Foundation)
- **Step title**: the heading text after the number (e.g., "Define new color palette")
- **Checkbox items**: all `- [ ]` lines under that step
- **Model hints**: the `[Opus 4.5]`, `[Gemini 3 Pro]`, etc. labels on each checkbox item. Use the most common label as the step-level hint.
- **Already-checked items**: count any `- [x]` items — if ALL items in a step are checked, skip that step entirely

**Skip rules:**
- Skip steps where ALL checkbox items are `- [x]` (already completed)
- Include steps where SOME items are unchecked (partial completion) — note which items are already done

## Step 3: Find Blueprint Sections

For each step, locate the corresponding section in the BLUEPRINT document. Match by:
1. Step number (e.g., "Step 0.1" or "0.1" in a heading)
2. Phase number + step title keywords

Include the relevant Blueprint guidance in each REQ's context.

## Step 4: Create the UR Folder

Create a single User Request (UR) for the entire ingest operation:

1. Determine the next UR number (check `do-work/user-requests/` and `do-work/archive/UR-*/`)
2. Create `do-work/user-requests/UR-NNN/input.md`

The UR input.md should contain:
```markdown
---
id: UR-NNN
title: "Ingest: {prefix} TODO ({N} steps)"
created_at: {ISO 8601 timestamp}
requests: []  # Fill in after creating REQs
word_count: {word count of TODO file}
---

# Ingest: {prefix} TODO

## Summary
Ingested {N} unchecked steps from {TODO path} into do-work REQ files.
Document set: {prefix}-SPECIFICATION.md, {prefix}-BLUEPRINT.md, {prefix}-TODO.md.

## Extracted Requests

| ID | Step | Title | Model Hint |
|----|------|-------|------------|
| REQ-NNN | 0.1 | Define new color palette | Opus 4.5 |
| ... | ... | ... | ... |

## Full Verbatim Input

{Paste the FULL contents of the TODO file here, unedited}

---
*Captured: {timestamp}*
```

## Step 5: Create REQ Files

For EACH unchecked step, create a REQ file at `do-work/REQ-NNN-{slug}.md`.

The slug should be derived from the step title (lowercase, hyphens, 3-5 words max).

### REQ File Format

```markdown
---
id: REQ-NNN
title: "{Step title}"
status: pending
created_at: {ISO 8601 timestamp}
user_request: UR-NNN
# work-action fields (claimed_at, route, completed_at, commit, error) go here
source_step: "{step number}"
source_doc: "{TODO file path}"
blueprint_ref: "{BLUEPRINT file path}"
model_hint: "{most common model label for this step}"
batch: "{prefix}-phase-{phase number}"
related: [{REQ IDs of other steps in same phase}]
---

# {Step title} (Step {step number})

## What
{1-3 sentence description derived from the step title and checkbox items}

## Checklist
{List all checkbox items from this step, preserving the original text}
- [ ] {item 1}
- [ ] {item 2}
- [x] {already completed item, if any}

## Blueprint Guidance
{Paste the relevant section from the BLUEPRINT document that corresponds to this step.
Include the full section — do not summarize.}

## Context
- **Document set**: {prefix}
- **Phase**: {phase number} — {phase name}
- **Specification**: See {SPECIFICATION path} for full requirements
- **Model recommendation**: {model_hint} (advisory — use if your tool supports model selection)

## Dependencies
{Note any ordering dependencies visible from the TODO structure.
For example, Phase 0 should complete before Phase 1, etc.}

---
*Source: {TODO path}, Step {step number}*
```

## Step 6: Link and Report

1. Go back to the UR input.md and fill in the `requests` array with all created REQ IDs
2. Update the "Extracted Requests" table with actual REQ numbers

Report a summary to the user:
```
Ingested {N} steps from {TODO path}:

Phase 0 — Foundation:
  - REQ-001 (0.1) Define new color palette [Opus 4.5]
  - REQ-002 (0.2) Copy profile photo asset [Codex/Opus]

Phase 1 — Header & Footer Updates:
  - REQ-003 (1.1) Update Header with location [Opus 4.5]
  ...

Skipped: Step 5.1 (already completed)

UR folder: do-work/user-requests/UR-NNN/
Total: {N} REQ files in do-work/

Tip: Run `do work verify` to check capture quality, or `do work run` to start processing.
```

## Important Notes

- **Granularity**: Each numbered step = one REQ. Individual checkbox items within a step are sub-requirements inside the REQ, NOT separate REQs.
- **Idempotency**: Before creating REQs, check if REQs with matching `source_step` and `source_doc` already exist in `do-work/`, `do-work/working/`, or `do-work/archive/`. If a step was already ingested, skip it and note it in the report.
- **Custom frontmatter**: The `source_step`, `source_doc`, `blueprint_ref`, `model_hint`, and `batch` fields are custom extensions for the Dylan Davis bridge. The work action and sync-todo skill use these for traceability.
- **Partial steps**: If a step has some checked and some unchecked items, include it but mark which items are already done. The builder should skip completed items.
