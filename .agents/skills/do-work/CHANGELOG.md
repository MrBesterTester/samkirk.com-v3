# Changelog

What's new, what's better, what's different. Most recent stuff on top.

---

## 0.12.3 — The Explicit Loop (2026-02-14)

Made the UR completion check algorithm explicit so agents can follow it mechanically. The previous prose said the current REQ "counts as resolved implicitly," but agents iterating the `requests` array and searching archive locations would miss the current REQ (still in `working/`) and wrongly conclude the UR isn't ready. Now it's a clear pseudocode loop: skip the current REQ ID, search the three archive locations for everything else.

- Rewrote UR completion check (work.md ~line 756) as step-by-step pseudocode algorithm
- Current REQ is now an explicit skip condition, not a buried parenthetical

## 0.12.2 — The Ghost Hunt II (2026-02-14)

Reverted 0.12.1's re-addition of `do-work/working/` to the UR completion check. The 0.11.2 removal was correct — completed REQs are never in `working/` by invariant. The current REQ counts as resolved implicitly (you just set its status in Step 7.1). Searching `working/` was inconsistent with cleanup.md, which correctly omits it.

- Removed `do-work/working/` from UR completion check search locations (work.md line 756)
- Added explicit note that the current REQ counts as resolved implicitly

## 0.12.1 — The Missing Search (2026-02-14)

Fixed a bug where the UR completion check in Step 7 didn't search `do-work/working/` for the just-completed REQ. An orchestrator following the instructions literally would miss it and fail to consolidate the UR.

- Added `do-work/working/` as a search location in the UR completion check (work.md line 756)

## 0.12.0 — The Dashboard (2026-02-14)

Quick queue status at a glance. `do work list` (or `status`, `queue`) shows pending, in-progress, held, and archived request counts in a compact table — no scrolling through files to see where things stand.

- Added list action: `do work list`, `do work status`, `do work queue`
- New routing priority 5 for list keywords
- Shows pending REQs first, then in-progress, then held, with archived count

## 0.11.5 — The Honest Count (2026-02-14)

Step 6 (Report Back) now requires checking the actual queue directory for pending REQ count instead of relying on memory. Prevents stale counts when REQs are processed between do-action invocations.

- Added live queue count rule to do.md Step 6
- Prevents reporting archived REQs as still pending

## 0.11.4 — The Gitignore Fix (2026-02-14)

REQ discovery was invisible to file-search tools because `do-work/` is gitignored. Step 1 now explicitly instructs agents to use a shell command (`ls`) instead of file-search tools that respect `.gitignore`.

- Updated work.md Step 1 to use shell listing instead of file-search tools
- Prevents agents from silently finding zero pending REQs

## 0.11.3 — The Safety Net (2026-02-13)

Cleanup Pass 1 now explicitly states that failed REQs don't count toward UR completion, matching work.md's semantics. Previously the check only looked for `status: completed` without calling out what happens with `status: failed`, leaving room for misinterpretation.

- Added explicit failed-REQ exclusion note to cleanup.md Pass 1 step 2
- Updated "still open" report format to include failed REQ count

## 0.11.2 — The Ghost Hunt (2026-02-12)

Fixed UR consolidation scan checking `working/` for completed REQs. Completed REQs are never in `working/` — they're moved to `archive/` immediately. The scan now checks only `archive/` root, `archive/UR-NNN/`, and `user-requests/UR-NNN/`, with the current REQ counted as resolved implicitly.

- Removed `do-work/working/` from UR consolidation scan locations (work.md)
- Added explicit note that the current REQ counts as resolved since it just completed

## 0.11.1 — The Order of Things (2026-02-12)

Added a Field Ordering Rule to do.md so agents creating REQ files produce frontmatter in the same order work.md expects. Previously only work.md had the rule (for updates), so creation-time tools like ingest-todo had no guidance and placed custom fields before optional do-action fields.

- Added Field Ordering Rule section to do.md with canonical 3-group creation order
- Fixed field ordering in all 17 archived UR-001 REQ files to match the rule
- Fixed ingest-todo REQ template to place `related`/`batch` before custom fields

## 0.11.0 — The Consistency Pass (2026-02-12)

Comprehensive review and fix of 15 issues across all do-work action files, bridge skills, and CLAUDE.md. Failed REQs no longer silently block UR archival forever, screenshot handling no longer references folders that don't exist yet, and the schema now matches what agents actually write.

