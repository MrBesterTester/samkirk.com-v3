# do-work & Automation Review — Fix Plan

Consolidated findings from a thorough review of all do-work action files, bridge skills (ingest-todo, sync-todo), and CLAUDE.md configuration.

---

## Tier 1: Will cause incorrect agent behavior

### 1. Failed REQs block UR archival forever

**Files:** `work.md:747-748` vs `work.md:866`

**Problem:** Line 747 checks if "ALL listed REQs are now completed" and counts REQs found in `archive/` root as complete. Line 866 says "A failed REQ does not count as 'complete' for UR archival purposes." Failed REQs land in `archive/` root, so an agent finds them there, sees `status: failed`, and has two contradictory rules. Result: UR stays in `user-requests/` permanently.

**Fix:** In work.md around line 747, explicitly define what "completed" means in this context:

```markdown
- Check if ALL listed REQs are now resolved — meaning they have `status: completed` (not `failed`)
  in any of: `do-work/archive/` root, `do-work/archive/UR-NNN/`, or `do-work/user-requests/UR-NNN/`
- REQs with `status: failed` in `do-work/archive/` do NOT count — the UR stays open
  until the failed REQ is retried and succeeds, or the user explicitly archives the UR
```

Also add resolution guidance after line 866:

```markdown
**Resolution paths for failed REQs blocking a UR:**
- Retry: create a new REQ for the same work (the do action handles this)
- Skip: user runs `do work archive UR-NNN` to force-close the UR despite failures
- The cleanup action will report URs blocked by failed REQs in its summary
```

### 2. do.md Step 4 needs UR number that doesn't exist until Step 5

**Files:** `do.md:492` vs `do.md:534-537`

**Problem:** Step 4 (screenshot handling) copies files to `do-work/user-requests/UR-[num]/assets/`. Step 5 creates the UR folder and determines the number. Sequential execution fails.

**Fix:** In do.md Step 4, change the screenshot copy instruction to defer the actual copy:

```markdown
3. **Note screenshot for UR assets**: Record the screenshot path for copying in Step 5.
   Do NOT copy yet — the UR folder doesn't exist until Step 5.
```

Then in Step 5, after creating the UR folder, add:

```markdown
b. Create `do-work/user-requests/UR-NNN/assets/` folder
c. Copy any screenshots noted in Step 4 into the assets folder
```

### 3. sync-todo misses completed REQs in user-requests folders

**File:** `sync-todo/SKILL.md:21-26`

**Problem:** Only scans `do-work/archive/` and `do-work/archive/UR-*/`. Misses completed REQs in `do-work/user-requests/UR-NNN/` that are waiting for sibling REQs.

**Fix:** Add third scan location in sync-todo Step 1:

```markdown
Scan these locations for REQ files with `source_step` and `source_doc` frontmatter:
- `do-work/archive/` (top-level archived REQs)
- `do-work/archive/UR-*/` (REQs archived inside UR folders)
- `do-work/user-requests/UR-*/` (completed REQs waiting for UR consolidation)
```

---

## Tier 2: Creates agent confusion or wasted work

### 4. `related`, `batch`, `addendum_to` — classification unclear

**Files:** `work.md:230-234` vs `do.md:310-320`

**Problem:** work.md defines do-action fields as `id, title, status, created_at, user_request` and says custom fields go at the bottom. But `related`, `batch`, and `addendum_to` appear in do.md examples right after `user_request`. Agents don't know where to insert `claimed_at`.

**Fix:** In work.md's field ordering rule (line 232), explicitly classify these:

```markdown
Do-action fields (`id`, `title`, `status`, `created_at`, `user_request`) stay at the top.
Optional do-action fields (`related`, `batch`, `addendum_to`) follow, if present.
Work-action fields (`claimed_at`, `route`, `completed_at`, `commit`, `error`) are appended below them.
Custom fields from ingestion (`source_step`, `source_doc`, `blueprint_ref`, `model_hint`, etc.) stay at the bottom.
```

Update the schema table (lines 195-228) to include these optional fields with `do` as the action.

### 5. Status values `exploring` and `implementing` not in schema

**File:** `work.md:221` vs `work.md:377,452`

**Problem:** Schema lists `pending | claimed | testing | completed | failed`. Steps 5 and 6 use `exploring` and `implementing` which aren't in the schema.

**Fix:** Update the schema status field (line 221) and the Status Flow diagram (lines 236-244):

