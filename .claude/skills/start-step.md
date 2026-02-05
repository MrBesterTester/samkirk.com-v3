# Start Step

**Purpose:** Start a new step from the TODO checklist

**Usage:**
```
start step X.Y                # uses default docs (SPECIFICATION.md, BLUEPRINT.md, TODO.md)
start step X.Y v2-upgrade     # uses v2-upgrade doc set
start step X.Y v3-upgrade     # uses v3-upgrade doc set
```

## Prompt Template

**Without prefix (default):**
```
@docs/SPECIFICATION.md @docs/BLUEPRINT.md @docs/TODO.md

Start with Step [STEP_NUMBER]
```

**With prefix:**
```
@docs/[PREFIX]-SPECIFICATION.md @docs/[PREFIX]-BLUEPRINT.md @docs/[PREFIX]-TODO.md

Start with Step [STEP_NUMBER]
```

**Model:** As specified in TODO.md for that specific step

## Example

"start step 1.1" will:
1. Read `docs/SPECIFICATION.md`, `docs/BLUEPRINT.md`, `docs/TODO.md`
2. Find step 1.1 in TODO.md
3. Implement the step
4. Run tests
5. Check off completed items in TODO.md

"start step 2.1 v2-upgrade" will:
1. Read `docs/v2-upgrade-SPECIFICATION.md`, `docs/v2-upgrade-BLUEPRINT.md`, `docs/v2-upgrade-TODO.md`
2. Find step 2.1 in v2-upgrade-TODO.md
3. Implement the step
4. Run tests
5. Check off completed items in v2-upgrade-TODO.md
