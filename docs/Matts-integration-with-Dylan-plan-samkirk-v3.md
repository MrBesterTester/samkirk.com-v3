# Plan: Integrate do-work into samkirk-v3 (Merging with Dylan Davis 50+ Method)

## Overview

Install the do-work skill from `/Users/sam/Projects/do-work` into `/Users/sam/Projects/samkirk-v3`, then create a bridge that converts Dylan Davis TODO.md steps into do-work REQ files. This gives samkirk-v3 autonomous queue processing while preserving its existing three-document methodology.

**Disruption level: Low.** No existing files are modified except CLAUDE.md and the two existing skill files (start-step, continue-step). A new `do-work/` folder appears in the project root. Everything else is additive.

---

## Step 1: Install do-work skill

```bash
cd /Users/sam/Projects/samkirk-v3
npx skills add bladnman/do-work
```

This adds SKILL.md + action files under `.claude/skills/`. Does not touch existing skills (start-step, continue-step, create-spec, create-blueprint, create-todo). The `do-work/` queue folder gets created on first use.

**Add to `.gitignore`:**
```
do-work/working/
```

The `do-work/` root (pending REQs) and `do-work/archive/` should be committed as project artifacts. Only `working/` is transient.

---

## Step 2: Create the bridge skill — `ingest-todo.md`

**New file:** `/Users/sam/Projects/samkirk-v3/.claude/skills/ingest-todo.md`

This is the core integration piece. It parses a TODO.md, reads the corresponding BLUEPRINT and SPECIFICATION, and generates do-work REQ files.

**Behavior:**
1. Accept a TODO file path (default: `docs/v2-upgrade-TODO.md`)
2. Auto-resolve companion docs from naming convention (`v2-upgrade-TODO.md` → `v2-upgrade-BLUEPRINT.md` + `v2-upgrade-SPECIFICATION.md`)
3. Parse all unchecked steps (e.g., step 0.1, 0.2, 1.1...) — each step becomes one REQ
4. For each step, extract: title, checkbox items, model label, corresponding Blueprint section
5. Create one UR folder with the full TODO content as verbatim input
6. Create REQ files with custom frontmatter fields:
   - `source_step: "0.1"` — links back to TODO step number
   - `source_doc: docs/v2-upgrade-TODO.md` — which TODO file
   - `blueprint_ref: docs/v2-upgrade-BLUEPRINT.md` — implementation guidance source
   - `model_hint: "Opus 4.5"` — advisory, from TODO's `[Opus 4.5]` labels
   - `batch: v2-upgrade-phase-0` — groups related steps

**Granularity:** Each numbered step (0.1, 0.2, 1.1...) = one REQ. The v2-upgrade-TODO has **18 steps** = **18 REQ files**. Individual checkbox items within a step are sub-requirements inside the REQ, not separate REQs.

**Usage:**
```
/ingest-todo                              # defaults to v2-upgrade-TODO.md
/ingest-todo docs/v2-upgrade-TODO.md      # explicit
/ingest-todo docs/v3-upgrade-TODO.md      # future cycles
```

---

## Step 3: Update start-step.md and continue-step.md

**Files to modify:**
- `/Users/sam/Projects/samkirk-v3/.claude/skills/start-step.md`
- `/Users/sam/Projects/samkirk-v3/.claude/skills/continue-step.md`

**Change:** Add support for a doc-set prefix parameter. Currently they hardcode `@docs/SPECIFICATION.md @docs/BLUEPRINT.md @docs/TODO.md`. With the change:

- `start-step 2.1` → reads V1 docs (default, unchanged behavior)
- `start-step 2.1 v2-upgrade` → reads `docs/v2-upgrade-SPECIFICATION.md`, `docs/v2-upgrade-BLUEPRINT.md`, `docs/v2-upgrade-TODO.md`
- `continue-step 2.2 v2-upgrade` → same pattern

This keeps these skills useful as manual fallback when the autonomous loop isn't appropriate (visual testing steps, debugging, etc.).

---

## Step 4: Update CLAUDE.md

**File:** `/Users/sam/Projects/samkirk-v3/CLAUDE.md`

Add a section explaining the dual workflow:

- **Planned work** (spec → blueprint → todo → ingest → do-work queue → autonomous processing)
- **Ad-hoc work** (direct `do work [description]` for bugs/features outside any TODO)
- **Manual fallback** (`start-step` / `continue-step` for steps needing human judgment)
- **Post-loop sync** instruction: after cleanup, check off completed TODO items using `source_step` frontmatter from archived REQs
- **Git workflow** note: do-work commits locally per REQ; squash when pushing to remote

---

## Step 5: Optional — Create `sync-todo.md` skill

**New file:** `/Users/sam/Projects/samkirk-v3/.claude/skills/sync-todo.md`

After `do work run` completes, this skill reads archived REQs with `source_step` + `source_doc` frontmatter and checks off the corresponding items in the TODO.md file. Keeps the Dylan Davis single-pane-of-glass view in sync.

