# Claude Code Setup for samkirk-v3

**Date:** February 4, 2026
**Purpose:** Document the Claude Code integration for the Dylan Davis 50+ methodology

This project is now configured to work with both **Cursor IDE** and **Claude Code**, maintaining full backward compatibility while enabling seamless workflow across both tools.

---

## Table of Contents

- [What Was Created](#-what-was-created)
  - [Claude Code Configuration](#claude-code-configuration)
  - [Skills Created](#skills-created)
  - [Memory Updated](#memory-updated)
  - [Documentation Updated](#documentation-updated)
  - [Plugin Optimization (Context Window Fix)](#plugin-optimization-context-window-fix)
- [Tool Compatibility](#-tool-compatibility)
  - [File Organization](#file-organization)
- [Usage Examples](#-usage-examples)
  - [Cursor IDE (Slash Commands)](#cursor-ide-slash-commands)
  - [Claude Code (Natural Language)](#claude-code-natural-language)
- [Global Git Commands](#-global-git-commands)
- [File Reference Syntax](#-file-reference-syntax)
- [Key Differences Between Tools](#-key-differences-between-tools)
- [Workflow Integration](#-workflow-integration)
  - [Starting Fresh on a Step](#starting-fresh-on-a-step)
  - [Switching Between Tools](#switching-between-tools)
- [Model Selection](#-model-selection)
- [Development Conventions](#-development-conventions)
  - [Stack](#stack)
  - [Key Conventions](#key-conventions)
  - [Model Preferences](#model-preferences-from-todomd)
  - [Lessons Learned](#lessons-learned)
- [Quick Reference Files](#-quick-reference-files)
- [Setup Verification](#-setup-verification)
- [Next Steps](#-next-steps)
- [Summary](#-summary)

---

## ✅ What Was Created

### Claude Code Configuration

**`.claude/` Directory Structure:**
```
.claude/
├── README.md                    # Overview of Claude Code integration
├── RULES.md                     # Project rules (mirrors .cursor/rules/)
├── QUICKSTART.md                # Quick reference guide
├── CURSOR-COMPATIBILITY.md      # Command mapping between tools
└── skills/                      # Workflow skills (mirrors .cursor/commands/)
    ├── create-spec.md          # Specification interview
    ├── create-blueprint.md     # Blueprint generation
    ├── create-todo.md          # TODO checklist generation
    ├── start-step.md           # Start development step
    └── continue-step.md        # Continue to next step
```

### Skills Created

Each skill file contains the prompt template and usage instructions for the corresponding workflow phase:

| Skill | Purpose | Model Recommendation |
|-------|---------|---------------------|
| `create-spec.md` | Start specification interview (one question at a time) | ChatGPT Auto Mode |
| `create-blueprint.md` | Generate step-by-step blueprint from spec | Claude Opus 4.5 |
| `create-todo.md` | Generate TODO checklist from blueprint | Claude Opus 4.5 |
| `start-step.md` | Start a new development step | Per TODO.md task label |
| `continue-step.md` | Continue to next development step | Per TODO.md task label |

### Memory Updated

**Auto Memory Location:**
- `~/.claude/projects/-Users-sam-Projects-samkirk-v3/memory/MEMORY.md`

**Contains:**
- Development methodology overview
- Dual tool setup (Cursor + Claude Code)
- Stack information (Next.js, TypeScript, Vertex AI, GCP)
- Key conventions (type safety, security, testing)
- Model preferences
- Lessons learned
- Git workflow patterns
- Current development phase tracking

### Documentation Updated

**`README.md`:**
- Added "Development Methodology" section
- Linked to Dylan Davis 50+ method docs
- Explained tool support for both Cursor and Claude Code
- Referenced compatibility guide

### Plugin Optimization (Context Window Fix)

**Problem:** Fresh conversations were starting at 90% context usage due to the `claude-plugins-official` marketplace loading ~30,000 lines of plugin documentation into the system prompt.

**Solution:** Created a lean local marketplace (`sam-plugins`) with only the plugins actually needed.

**Location:** `~/.claude/plugins/marketplaces/sam-plugins/`

**Installed Plugins:**

| Plugin | Lines | Purpose |
|--------|-------|---------|
| `commit-commands` | 315 | `/commit`, `/commit-push-pr`, `/clean_gone` |
| `feature-dev` | 668 | Feature development workflow with code-reviewer, code-explorer, code-architect agents |
| `hookify` | 1,574 | Hook creation and management |
| `agent-sdk-dev` | 669 | Agent SDK development tools |
| `claude-code-setup` | 1,492 | Setup automation and recommendations |
| `claude-md-management` | 785 | CLAUDE.md file management |
| `example-plugin` | 183 | Template for creating new plugins |

**Results:**
- **Before:** 29,713 lines (`claude-plugins-official`)
- **After:** 5,686 lines (`sam-plugins`)
- **Reduction:** 81% smaller context footprint

**The Culprit:** `plugin-dev` alone was 20,752 lines (78% of the selected plugins). Unless you're actively developing Claude Code plugins, you don't need it. The irony: a plugin for making plugins was consuming more context than all other plugins combined.

**Maintenance Notes:**
- These plugins won't auto-update from Anthropic's repo
- To add a plugin later: copy it from a fresh clone of `anthropics/claude-plugins-official`
- Config lives in `~/.claude/plugins/known_marketplaces.json`
- Run `/plugin` to verify plugins are recognized after changes

---

## 🔄 Tool Compatibility

Both tools coexist perfectly with no conflicts:

| Tool | Configuration Directory | Status |
|------|------------------------|--------|
| **Cursor** | `.cursor/` | Untouched - all existing commands/rules preserved |
| **Claude Code** | `.claude/` | New - skills and rules created |
| **Shared** | `docs/` | Both tools use SPECIFICATION.md, BLUEPRINT.md, TODO.md |

### File Organization

```
samkirk-v3/
├── .cursor/              # Cursor IDE configuration
│   ├── commands/         # Slash commands (/create-spec, /start-step)
│   └── rules/            # Project rules (project.mdc, workflow-setup.mdc)
│
├── .claude/              # Claude Code configuration
│   ├── skills/           # Workflow skills (natural language)
│   ├── RULES.md          # Project rules
│   ├── QUICKSTART.md     # Quick reference
│   └── CURSOR-COMPATIBILITY.md  # Command mapping
│
└── docs/                 # Shared methodology documents
    ├── Dylan-Davis-50plus-method.md
    ├── SPECIFICATION.md
    ├── BLUEPRINT.md
    └── TODO.md
```

---

## 📖 Usage Examples

### Cursor IDE (Slash Commands)

Cursor uses precise slash commands defined in `.cursor/commands/`:

```
/create-spec [your idea]
/create-blueprint
/create-todo
/start-step 1.1
/continue-step 1.2
/git-commit-local
```

### Claude Code (Natural Language)

Claude Code uses natural language with file references:

**Specification Phase:**
```
Create a specification using the Dylan Davis method.
Reference @.claude/skills/create-spec.md

Here's the idea: [your idea]
```

**Blueprint Phase:**
```
Create the blueprint from the specification.
Reference @.claude/skills/create-blueprint.md @docs/SPECIFICATION.md
```

**TODO Phase:**
```
Create the TODO checklist from the blueprint.
Reference @.claude/skills/create-todo.md @docs/BLUEPRINT.md
```

**Development Steps:**
```
Start step 1.1
```
```
Continue step 2.3
```

**Git Workflow (Local Commit):**
```
Review the changes and create a local commit with a clear message.
Exclude .env, credentials, and other secrets.
```

**Git Workflow (Push to Remote):**
```
Run gitleaks detect --source . to scan for secrets, then push to main.
CI runs gitleaks + CodeQL as a second gate on every push.
```

---

## 🎯 Git Workflow

Push directly to `main` after gitleaks scan passes — no squash, no intermediate branches. CI runs gitleaks + CodeQL on every push as a second gate. For one-time history scrubs (e.g., removing a leaked secret retroactively), use `git-filter-repo`.

**Claude Code Behavior:** Mirrors the same git workflow through natural language instructions.

---

## 📚 File Reference Syntax

Both tools support `@` syntax for file references:

**Common References:**
- `@docs/SPECIFICATION.md` - Functional specification
- `@docs/BLUEPRINT.md` - Implementation blueprint
- `@docs/TODO.md` - Development checklist
- `@docs/Dylan-Davis-50plus-method.md` - Complete methodology

**Tool-Specific References:**

**Cursor:**
```
@.cursor/commands/start-step.md
@.cursor/rules/project.mdc
```

**Claude Code:**
```
@.claude/skills/start-step.md
@.claude/RULES.md
```

---

## 🔑 Key Differences Between Tools

| Aspect | Cursor | Claude Code |
|--------|--------|-------------|
| **Commands** | Slash commands (`/start-step`) | Natural language ("start step") |
| **Skills/Commands** | `.cursor/commands/*.md` | `.claude/skills/*.md` |
| **Rules** | `.cursor/rules/*.mdc` | `.claude/RULES.md` + memory |
| **Memory** | Session-based | Persistent in `~/.claude/projects/.../memory/` |
| **Model switching** | Manual in UI | Manual, with reminders from assistant |
| **File loading** | `@` syntax, auto-loads rules | `@` syntax, references + persistent memory |
| **Git workflow** | Global commands in `~/.cursor/commands/` | Natural language mirroring Cursor patterns |

---

## ✨ Workflow Integration

### Starting Fresh on a Step

**In Cursor:**
1. Clear all chats (avoid context overflow)
2. Type `/start-step 1.1`
3. AI reads SPEC, BLUEPRINT, TODO
4. AI implements step 1.1
5. AI checks off completed items in TODO.md

**In Claude Code:**
1. Start new conversation (optional, but recommended for large steps)
2. Say "Start step 1.1"
3. Assistant reads SPEC, BLUEPRINT, TODO
4. Assistant implements step 1.1
5. Assistant checks off completed items in TODO.md

### Switching Between Tools

You can freely switch between Cursor and Claude Code at any time:

1. **Commit your work** before switching:
   - Cursor: `/git-commit-local`
   - Claude Code: "Review changes and create a local commit"

2. **Check TODO.md** to see what's completed

3. **Reference the three docs** when starting fresh in either tool

4. **Continue from where you left off**:
   - Both tools read the same TODO.md checkboxes
   - Both follow the same project conventions

---

## 📋 Model Selection

The Dylan Davis methodology recommends specific models for each phase:

| Phase | Recommended Model | Rationale |
|-------|-------------------|-----------|
| **Specification** | ChatGPT Auto Mode | Conversational, good at iterative Q&A |
| **Blueprint** | Claude Opus 4.5 | Long output window, detailed planning |
| **TODO** | Claude Opus 4.5 | Same session as blueprint |
| **Development** | Per task in TODO.md | Frontend → Opus, Backend → GPT-5.2, Debug → Gemini 3 Pro, Fixes → Sonnet 4 |

**In Claude Code:**
- The assistant will remind you which model is recommended when starting each phase
- You're currently using Claude Sonnet 4.5, which is suitable for most development tasks

**In Cursor:**
- Switch models manually in the UI based on the phase
- Phase reminders are provided via `.cursor/rules/phase-model-reminder.mdc`

---

## 🛠️ Development Conventions

Both tools follow the same project conventions (see `.cursor/rules/project.mdc` or `.claude/RULES.md`):

### Stack
- Next.js (App Router) + React + TypeScript (strict mode)
- Vertex AI (Google Gemini for LLM)
- GCP Cloud Run (hosting)
- Firestore (metadata, counters)
- Cloud Storage (artifacts)

### Key Conventions
1. **Type safety**: Strict TypeScript, no `any`
2. **Security**: Never commit secrets; validate untrusted inputs at API boundaries
3. **Testing**: Use real data and real API calls, not mocks
4. **Artifacts**: Persist inputs/outputs with 90-day retention
5. **Incremental delivery**: Small PR-sized changes

### Model Preferences (from TODO.md)
- Frontend/UI: Claude Opus 4.5
- Backend/logic: GPT-5.2 or Opus 4.5
- Debugging/visual: Gemini 3 Pro
- Quick fixes: Sonnet 4

### Lessons Learned
- **Avoid Gemini Pro 3 for file edits**: May overwrite large files with minimal content. Use only for image processing.
- **E2E tests must use real data**: Never mock both resume data AND LLM responses.
- **Never fabricate test fixtures**: Always capture fixtures from actual test runs.
- **Playwright + CI env var**: If `CI=1` is set, it disables `reuseExistingServer`.

---

## 📖 Quick Reference Files

For detailed usage information:

| File | Purpose |
|------|---------|
| **`.claude/QUICKSTART.md`** | Quick reference for common Claude Code commands |
| **`.claude/CURSOR-COMPATIBILITY.md`** | Detailed command mapping between Cursor and Claude Code |
| **`.claude/README.md`** | Overview of Claude Code integration |
| **`.claude/RULES.md`** | Project rules and conventions for Claude Code |
| **`docs/Dylan-Davis-50plus-method.md`** | Complete methodology guide |

---

## ✅ Setup Verification

To verify the setup is complete:

1. **Check `.claude/` directory exists:**
   ```bash
   ls -la .claude/
   ```
   Should show: README.md, RULES.md, QUICKSTART.md, CURSOR-COMPATIBILITY.md, skills/

2. **Check skills exist:**
   ```bash
   ls -la .claude/skills/
   ```
   Should show: create-spec.md, create-blueprint.md, create-todo.md, start-step.md, continue-step.md

3. **Check memory updated:**
   ```bash
   cat ~/.claude/projects/-Users-sam-Projects-samkirk-v3/memory/MEMORY.md
   ```
   Should contain project conventions and lessons learned

4. **Check README updated:**
   ```bash
   grep "Development Methodology" README.md
   ```
   Should return the new section

---

## 🎯 Next Steps

You can now use either tool seamlessly:

### With Claude Code:
1. Say "Start step X.Y" to begin implementing a step from TODO.md
2. Say "Continue step X.Y" to move to the next step
3. Reference `@.claude/QUICKSTART.md` for common commands

### With Cursor:
1. Use `/start-step X.Y` or `/continue-step X.Y` as before
2. All existing commands and rules remain unchanged

### Switching Between Tools:
1. Commit with one tool
2. Switch to the other tool
3. Continue from the same TODO.md checklist
4. Both tools maintain the same project state

---

## 📝 Summary

- ✅ **Claude Code fully integrated** with project
- ✅ **Backward compatible** with all Cursor commands
- ✅ **No conflicts** between tool configurations
- ✅ **Shared methodology** documents (SPEC, BLUEPRINT, TODO)
- ✅ **Consistent workflows** across both tools
- ✅ **Memory persists** across Claude Code sessions
- ✅ **Documentation complete** with quick reference guides

Both tools now support the Dylan Davis 50+ methodology, allowing you to work with whichever tool best suits your current task or preference.
