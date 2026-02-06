# Quick Reference: How to use do-work with `master-test-TODO.md`

**1. Ingest the TODO into the do-work queue:**
```
/ingest-todo docs/master-test-TODO.md
```
This parses each step into REQ files with frontmatter (`source_step`, `source_doc: docs/master-test-TODO.md`, `blueprint_ref`, `model_hint`, `batch`). The `master-test` prefix is extracted automatically and used to resolve the companion SPECIFICATION and BLUEPRINT.

**2. Verify the REQs captured intent correctly:**
```
do work verify
```

**3. Process the queue (in a separate terminal):**
```
do work run
```

**4. Sync completed checkboxes back:**
```
/sync-todo docs/master-test-TODO.md
```
This reads archived REQs' `source_step` frontmatter and checks off the corresponding items.

**Manual fallback** (for steps needing human judgment):
```
start step 1.1 master-test       # begins with full doc context
continue step 1.1 master-test    # resumes where you left off
```
These read all three companion docs (`master-test-SPECIFICATION.md`, `master-test-BLUEPRINT.md`, `master-test-TODO.md`) automatically.

**Ad-hoc work** (outside the TODO cycle):
```
do work fix the directory traversal test in route.test.ts to not require GCP
```
