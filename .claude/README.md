# Claude Code Integration for samkirk-v3

This directory contains Claude Code configurations that mirror your Cursor setup, allowing both tools to work with the Dylan Davis 50+ methodology.

## Directory Structure

```
.claude/
├── README.md                   # This file
├── QUICKSTART.md               # Getting started guide
├── CURSOR-COMPATIBILITY.md     # Command mapping between Cursor and Claude Code
├── RULES.md                    # Project rules (mirrors .cursor/rules/)
├── settings.local.json         # Local Claude Code settings
└── skills/                     # Workflow skills (mirrors .cursor/commands/)
    ├── create-spec.md
    ├── create-blueprint.md
    ├── create-todo.md
    ├── start-step.md
    ├── continue-step.md
    ├── do-work -> ../../.agents/skills/do-work  # Autonomous task processing
    ├── do-work-finish-then-stop/                # Stop queue after current REQ
    ├── ingest-todo/                             # Convert TODO.md steps to REQ files
    └── sync-todo/                               # Sync archived REQs back to TODO.md
```

## Usage in Claude Code

### Development Workflow Commands

Instead of Cursor's slash commands, use natural language in Claude Code:

| Cursor Command | Claude Code Equivalent |
|----------------|------------------------|
| `/create-spec [idea]` | "Create a specification for: [idea]" or reference `@.claude/skills/create-spec.md` |
| `/create-blueprint` | "Create the blueprint" or reference `@.claude/skills/create-blueprint.md` |
| `/create-todo` | "Create the TODO checklist" or reference `@.claude/skills/create-todo.md` |
| `/start-step 1.1` | "Start step 1.1" |
| `/continue-step 1.2` | "Continue step 1.2" |

### Git Workflow

For git operations, use the same patterns as your global Cursor commands:

**Local commit:**
```
Review the changes and create a local commit with a clear message.
(Mirrors: ~/.cursor/commands/git-commit-local.md)
```

**Clean push to remote:**
```
Squash my local commits and push to remote with a clean history.
(Mirrors: ~/.cursor/commands/git-remote-push-clean-with-squash.md)
```

### Model Reminders

Claude Code will automatically remind you which model to use when starting phases:
- **Phase 1 (Specification):** ChatGPT Auto Mode
- **Phase 2 (Blueprint):** Claude Opus 4.5
- **Phase 3 (TODO):** Claude Opus 4.5
- **Phase 4 (Development):** As specified in TODO.md for each step

## Compatibility

- **Cursor** uses `.cursor/` directory → no conflicts
- **Claude Code** uses `.claude/` directory → no conflicts
- Both tools read `docs/` files (SPECIFICATION.md, BLUEPRINT.md, TODO.md)
- Global git commands remain in `~/.cursor/commands/` (Claude Code mirrors their behavior)

## Project Conventions

See `.claude/RULES.md` or `.cursor/rules/project.mdc` for:
- Stack details (Next.js, TypeScript, React, Vertex AI, GCP)
- Coding conventions
- Security practices
- Lessons learned

Both files contain the same information in different formats for tool compatibility.
