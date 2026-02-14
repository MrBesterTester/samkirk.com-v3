# Claude Code Instructions for samkirk-v3

## Dylan Davis 50+ Methodology

This project follows the **Dylan Davis 50+ method** with three core documents:
- `docs/SPECIFICATION.md` - What we're building
- `docs/BLUEPRINT.md` - How to build it (step-by-step)
- `docs/TODO.md` - Roadmap with checkboxes

## Document Sets

The project supports multiple document sets using a prefix convention:
- **Default**: `docs/SPECIFICATION.md`, `docs/BLUEPRINT.md`, `docs/TODO.md`
- **Prefixed**: `docs/{prefix}-SPECIFICATION.md`, `docs/{prefix}-BLUEPRINT.md`, `docs/{prefix}-TODO.md`
- **Current prefixed set**: _(none active — v2-upgrade completed)_

## When User Says "Continue" or "Continue with Step X.Y"

**REQUIRED**: Before implementing any step, read all three documents:
1. Read `docs/SPECIFICATION.md` for requirements context (or `docs/{prefix}-SPECIFICATION.md`)
2. Read `docs/BLUEPRINT.md` for implementation guidance (or `docs/{prefix}-BLUEPRINT.md`)
3. Read `docs/TODO.md` to find the specific step and its checklist items (or `docs/{prefix}-TODO.md`)

Then:
1. Find the step in TODO.md
2. Implement each checklist item
3. Run tests as specified
4. Check off completed items in TODO.md

## Dual Workflow: do-work + Dylan Davis

This project uses the **do-work** skill for autonomous execution, bridged from the Dylan Davis methodology.

### Planned Work (spec → blueprint → todo → queue → autonomous)
1. Create docs: `/create-spec` → `/create-blueprint` → `/create-todo`
2. Ingest into queue: `/ingest-todo` (converts TODO steps into do-work REQ files)
3. Process autonomously: `do work run` (processes the queue)
4. After completion: check off completed TODO items using `source_step` frontmatter from archived REQs

### Ad-hoc Work (direct to queue)
For bugs, ideas, or features outside any TODO cycle:
- `do work fix the header overflow`
- `do work add dark mode toggle`

### Manual Fallback (human-in-the-loop)
For steps needing visual testing, debugging, or human judgment:
- `start step X.Y` or `start step X.Y v2-upgrade`
- `continue step X.Y` or `continue step X.Y v2-upgrade`

### Git Integration
- do-work commits locally per REQ (granular history on working branch)
- Use existing squash-push workflow to clean up before pushing to remote

## Model Preferences (from TODO.md)

Remind the user which model is recommended for the current step:
- **Frontend/UI work**: Claude Opus 4.5
- **Backend/logic**: GPT-5.2 or Opus 4.5
- **Debugging/visual/E2E tests**: Gemini 3 Pro
- **Quick fixes**: Sonnet 4

## Testing Conventions

- **Unit tests**: Vitest (`npm test`)
- **E2E tests**: Playwright (`npx playwright test`)
- **Real LLM E2E**: `npm run test:e2e:real` (requires seeded resume)
- **GCP smoke tests**: `npm run smoke:gcp` (from `web/` folder)
- **Never mock both resume data AND LLM responses** - use real data
- **Always run the master test runner in the background** (`run_in_background: true`) so the user can keep working. Check results with non-blocking `TaskOutput` (`block: false`) and only block when the user explicitly asks for results.
- **E2E headed mode**: Close Chrome before running `--headed`; Playwright launches its own Chrome instance

## Key Project Rules

1. **Type safety**: Strict TypeScript, no `any`
2. **Security**: Never commit secrets; validate at API boundaries
3. **Artifacts**: Persist inputs/outputs with 90-day retention
4. **Incremental delivery**: Small PR-sized changes
5. **Avoid Gemini Pro 3 for file edits**: It may overwrite files with minimal content
6. **Always validate results**: After completing any action, verify with some form of testing (run the relevant test suite, check a command's effect, etc.) (Boris Cherny)

## Browser Automation

- **Chrome vs Chromium**: These are different browsers. Playwright uses **Chromium** (bundled with Playwright). The **Claude in Chrome extension** runs in the user's actual **Chrome** browser. Never confuse the two — Playwright cannot control Chrome, and the Chrome extension cannot control Chromium. When running E2E tests in headed mode, Playwright opens Chromium, not Chrome.
- **Playwright MCP server** (`--browser chrome`): Use for test automation, generally in headless mode
- **Claude in Chrome extension**: Use for UI debugging, visual inspection, and making code changes

## Git Workflow

- Never push working branch directly
- Use clean-main workflow with squash
- See `~/.cursor/commands/git-*.md` for patterns

## Troubleshooting

- **E2E `net::ERR_ABORTED` on `page.goto()`**: Corrupted `.next` Turbopack cache. Fix: `rm -rf web/.next` and rebuild.
- **Fit-tool URL-mode E2E flaky**: `should complete full flow via URL mode` occasionally times out waiting for LLM — retry usually passes.