- Fixed failed REQs blocking UR archival — added explicit "resolved" semantics and resolution paths (work.md)
- Fixed screenshot copy in do action referencing UR folder before it exists — deferred to Step 5 (do.md)
- Added `user-requests/UR-*/` as scan location for sync-todo and ingest-todo idempotency checks
- Classified `related`, `batch`, `addendum_to` as optional do-action fields in schema and field ordering (work.md)
- Added `exploring` and `implementing` to status schema and flow diagram (work.md)
- Fixed cleanup trigger description to match work.md ("queue empty or limit reached") (cleanup.md)
- Added filename collision guidance for merge in cleanup Pass 3 (cleanup.md)
- Moved CONTEXT file handling from Pass 3 to Pass 2 where it belongs (cleanup.md)
- Expanded ingest-todo idempotency to scan all 5 locations, with failed-REQ retry prompt
- Changed `related` template default to `[]` with population guidance (ingest-todo)
- Replaced ambiguous addendum question with non-destructive append default (do.md)
- Added batch constraints skip note for single-REQ requests (do.md)
- Added failed-REQ checklist rule: leave items unchecked on failure (work.md)
- Added pre-existing test failure handling: note and proceed (work.md)
- Updated stale "current prefixed set" in CLAUDE.md

## 0.10.10 — The Boundary Cop (2026-02-12)

Cleanup was searching `do-work/working/` for completed REQs and even gathering files from it — but its own rules say it must never touch `working/`. The work action is solely responsible for moving files out of `working/`, and completed REQs land in `archive/` or UR folders. Removed the dead search path and the contradictory gather step.

- Removed `do-work/working/` from Pass 1 search locations
- Removed gather step that pulled completed REQs from `working/`

## 0.10.9 — The Timestamp (2026-02-12)

The failure frontmatter example was missing `completed_at`, which should be set when work finishes regardless of success or failure. Agents following the example would create incomplete records, breaking the `claimed_at` → `completed_at` timing chain.

- Added `completed_at` to the failure frontmatter example in work.md

## 0.10.8 — The Matchmaker (2026-02-12)

The "move archive REQs into UR folder" step didn't explain how to identify which REQs belong to the current UR. An agent could move all, none, or guess wrong. Now it explicitly says to read each file's frontmatter and check `user_request: UR-NNN`.

- Clarified archive REQ identification in work.md line 750: scan frontmatter for matching `user_request` field

## 0.10.7 — The Full Picture (2026-02-10)

Both 0.10.5 and 0.10.6 were half-right. The `user-requests/UR-NNN/` check (0.10.5) covers partial-failure recovery — when work.md's "all complete" path moves REQs into the UR folder but crashes before archiving it. The `archive/UR-NNN/` check (0.10.6) covers cleanup consolidation. Both are needed, and cleanup.md was also missing the UR-folder-itself check.

- Restored `user-requests/UR-NNN/` check in work.md (0.10.6 wrongly removed it)
- Kept `archive/UR-NNN/` check in work.md (valid for consolidation edge cases)
- Added `user-requests/UR-NNN/` check to cleanup.md Pass 1 (was also missing)

## 0.10.6 — The Right Folder (2026-02-10)

The 0.10.5 fix added `user-requests/UR-NNN/` as a check location, but that's wrong — completed REQs from earlier iterations land in `archive/UR-NNN/` (via cleanup consolidation), not `user-requests/`. Fixed to match cleanup.md's correct logic.

- Changed third check location from `do-work/user-requests/UR-NNN/` to `do-work/archive/UR-NNN/`

## 0.10.5 — The Missing Folder (2026-02-10)

The UR completion check only looked in `working/` and `archive/` for completed REQs, missing ones already moved into the UR folder itself. This could strand partial UR folders in `user-requests/` because the orchestrator never saw all REQs as done.

- Added `do-work/user-requests/UR-NNN/` as a third location in the Step 7 completion check

## 0.10.4 — The Checkbox (2026-02-10)

Completed REQ files were archived with unchecked `- [ ]` boxes — contradicting their `status: completed`. The work action now checks off all checklist items when marking a request complete, so the file reads as a truthful record.

- Added Step 7 sub-step: replace `- [ ]` with `- [x]` on completion
- Added checkbox item to orchestrator checklist
- Added to common mistakes list

