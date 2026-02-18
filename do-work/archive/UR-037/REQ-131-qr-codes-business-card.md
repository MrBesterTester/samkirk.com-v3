---
id: REQ-131
title: "Create QR code images for business cards"
status: completed
created_at: 2026-02-18T13:00:00-08:00
user_request: UR-037
claimed_at: 2026-02-18T13:00:00-08:00
route: A
completed_at: 2026-02-18T13:10:00-08:00
---

# Create QR Code Images for Business Cards

## What
Generate print-ready QR code PNG images for two URLs (https://samkirk.com and https://samkirk.com/dance-menu) suitable for importing into a business card layout tool.

## Context
- User is designing business cards and needs scannable QR codes
- Images need to be high enough resolution for 300 DPI print at 1"+ size
- Standard black-on-white with adequate quiet zone for reliable scanning

---

## Triage

**Route: A** - Simple

**Reasoning:** Standalone task — generate two image files using a Python library. No codebase changes needed.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Generate two QR code PNGs using the `qrcode` Python library. No architectural decisions.

*Skipped by work action*

## Implementation Summary

- Researched QR code business card best practices (size, resolution, quiet zone, error correction)
- Installed `qrcode[pil]` Python package
- Generated two QR code PNGs:
  - `qr-samkirk.png` (660x660px) → https://samkirk.com
  - `qr-samkirk-dance-menu.png` (740x740px) → https://samkirk.com/dance-menu
- Settings: 20px box size, 4-module quiet zone, Medium error correction (15%), black on white
- Both files placed in project root (`/Users/sam/Projects/samkirk-v3/`)

*Completed by work action (Route A)*

## Testing

**Tests run:** Visual verification of both QR code images
**Result:** Both render as clean, scannable QR codes with proper quiet zones

*Verified by work action*
