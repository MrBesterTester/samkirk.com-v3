# Start Step

**Purpose:** Start a new step from the TODO checklist

**Usage:** In Claude Code, say "start step X.Y" where X.Y is the step number.

## Prompt Template

```
@docs/SPECIFICATION.md @docs/BLUEPRINT.md @docs/TODO.md

Start with Step [STEP_NUMBER]
```

**Model:** As specified in TODO.md for that specific step

## Example

"Start step 1.1" will:
1. Read the three documents
2. Find step 1.1 in TODO.md
3. Implement the step
4. Run tests
5. Check off completed items in TODO.md