This can alternatively be a CLAUDE.md instruction (lighter touch) instead of a dedicated skill.

---

## Git Workflow Reconciliation

**No conflict.** The two approaches are naturally compatible:

1. `do work run` → commits each REQ locally (granular history on working branch)
2. User reviews results
3. Existing squash-push workflow → squashes all per-REQ commits into one clean commit

The per-REQ commits become the "working branch history" that gets squashed. This is exactly what samkirk-v3 already does — just automated.

---

## How It All Fits Together

### The Combined Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  Dylan Davis 50+ Method (Planning Layer)                     │
│                                                              │
│  SPECIFICATION.md ──→ BLUEPRINT.md ──→ TODO.md               │
│       (what)              (how)          (checklist)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                     /ingest-todo (bridge)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  do-work (Execution Layer)                                   │
│                                                              │
│  REQ-001 ──→ REQ-002 ──→ REQ-003 ──→ ... ──→ REQ-018       │
│   (0.1)       (0.2)       (1.1)                (5.3)        │
│                                                              │
│  do work run ──→ triage ──→ explore ──→ build ──→ commit    │
│       │                                             │        │
│       └─────── loop until queue empty ──────────────┘        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                     /sync-todo (checkbox sync)
                               │
                               ▼
                    TODO.md checkboxes updated
```

### Two-Terminal Operation (from Matt Maher's Technique #5)

**Terminal 1 — Capture & Plan:**
- Create new specs with `/create-spec`
- Generate blueprints with `/create-blueprint`
- Generate TODOs with `/create-todo`
- Ingest with `/ingest-todo`
- Drop ad-hoc requests: `do work fix the header overflow`

**Terminal 2 — Build:**
- `do work run` — processes the queue autonomously
- Each REQ gets fresh sub-agent context (Technique #4: Clear Context)
- Commits per request with full traceability
- Archives completed work

### Follow-On Cycles

The pattern repeats for every upgrade:

```
v2-upgrade-SPECIFICATION.md ──→ v2-upgrade-BLUEPRINT.md ──→ v2-upgrade-TODO.md
                                                                     │
                                                           /ingest-todo
                                                                     │
                                                              do work run
                                                                     │
v3-upgrade-SPECIFICATION.md ──→ v3-upgrade-BLUEPRINT.md ──→ v3-upgrade-TODO.md
                                                                     │
                                                           /ingest-todo
                                                                     │
                                                              do work run
```

Ad-hoc requests (bugs, ideas, small features) go directly into do-work without needing a spec/blueprint/todo cycle.

---

## Disruption Summary

| Area | Impact | Notes |
|------|--------|-------|
| New files added | Low | `do-work/` folder, `ingest-todo.md` skill, optionally `sync-todo.md` |
| Existing files modified | Low | CLAUDE.md (add section), start-step.md and continue-step.md (add prefix param) |
| Git workflow | None | Per-REQ commits squash naturally into clean-main |
| Existing skills | None | All 5 existing skills continue to work |
| Testing infrastructure | None | do-work auto-detects Vitest/Playwright |
| Project structure | None | `web/`, `docs/`, `.claude/` untouched |

---

## Model Recommendation Handling

The Dylan Davis TODO.md labels each task with a model recommendation (`[Opus 4.5]`, `[Gemini 3 Pro]`, etc.). do-work doesn't select models per request. The bridge handles this by:

1. Embedding the label as `model_hint` in REQ frontmatter (advisory metadata)
2. Including it in the REQ body's Context section
3. Sub-agents see the hint and can act on it if the tool supports model selection
4. Steps requiring visual testing (`[Gemini 3 Pro]`) get flagged with `manual_review: true` — the work loop completes the implementation but notes that manual visual verification is needed

---

## Verification Plan

1. Install do-work and confirm `do work version` responds
2. Create a test request: `do work add a test request` — verify REQ file appears in `do-work/`
3. Run `/ingest-todo` on v2-upgrade-TODO.md — verify 18 REQ files are created with correct frontmatter
4. Process Phase 0 only (2 REQs): `do work run` — verify it completes, commits, and archives
5. Check that `npm test` still passes (819+ tests)
6. Run `/sync-todo` or manually verify TODO checkboxes updated
7. Test `start-step 1.1 v2-upgrade` as manual fallback

---

## References

- **do-work skill:** `/Users/sam/Projects/do-work/` — [GitHub](https://github.com/bladnman/do-work)
- **Dylan Davis 50+ Method:** `/Users/sam/Projects/samkirk-v3/docs/Dylan-Davis-50plus-method.md`
- **Matt Maher's Techniques:** `/Users/sam/Projects/do-work/docs/Matt-Maher_Claude-Code.html`
- **samkirk-v3 v2-upgrade TODO:** `/Users/sam/Projects/samkirk-v3/docs/v2-upgrade-TODO.md` (18 steps, 86 items)