## 0.10.3 — The Disambiguator (2026-02-09)

The 0.10.2 fix changed "step 3" to "step 4", but "step 4" is still ambiguous — it could mean Step 4 (Planning Phase) in the main workflow. Changed to "item 4 below" so agents route to the cleanup/exit list item, not the planning phase.

- Clarified Step 9 item 1: "go to step 4" → "proceed to item 4 below"

## 0.10.2 — The Off-by-One (2026-02-06)

Step 9's limit-reached branch said "go to step 3" — which was the "keep looping" branch, not the exit. Fixed the reference to point to step 4 (cleanup and exit). Without this, an agent hitting the limit could loop instead of stopping.

- Fixed step reference in Step 9 item 1: "go to step 3" → "go to step 4"

## 0.10.1 — The Orderly (2026-02-06)

Frontmatter fields kept ending up scrambled — `completed_at` before `created_at`, claim fields above do-action fields. The schema defined the right order but the step snippets only showed changed fields, so agents inserted them wherever. Now every frontmatter snippet in work.md shows the full field context with explicit "preserve field order" notes, plus a dedicated Field Ordering Rule section.

- Added "Field Ordering Rule" section after the schema
- Updated Step 2, 3, 7 frontmatter snippets to show full field context
- Updated failure frontmatter snippet with full field context
- Fixed 16 existing REQ files in UR-002 archive

## 0.10.0 — The Speed Limit (2026-02-06)

You can now cap how many requests the work loop processes before stopping. `do work run --limit 5` processes at most 5 REQs, then exits cleanly with a summary. Great for managing context window usage across sessions — run a few, start fresh, repeat.

- Added `--limit N` flag to the work action
- Step 9 loop checks the limit after each completed request
- Exit summary shows limit status and remaining queue count
- SKILL.md routing passes `--limit` through with action verbs

## 0.9.5 — The Reinstall (2026-02-04)

`npx skills update` silently fails to update files despite reporting success. Switched the update command to `npx skills add bladnman/do-work -g -y` which does a full reinstall and actually works. Also fixed the upstream URL — version checks now hit `version.md` where the version number actually lives.

- Update command changed from `npx skills update` to `npx skills add -g -y` (full reinstall)
- Upstream URL fixed: `SKILL.md` → `actions/version.md`

## 0.9.4 — The Passport (2026-02-04)

Install and update commands are no longer tied to a single CLI tool. Switched from `npx install-skill` / `npx add-skill` to the portable `npx skills` CLI, which works across multiple agentic coding tools. Update checks now point to `npx skills update` instead of a reinstall command.

- README install command updated to `npx skills add bladnman/do-work`
- Version action "update available" message now suggests `npx skills update`
- Fallback/manual update uses `npx skills add` instead of `npx install-skill`

## 0.9.3 — The Timestamp (2026-02-04)

Every changelog entry now carries a date. Backfilled all existing entries from git history so nothing's undated. Future entries get dates automatically — the CLAUDE.md format template and rules were updated to enforce it.

- Added `(YYYY-MM-DD)` dates to all 12 existing changelog entries via git history
- Updated CLAUDE.md changelog format template to include date
- Added "Date every entry" rule to changelog guidelines

## 0.9.2 — The Front Door (2026-02-04)

The SKILL.md frontmatter was broken — missing closing delimiters and markdown syntax mixed into the YAML. The `add-skill` CLI couldn't parse the skill metadata properly. Now it's valid YAML frontmatter that tools can actually read.

- Fixed SKILL.md frontmatter: removed `##` from name field, added closing `---`
- Cleaned up upstream URL (was wrapped in a markdown link inside YAML)

## 0.9.1 — The Gatekeeper (2026-02-04)

Keywords like "version" and "changelog" were sneaking past the routing table and getting treated as task content. Fixed by reordering the routing table so keyword patterns are checked before the descriptive-content catch-all, and added explicit priority language so agents match keywords first.

- Routing table now has numbered priority — first match wins, top to bottom
- "Descriptive content" catch-all moved to last position (priority 7)
- Step 2 clarifies that single keywords matching the table are routed actions, not content
- Fixes: `do work version` no longer asks "Add this as a request?"

## 0.9.0 — The Rewind (2026-02-04)

