# Claude Code Instructions for samkirk-v3

## Dylan Davis 50+ Methodology

This project follows the **Dylan Davis 50+ method** with three core documents:
- `docs/SPECIFICATION.md` - What we're building
- `docs/BLUEPRINT.md` - How to build it (step-by-step)
- `docs/TODO.md` - Roadmap with checkboxes

## When User Says "Continue" or "Continue with Step X.Y"

**REQUIRED**: Before implementing any step, read all three documents:
1. Read `docs/SPECIFICATION.md` for requirements context
2. Read `docs/BLUEPRINT.md` for implementation guidance
3. Read `docs/TODO.md` to find the specific step and its checklist items

Then:
1. Find the step in TODO.md
2. Implement each checklist item
3. Run tests as specified
4. Check off completed items in TODO.md

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

## Key Project Rules

1. **Type safety**: Strict TypeScript, no `any`
2. **Security**: Never commit secrets; validate at API boundaries
3. **Artifacts**: Persist inputs/outputs with 90-day retention
4. **Incremental delivery**: Small PR-sized changes
5. **Avoid Gemini Pro 3 for file edits**: It may overwrite files with minimal content

## Git Workflow

- Never push working branch directly
- Use clean-main workflow with squash
- See `~/.cursor/commands/git-*.md` for patterns
