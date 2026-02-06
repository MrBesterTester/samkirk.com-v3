---
id: REQ-002
title: "Copy profile photo asset"
status: completed
claimed_at: 2026-02-05T15:51:00-08:00
route: A
completed_at: 2026-02-05T15:52:00-08:00
created_at: 2026-02-05T15:30:00-08:00
user_request: UR-001
source_step: "0.2"
source_doc: "docs/v2-upgrade-TODO.md"
blueprint_ref: "docs/v2-upgrade-BLUEPRINT.md"
model_hint: "Codex/Opus"
batch: "v2-upgrade-phase-0"
related: [REQ-001]
---

# Copy profile photo asset (Step 0.2)

## What
Migrate the profile photo from the v2 project to v3's public directory so it can be used in the hero section.

## Checklist
- [ ] **[Codex/Opus]** Copy photo from v2 to `web/public/profile-photo.jpg`
- [ ] **[Codex/Opus]** TEST: Verify image loads at `/profile-photo.jpg`

## Blueprint Guidance
### 0.2 Copy profile photo asset

- **Goal**: Migrate profile photo from v2 to v3
- **Acceptance criteria**:
  - Photo exists at `web/public/profile-photo.jpg`
  - Image loads correctly in browser
- **Test plan**: Direct URL access to `/profile-photo.jpg`
- **Prompt**:

```text
Copy the profile photo from v2 to v3:
- Source: /Users/sam/Projects/samkirk.com-v2/public/profile-photo.jpg
- Destination: /Users/sam/Projects/samkirk-v3/web/public/profile-photo.jpg

Verify the file exists and is accessible.
```

## Context
- **Document set**: v2-upgrade
- **Phase**: 0 — Foundation (Color Palette + Assets)
- **Specification**: See docs/v2-upgrade-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory — use if your tool supports model selection)

## Dependencies
Phase 0 foundation step. REQ-005 (Hero section) depends on this photo being available.

---
*Source: docs/v2-upgrade-TODO.md, Step 0.2*

---

## Triage

**Route: A** - Simple

**Reasoning:** File copy operation with explicit source and destination paths.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Simple file copy with clear paths.

*Skipped by work action*

## Implementation Summary

- Copied `/Users/sam/Projects/samkirk.com-v2/public/profile-photo.jpg` to `web/public/profile-photo.jpg`
- Verified: JPEG 480x640, 62KB

*Completed by work action (Route A)*

## Testing

**Tests run:** `file` and `ls` verification
**Result:** ✓ File exists, correct format (JPEG 480x640)

*Verified by work action*
