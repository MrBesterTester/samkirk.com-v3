---
name: dylan-project-workflow
description: "Run the samkirk-v3 Dylan Davis three-document workflow: interview for a specification, derive a blueprint, create a TODO checklist, or start/continue a numbered TODO step with the matching spec and blueprint context. Use for create-spec, create-blueprint, create-todo, start-step, continue-step, or requests naming those documents and steps."
---

# Dylan Project Workflow

Route to the existing project instruction file and read it completely before acting:

| Intent | Source instruction |
|---|---|
| Create or interview for a specification | `.claude/skills/create-spec.md` |
| Create the implementation blueprint | `.claude/skills/create-blueprint.md` |
| Create the TODO checklist | `.claude/skills/create-todo.md` |
| Start a numbered step | `.claude/skills/start-step.md` |
| Continue a partially completed step | `.claude/skills/continue-step.md` |

## Codex adaptations

1. Treat model labels in the source documents as advisory historical hints; use the current Codex task's available model and tools.
2. Resolve the default or prefixed SPECIFICATION/BLUEPRINT/TODO trio exactly as the selected instruction describes. Read all three before implementing a numbered step.
3. During specification interviews, ask one focused question per turn and incorporate new references as they arrive.
4. For blueprints and TODOs, keep steps small, dependency-ordered, testable, and integrated. Do not require live API calls in tests when they would create cost, external side effects, or unstable results without explicit authorization.
5. Honor the nearest `AGENTS.md` and current repository evidence over stale wording in the historical Claude files.
6. Update checklist state only after the corresponding test or acceptance criterion passes. Preserve user-owned unrelated changes.
7. Use `ingest-todo` to queue a finished TODO and `sync-todo` to reconcile completed REQs back into it.
