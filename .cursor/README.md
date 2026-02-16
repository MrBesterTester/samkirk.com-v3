# .cursor/

Cursor IDE commands and rules for the Dylan Davis 50+ methodology workflow.

## Commands

Slash commands available in Cursor:

| Command | Purpose |
|---------|---------|
| `create-spec` | Launch specification interview → `docs/SPECIFICATION.md` |
| `create-blueprint` | Generate implementation blueprint → `docs/BLUEPRINT.md` |
| `create-todo` | Create TODO checklist with model labels → `docs/TODO.md` |
| `start-step` | Start a new TODO checklist item |
| `continue-step` | Advance to next checklist step |

## Rules

Always-applied project conventions:

- **`project.mdc`** — Stack details, type safety, model preferences, lessons learned
- **`phase-model-reminder.mdc`** — Which model to use per phase (Frontend: Opus 4.5, Backend: GPT-5.2, Debugging: Gemini 3 Pro)
- **`workflow-setup.mdc`** — Git command guardrails and setup checklist hygiene

## Claude Code Compatibility

See [`.claude/CURSOR-COMPATIBILITY.md`](../.claude/CURSOR-COMPATIBILITY.md) for how Cursor commands map to Claude Code natural language equivalents.
