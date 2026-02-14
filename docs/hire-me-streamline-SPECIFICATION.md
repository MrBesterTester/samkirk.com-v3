# Hire Me Streamline — Specification

## Problem

Despite the recent unification of `/hire-me` into a single chat-first page, the home page and header navigation still present three separate entry points (How Do I Fit?, Custom Resume, Interview Me NOW) as if they are distinct products. This creates a fragmented, modal experience that contradicts the already-unified backend. The hiring manager sees three choices when there should be one.

## Current State

| Surface | What it shows | Problem |
|---------|---------------|---------|
| Home page "Hiring Manager?" section | 3 `ToolPreview` cards linking to `/hire-me/fit`, `/hire-me/resume`, `/hire-me/interview` | Suggests three separate tools when they're really one unified chat page |
| Header "Hire Me" dropdown | 3 sub-links (How Do I Fit?, Custom Resume, Interview Me) | Implies subpages that don't actually exist (they all redirect to `/hire-me`) |
| Routes `/hire-me/fit`, `/hire-me/resume`, `/hire-me/interview` | Redirect stubs to `/hire-me` | Dead weight — unnecessary route files |

## Goal

Collapse all Hire Me entry points into a single link everywhere. The hiring manager clicks one link and lands on the unified `/hire-me` page, which already handles everything.

## Requirements

### R1 — Home Page: Single Hire Me Link

Replace the three `ToolPreview` cards under "Hiring Manager?" with a single, prominent call-to-action that links to `/hire-me`.

- The section heading "Hiring Manager?" remains
- The subtitle text remains (or is updated to reflect the unified tool)
- One link/button replaces the three-card grid
- The three individual tool descriptions (How Do I Fit?, Custom Resume, Interview Me NOW) no longer appear as separate clickable sections on the home page

### R2 — Header Navigation: No Dropdown

The "Hire Me" nav item in the header should be a direct link to `/hire-me` with no dropdown/children.

- Desktop: simple nav link, no hover dropdown
- Mobile: simple nav link, no nested sub-items

### R3 — Remove Redirect Stubs

Delete the three redirect-only route files:
- `web/src/app/hire-me/fit/page.tsx`
- `web/src/app/hire-me/resume/page.tsx`
- `web/src/app/hire-me/interview/page.tsx`

Old bookmarks to these URLs will 404, which is acceptable since they were only recently introduced and have negligible external link equity.

### R4 — No Backend Changes

The unified `/hire-me` page, its API endpoints, the `useHireMe` hook, and all chat/card components remain unchanged. This is purely a navigation and home page UI change.

### R5 — Preserve Existing Content Tone

The home page should still communicate to a hiring manager that AI-powered evaluation tools are available. The single entry point should hint at what's behind it (fit analysis, custom resume, live interview chat) without presenting them as separate destinations.

## Non-Goals

- Changing the `/hire-me` page layout or functionality
- Modifying API endpoints or the `useHireMe` hook
- Adding new features to the chat interface
- Changing the ToolPreview component itself (it may still be used elsewhere)

## Verification

1. Home page shows one Hire Me link under "Hiring Manager?" — not three cards
2. Clicking the link navigates to `/hire-me`
3. Header "Hire Me" has no dropdown — direct link only
4. `/hire-me/fit`, `/hire-me/resume`, `/hire-me/interview` return 404
5. `/hire-me` page works exactly as before (job input, chat, fit, resume, interview)
6. `npm test` and `npx playwright test` pass