```markdown
| `status` | Both | Throughout | `pending` → `claimed` → [`exploring`] → [`implementing`] → `testing` → `completed` or `failed` |
```

```
pending (in do-work/, set by do action)
    → claimed (moved to working/, set by work action)
    → [exploring] → [implementing] → testing
    → completed (moved to archive/)
    ↘ failed (moved to archive/ with error)
```

### 6. Cleanup trigger description contradicts work.md

**File:** `cleanup.md:9` vs `work.md:936`

**Problem:** cleanup.md says "automatically at the end of every work loop." work.md says only when exiting (queue empty or limit reached).

**Fix:** Update cleanup.md line 9:

```markdown
- **Automatically** at the end of the work loop (when the queue is empty or `--limit` is reached)
```

### 7. Ambiguous "merge contents" in cleanup Pass 3

**File:** `cleanup.md:60`

**Problem:** No guidance on filename collisions during merge.

**Fix:** Replace line 60:

```markdown
- If `do-work/archive/UR-NNN/` DOES already exist: move files from the misplaced folder
  into the correct one. If a filename exists in both locations, keep the file in the
  correct location (skip the duplicate) and report a warning.
```

### 8. CONTEXT file handling in wrong pass

**File:** `cleanup.md:64-65`

**Problem:** Loose CONTEXT files handled in Pass 3 ("Fix Misplaced Folders") but belong in Pass 2 ("Consolidate Loose Files").

**Fix:** Move lines 64-65 content to the end of Pass 2, after the REQ handling logic. Add:

```markdown
For each `CONTEXT-*.md` file directly in `do-work/archive/`:
- Move to `do-work/archive/legacy/` (create if needed)
- Report: `Moved CONTEXT-XXX to archive/legacy/ (legacy context doc)`
```

Remove lines 64-65 from Pass 3.

### 9. Missing idempotency search locations in ingest-todo

**File:** `ingest-todo/SKILL.md:177`

**Problem:** Doesn't check `archive/UR-*/` or `user-requests/UR-*/` for existing REQs.

**Fix:** Expand the idempotency note:

```markdown
- **Idempotency**: Before creating REQs, scan for existing REQs with matching
  `source_step` AND `source_doc` in:
  - `do-work/` (pending queue)
  - `do-work/working/` (in progress)
  - `do-work/archive/` root (archived loose)
  - `do-work/archive/UR-*/` (archived in UR folders)
  - `do-work/user-requests/UR-*/` (completed, awaiting UR consolidation)
  - If found with `status: completed` or `pending` or `claimed`: skip
  - If found with `status: failed`: ask user whether to re-create or skip
```

---

## Tier 3: Ambiguities and polish

### 10. Addendum decision tree unclear

**File:** `do.md:390-413`

**Fix:** Replace "Ask if they want to update" with: "Append an addendum section (non-destructive). If the user wants a separate REQ instead, they'll say so."

### 11. "related" field population logic unspecified

**File:** `ingest-todo/SKILL.md:117`

**Fix:** Change template to `related: []` and add note: "Populated during ingestion with REQ IDs of other steps created in the same batch. If dependencies are unclear, leave empty."

### 12. Batch constraints scope ambiguous

**File:** `do.md:606-620`

**Fix:** Add: "Skip this step for single-REQ complex requests. Batch constraints only apply when 2+ REQs are created."

### 13. Failed REQ checklist items

**File:** `work.md:726` vs `work.md:839-869`

**Fix:** Add to failure path: "Leave checklist items as-is (do not check them off). Unchecked items show what work was not completed."

### 14. Stale "current prefixed set" in CLAUDE.md

**File:** `CLAUDE.md:15`

**Fix:** Change to: `**Current prefixed set**: _(none active — v2-upgrade completed)_`

### 15. Pre-existing test failure handling

**File:** `work.md:606-634`

**Fix:** Add after "If tests fail" section: "If failures are pre-existing (present before this REQ's changes), note them in the Testing section as pre-existing and proceed. Only failures introduced by this REQ's changes should trigger the fix loop."

---

## Execution Order

1. **work.md** — Issues 1, 4, 5, 13, 15 (most impactful file)
2. **do.md** — Issues 2, 10, 12
3. **cleanup.md** — Issues 6, 7, 8
4. **sync-todo/SKILL.md** — Issue 3
5. **ingest-todo/SKILL.md** — Issues 9, 11
6. **CLAUDE.md** — Issue 14

Version bump and changelog after all edits.
