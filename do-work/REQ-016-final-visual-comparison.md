---
id: REQ-016
title: "Final visual comparison"
status: pending
created_at: 2026-02-05T15:30:00-08:00
user_request: UR-001
source_step: "5.2"
source_doc: "docs/v2-upgrade-TODO.md"
blueprint_ref: "docs/v2-upgrade-BLUEPRINT.md"
model_hint: "Gemini 3 Pro"
batch: "v2-upgrade-phase-5"
related: [REQ-017]
---

# Final visual comparison (Step 5.2)

## What
Run v2 and v3 side-by-side and compare home page personal feel, color warmth, photo placement, location visibility, build date format, all navigation links, and mobile viewport rendering.

## Checklist
- [ ] **[Gemini 3 Pro]** Start v2 on localhost:4321
- [ ] **[Gemini 3 Pro]** Start v3 on localhost:3000
- [ ] **[Gemini 3 Pro]** Compare home page personal feel
- [ ] **[Gemini 3 Pro]** Compare color warmth
- [ ] **[Gemini 3 Pro]** Verify photo placement matches
- [ ] **[Gemini 3 Pro]** Verify location visibility
- [ ] **[Gemini 3 Pro]** Verify build date format
- [ ] **[Gemini 3 Pro]** Test all navigation links
- [ ] **[Gemini 3 Pro]** Test on mobile viewport

## Blueprint Guidance
### 5.2 Final visual comparison

- **Goal**: Compare v3 with v2 side-by-side
- **Acceptance criteria**:
  - V3 achieves similar personal/warm feel as v2
  - Professional appearance maintained
  - All functionality works
- **Test plan**:
  - Run v2 on localhost:4321
  - Run v3 on localhost:3000
  - Compare visually
- **Prompt**:

```text
Final verification:
1. Start v2: cd /Users/sam/Projects/samkirk.com-v2 && npm run dev (port 4321)
2. Start v3: cd /Users/sam/Projects/samkirk-v3/web && npm run dev (port 3000)
3. Open both in browser tabs
4. Compare:
   - Home page personal feel
   - Color warmth
   - Photo placement
   - Location visibility
   - Build date format
5. Test all navigation links
6. Test on mobile viewport
```

## Context
- **Document set**: v2-upgrade
- **Phase**: 5 — Cleanup & Verification
- **Specification**: See docs/v2-upgrade-SPECIFICATION.md for full requirements
- **Model recommendation**: Gemini 3 Pro (advisory — use if your tool supports model selection)

## Dependencies
All phases 0-4 must be complete before final comparison.

---
*Source: docs/v2-upgrade-TODO.md, Step 5.2*
