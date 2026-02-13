---
id: REQ-054
title: "Register npm script"
status: pending
created_at: 2026-02-13T18:00:00Z
user_request: UR-007
related: [REQ-043]
batch: "test-results-phase-4"
source_step: "4.1"
source_doc: "docs/test-results-TODO.md"
blueprint_ref: "docs/test-results-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Register npm script (Step 4.1)

## What
Add `test:results` script to `web/package.json` so the viewer can be invoked via `npm run test:results`.

## Checklist
- [ ] Add `"test:results": "npx tsx scripts/test-results.ts"` before `test:all`

## Blueprint Guidance

### 3. Modify: `web/package.json` (+1 line)

Add at line 17 (before `test:all`):
```json
"test:results": "npx tsx scripts/test-results.ts",
```

## Context
- **Document set**: test-results
- **Phase**: 4 — Registration and Documentation
- **Blueprint**: See docs/test-results-BLUEPRINT.md for full design
- **Model recommendation**: Sonnet 4 (advisory — use if your tool supports model selection)

## Dependencies
Depends on REQ-043 (the script must exist before registering it).

---
*Source: docs/test-results-TODO.md, Step 4.1*
