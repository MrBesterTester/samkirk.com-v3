# Continue Step

**Purpose:** Continue to the next step in the TODO checklist

**Usage:**
```
continue step X.Y                # uses default docs (SPECIFICATION.md, BLUEPRINT.md, TODO.md)
continue step X.Y v2-upgrade     # uses v2-upgrade doc set
continue step X.Y v3-upgrade     # uses v3-upgrade doc set
```

## Prompt Template

**Without prefix (default):**
```
@docs/SPECIFICATION.md @docs/BLUEPRINT.md @docs/TODO.md

Continue with Step [STEP_NUMBER]
```

**With prefix:**
```
@docs/[PREFIX]-SPECIFICATION.md @docs/[PREFIX]-BLUEPRINT.md @docs/[PREFIX]-TODO.md

Continue with Step [STEP_NUMBER]
```

**Model:** As specified in TODO.md for that specific step

## Example

"continue step 1.2" will:
1. Read `docs/SPECIFICATION.md`, `docs/BLUEPRINT.md`, `docs/TODO.md`
2. Find step 1.2 in TODO.md
3. Implement the step
4. Run tests
5. Check off completed items in TODO.md

"continue step 2.2 v2-upgrade" will:
1. Read `docs/v2-upgrade-SPECIFICATION.md`, `docs/v2-upgrade-BLUEPRINT.md`, `docs/v2-upgrade-TODO.md`
2. Find step 2.2 in v2-upgrade-TODO.md
3. Implement the step
4. Run tests
5. Check off completed items in v2-upgrade-TODO.md