You can now ask "what's new" and actually see what's new — right at the bottom of your terminal where you're already looking. The version action gained changelog display with a twist: it reverses the entries so the latest changes land at the bottom of the output, no scrolling required. Portable across skills — any project with a CHANGELOG.md gets this for free.

- Changelog display added to the version action: `do work changelog`, `release notes`, `what's new`, `updates`, `history`
- Entries print oldest-to-newest so the most recent version appears at the bottom of terminal output
- Routing table updated with changelog keyword detection
- Works with any skill that has a CHANGELOG.md in its root

## 0.8.0 — The Clarity Pass (2026-02-03)

The UR system was hiding in plain sight — documented everywhere but easy to miss if you weren't reading carefully. This release restructures the do action and skill definition so the UR + REQ pairing is unmissable, even for agents that skim. Also added agent compatibility guidance to CLAUDE.md so future edits keep the skill portable across platforms.

- Added "Required Outputs" section to top of do.md — UR + REQ pairing stated upfront as mandatory
- Restructured Step 5 Simple Mode — UR creation now has equal weight with REQ creation
- Added Do Action Checklist at end of workflow — mirrors the work action's orchestrator checklist
- Moved UR anti-patterns to general "What NOT To Do" section (was under complex-only)
- Updated SKILL.md with core concept callout about UR + REQ pairing
- Added Agent Compatibility section to CLAUDE.md — generalized language, standalone-prompt design, floor-not-ceiling

## 0.7.0 — The Nudge (2026-02-01)

Complex requests now get a gentle suggestion to run `/do-work verify` after capture. If your input had lots of features, nuanced constraints, or multiple REQs, the system lets you know verification is available — so you can catch dropped details before building starts. Simple requests stay clean and quiet.

- Verify hint added to do action's report step for meaningfully complex requests
- Triggers on: complex mode, 3+ REQ files, or notably long/nuanced input
- Two complex examples updated to show the hint in action
- No change for simple requests — no hint, no noise

## 0.6.0 — The Bouncer (2026-02-01)

Working and archive folders are now off-limits. Once a request is claimed by a builder or archived, nobody can reach in and modify it — not even to add "one more thing." If you forgot something, it goes in as a new addendum request that references the original. Clean boundaries, no mid-flight surprises.

- Files in `working/` and `archive/` are now explicitly immutable
- New `addendum_to` frontmatter field for follow-up requests
- Do action checks request location before deciding how to handle duplicates
- Work action reinforces immutability in its folder docs

## 0.5.0 — The Record Keeper (2026-02-01)

Now you can see what changed and when. Added this very changelog so the project has a memory. CLAUDE.md got updated with rules to keep it honest — every version bump gets a changelog entry, no exceptions.

- Added `CHANGELOG.md` with full retroactive history
- Updated commit workflow: version bump → changelog entry → commit

## 0.4.0 — The Organizer (2026-02-01)

The archive got a brain. New **cleanup action** automatically tidies your archive at the end of every work loop — closing completed URs, sweeping loose REQs into their folders, and herding legacy files where they belong. Also introduced the **User Request (UR) system** that groups related REQs under a single umbrella, so your work has structure from capture to completion.

- Cleanup action: `do work cleanup` (or automatic after every work loop)
- UR system: related REQs now live under UR folders with shared context
- Routing expanded: cleanup/tidy/consolidate keywords recognized
- Work loop exit now triggers automatic archive consolidation

## 0.3.0 — Self-Aware (2026-01-28)

The skill learned its own version number. New **version action** lets you check what you're running and whether there's an update upstream. Documentation got a glow-up too.

- Version check: `do work version`
- Update check: `do work check for updates`
- Improved docs across the board

## 0.2.0 — Trust but Verify (2026-01-27)

Added a **testing phase** to the work loop and clarified what the orchestrator is (and isn't) responsible for. REQs now get validated before they're marked done.

- Testing phase baked into the work loop
- Clearer orchestrator responsibilities
- Better separation of concerns

## 0.1.1 — Typo Patrol (2026-01-27)

Fixed a username typo in the installation command. Small but important — can't install a skill if the command is wrong.

- Fixed: incorrect username in `npx install-skill` command

## 0.1.0 — Hello, World (2026-01-27)

The beginning. Core task capture and processing system with do/work routing, REQ file management, and archive workflow.

- Task capture via `do work <description>`
- Work loop processing with `do work run`
- REQ file lifecycle: pending → working → archived
- Git-aware: auto-commits after each completed request

