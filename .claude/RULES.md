# Claude Code Rules for samkirk-v3

This file mirrors `.cursor/rules/` for Claude Code compatibility.

## Workflow Setup Guardrails

### Slash commands: global vs project

- Before creating **global** slash commands, always **check whether they already exist** in `~/.cursor/commands/` or `~/.claude/skills/`.
- If global commands already exist, **do not overwrite them** unless the user explicitly asks to replace/update them.
- Prefer creating **project** commands in `.cursor/commands/` or `.claude/skills/` for each new repo.

### Git workflow

Push directly to `main` after gitleaks scan passes — no squash, no intermediate branches. CI runs gitleaks + CodeQL on every push as a second gate. For one-time history scrubs (e.g., removing a leaked secret retroactively), use `git-filter-repo`.

### Setup checklist hygiene

- When you perform a setup step, immediately update the checklist in `docs/Dylan-Davis-50plus-method.md` (The Complete Workflow section):
  - mark the checkbox done
  - add a short "evidence" note (file exists / command ran)

## Phase Model Reminder

When the user is starting or continuing a **phase** from The Complete Workflow in `docs/Dylan-Davis-50plus-method.md` (e.g. Phase 1 Specification, Phase 2 Blueprint, Phase 4 Development):

1. **Remind them which model to use** for that phase.
2. The recommended model is written under each phase heading in `docs/Dylan-Davis-50plus-method.md`.

Do this in **every chat session**, including new ones—the user relies on this reminder so they can switch to the right model (e.g. ChatGPT Auto for spec, Claude Opus 4.5 for blueprint, or the task-specific model from TODO.md for development steps).

## Project Conventions

See `.cursor/rules/project.mdc` for the full project conventions, including:
- Stack (Next.js, TypeScript, React, Vertex AI, GCP)
- Type safety requirements
- Security best practices
- Model preferences
- Lessons learned

**Note:** This file serves as Claude Code's equivalent to Cursor's rules system. Both tools can coexist since they use different configuration directories.
