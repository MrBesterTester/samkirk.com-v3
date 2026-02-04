# Continue Step

**Purpose:** Continue to the next step in the TODO checklist

**Usage:** In Claude Code, say "continue step X.Y" where X.Y is the next step number.

## Prompt Template

```
@docs/SPECIFICATION.md @docs/BLUEPRINT.md @docs/TODO.md

Continue with Step [STEP_NUMBER]
```

**Model:** As specified in TODO.md for that specific step

## Example

"Continue step 1.2" will:
1. Read the three documents
2. Find step 1.2 in TODO.md
3. Implement the step
4. Run tests
5. Check off completed items in TODO.md
