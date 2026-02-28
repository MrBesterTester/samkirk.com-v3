# OG Card Update — Handoff to Claude Code (2026-02-28)

## What Needs to Happen

Two changes to samkirk.com: (1) replace the og-card.png image, and (2) update the HTML meta tags.

### 1. Replace og-card.png

The new card design is in `og-card-draft-v3.html` (in this folder). It needs to be rendered to a 1200×630 PNG and deployed as `og-card.png` on samkirk.com.

**Design specs (v3):**
- Dark navy background (#1a2332) with cyan gradient accent bar at top
- **ALL type is white (#FFFFFF)** — name, tagline, subtitle, badges, URL. No gray, no cyan text.
- Badge borders are also white
- Headshot photo is embedded (base64) — right side, 220×260px with cyan border and rounded corners
- Layout: name + tagline + subtitle + skill badges on left, headshot on right, "samkirk.com" at bottom left

**Content on card:**
- "Sam Kirk" (64px bold)
- "genAI Consulting" (28px)
- "Software & Firmware Test Development" (22px)
- Badges: AI-Augmented Dev · Test Automation · Claude Code · Cursor AI · Embedded / Firmware
- "samkirk.com" (18px, bottom)

### 2. Update HTML Meta Tags

The `<head>` meta tags still show old content. Update these:

| Property | New Value |
|----------|-----------|
| `<title>` | Sam Kirk — genAI Consulting \| Software & Firmware Test Development |
| `og:title` | Sam Kirk — genAI Consulting \| Software & Firmware Test Development |
| `og:description` | Sam Kirk — genAI consultant. AI-augmented software and firmware test development. Claude Code, Cursor AI, and 45+ years in Silicon Valley. |
| `twitter:title` | (same as og:title) |
| `twitter:description` | (same as og:description) |
| `og:image:alt` | Sam Kirk — genAI Consulting |

### 3. After Deploying

1. Push both the updated image AND the meta tag changes
2. Force LinkedIn to re-scrape: https://www.linkedin.com/post-inspector/inspect/https%3A%2F%2Fsamkirk.com
3. Verify the preview shows the new title, description, and image
4. Test by pasting samkirk.com into an iMessage to yourself
