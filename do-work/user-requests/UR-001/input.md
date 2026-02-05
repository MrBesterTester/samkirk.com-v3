---
id: UR-001
title: "Ingest: v2-upgrade TODO (17 steps)"
created_at: 2026-02-05T15:30:00-08:00
requests: [REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017]
word_count: 1456
---

# Ingest: v2-upgrade TODO

## Summary
Ingested 17 unchecked steps from docs/v2-upgrade-TODO.md into do-work REQ files.
Document set: v2-upgrade-SPECIFICATION.md, v2-upgrade-BLUEPRINT.md, v2-upgrade-TODO.md.

## Extracted Requests

| ID | Step | Title | Model Hint |
|----|------|-------|------------|
| REQ-001 | 0.1 | Define new color palette | Opus 4.5 |
| REQ-002 | 0.2 | Copy profile photo asset | Codex/Opus |
| REQ-003 | 1.1 | Update Header with location | Opus 4.5 |
| REQ-004 | 1.2 | Update Footer with build date | Opus 4.5 |
| REQ-005 | 2.1 | Create Hero section with photo | Opus 4.5 |
| REQ-006 | 2.2 | Create Tool Preview component | Opus 4.5 |
| REQ-007 | 2.3 | Add Hiring Manager tools section | Opus 4.5 |
| REQ-008 | 2.4 | Add Dance Menu preview | Opus 4.5 |
| REQ-009 | 2.5 | Add Photo Fun link section | Opus 4.5 |
| REQ-010 | 2.6 | Add Song Dedication full embed | Opus 4.5 |
| REQ-011 | 3.1 | Create Photo Fun link page | Opus 4.5 |
| REQ-012 | 3.2 | Create Tensor Logic link page | Opus 4.5 |
| REQ-013 | 3.3 | Add descriptions to Exploration pages | Opus 4.5 |
| REQ-014 | 4.1 | Apply new color palette globally | Opus 4.5 |
| REQ-015 | 4.2 | Mobile responsiveness audit | Gemini 3 Pro |
| REQ-016 | 5.2 | Final visual comparison | Gemini 3 Pro |
| REQ-017 | 5.3 | Run existing tests | Codex/Opus |

## Skipped Steps

| Step | Reason |
|------|--------|
| 5.1 | Already completed (all items checked) |

## Full Verbatim Input

# samkirk.com v3 Visual Upgrade — TODO

> Generated from `docs/v2-upgrade-BLUEPRINT.md` per the Dylan Davis methodology.
>
> **Model labels** follow the heuristics:
> - **[Opus 4.5]** — UI/Frontend components, layout, styling, color palette
> - **[Codex/Opus]** — Backend logic, configuration, file operations
> - **[Gemini 3 Pro]** — Visual testing, E2E tests, mobile responsiveness
> - **[Sonnet 4]** — Quick fixes, minor tweaks

---

## Phase 0 — Foundation (Color Palette + Assets)

### 0.1 Define new color palette

- [ ] **[Opus 4.5]** Design balanced color palette (v2 warmth + v3 clean)
- [ ] **[Opus 4.5]** Define color tokens in `tailwind.config.ts`
- [ ] **[Opus 4.5]** Document color usage guidelines
- [ ] **[Opus 4.5]** Ensure dark mode compatibility
- [ ] **[Gemini 3 Pro]** TEST: Visual inspection of color swatches

### 0.2 Copy profile photo asset

- [ ] **[Codex/Opus]** Copy photo from v2 to `web/public/profile-photo.jpg`
- [ ] **[Codex/Opus]** TEST: Verify image loads at `/profile-photo.jpg`

---

## Phase 1 — Header & Footer Updates

### 1.1 Update Header with location

- [ ] **[Opus 4.5]** Add "Fremont, California" after "Sam Kirk" in header
- [ ] **[Opus 4.5]** Hide/abbreviate location on mobile for space
- [ ] **[Gemini 3 Pro]** TEST: Visual check on desktop and mobile viewports

### 1.2 Update Footer with build date

- [ ] **[Opus 4.5]** Add `"use client"` directive to Footer component
- [ ] **[Opus 4.5]** Implement build date generation (v2 format, PST timezone)
- [ ] **[Opus 4.5]** Style build date: `text-xs font-mono`
- [ ] **[Gemini 3 Pro]** TEST: Verify footer shows correct PST time

---

## Phase 2 — Home Page Redesign

### 2.1 Create Hero section with photo

- [ ] **[Opus 4.5]** Redesign hero with profile photo positioning
- [ ] **[Opus 4.5]** Photo: upper-left on desktop (absolute positioned)
- [ ] **[Opus 4.5]** Photo: centered above text on mobile
- [ ] **[Opus 4.5]** Add name, location, and tagline text
- [ ] **[Gemini 3 Pro]** TEST: Compare with v2, test responsive behavior

### 2.2 Create Tool Preview component

- [ ] **[Opus 4.5]** Create `web/src/components/ToolPreview.tsx`
- [ ] **[Opus 4.5]** Props: title, description, previewContent, ctaText, ctaLink
- [ ] **[Opus 4.5]** Style with card, hover effects, consistent colors
- [ ] **[Codex/Opus]** Export from `web/src/components/index.ts`
- [ ] **[Codex/Opus]** TEST: Component renders correctly

### 2.3 Add Hiring Manager tools section

- [ ] **[Opus 4.5]** Add "Hiring Manager?" section heading
- [ ] **[Opus 4.5]** Create "How Do I Fit?" preview card with CTA
- [ ] **[Opus 4.5]** Create "Custom Resume" preview card with CTA
- [ ] **[Opus 4.5]** Create "Interview Me Now" preview with sample Q&A
- [ ] **[Opus 4.5]** Layout: grid on desktop, stack on mobile
- [ ] **[Gemini 3 Pro]** TEST: Click CTAs, verify navigation works

### 2.4 Add Dance Menu preview

- [ ] **[Opus 4.5]** Add Dance Menu section heading
- [ ] **[Opus 4.5]** Create preview/teaser content
- [ ] **[Opus 4.5]** Add CTA linking to `/dance-menu`
- [ ] **[Gemini 3 Pro]** TEST: Visual inspection, CTA navigation

### 2.5 Add Photo Fun link section

- [ ] **[Opus 4.5]** Add Photo Fun section with heading
- [ ] **[Opus 4.5]** Write description of AI photo editing features
- [ ] **[Opus 4.5]** Add external link to photo-fun.samkirk.com (new tab)
- [ ] **[Gemini 3 Pro]** TEST: Click link, verify external site opens

### 2.6 Add Song Dedication full embed

- [ ] **[Opus 4.5]** Embed complete song dedication content
- [ ] **[Opus 4.5]** Include lyrics display
- [ ] **[Opus 4.5]** Include audio player/link
- [ ] **[Opus 4.5]** Style to fit single-scroll aesthetic
- [ ] **[Gemini 3 Pro]** TEST: Visual inspection, audio playback

---

## Phase 3 — New Pages

### 3.1 Create Photo Fun link page

- [ ] **[Opus 4.5]** Create `web/src/app/photo-fun/page.tsx`
- [ ] **[Opus 4.5]** Add title, description, features list
- [ ] **[Opus 4.5]** Add prominent CTA button to external site
- [ ] **[Codex/Opus]** Add to Header navigation
- [ ] **[Gemini 3 Pro]** TEST: Navigation, link functionality

### 3.2 Create Tensor Logic link page

- [ ] **[Opus 4.5]** Create `web/src/app/explorations/tensor-logic/page.tsx`
- [ ] **[Opus 4.5]** Add title, description of educational demo
- [ ] **[Opus 4.5]** List features (8 examples, 5 AI paradigms)
- [ ] **[Opus 4.5]** Add link to tensor-logic.samkirk.com
- [ ] **[Opus 4.5]** Add reference to arXiv paper
- [ ] **[Codex/Opus]** Update Explorations hub to include Tensor Logic
- [ ] **[Codex/Opus]** Update Header navigation dropdown
- [ ] **[Gemini 3 Pro]** TEST: Navigation from Explorations hub

### 3.3 Add descriptions to Exploration pages

- [ ] **[Opus 4.5]** Add description to Category Theory page
- [ ] **[Opus 4.5]** Add description to Pocket Flow page
- [ ] **[Opus 4.5]** Add description to Dance Instruction page
- [ ] **[Opus 4.5]** Add description to Uber Level AI Skills page
- [ ] **[Gemini 3 Pro]** TEST: Visual inspection of each exploration page

---

## Phase 4 — Styling Polish

### 4.1 Apply new color palette globally

- [ ] **[Opus 4.5]** Update Header colors
- [ ] **[Opus 4.5]** Update Footer colors
- [ ] **[Opus 4.5]** Update card/surface colors
- [ ] **[Opus 4.5]** Update CTA/button colors
- [ ] **[Opus 4.5]** Update text colors (primary, secondary, muted)
- [ ] **[Gemini 3 Pro]** TEST: Visual inspection of all pages
- [ ] **[Gemini 3 Pro]** TEST: Dark mode verification

### 4.2 Mobile responsiveness audit

- [ ] **[Gemini 3 Pro]** Test all pages at 375px width (iPhone SE)
- [ ] **[Gemini 3 Pro]** Test all pages at 390px width (iPhone 14)
- [ ] **[Gemini 3 Pro]** Verify no horizontal scrolling
- [ ] **[Gemini 3 Pro]** Verify all content readable
- [ ] **[Gemini 3 Pro]** Verify touch targets at least 44px
- [ ] **[Opus 4.5]** Fix any responsiveness issues found

---

## Phase 5 — Cleanup & Verification

### 5.1 Delete incorrect plan file

- [x] **[Codex/Opus]** Delete `docs/PLAN-v2-features.md` — DONE (deleted during spec creation)

### 5.2 Final visual comparison

- [ ] **[Gemini 3 Pro]** Start v2 on localhost:4321
- [ ] **[Gemini 3 Pro]** Start v3 on localhost:3000
- [ ] **[Gemini 3 Pro]** Compare home page personal feel
- [ ] **[Gemini 3 Pro]** Compare color warmth
- [ ] **[Gemini 3 Pro]** Verify photo placement matches
- [ ] **[Gemini 3 Pro]** Verify location visibility
- [ ] **[Gemini 3 Pro]** Verify build date format
- [ ] **[Gemini 3 Pro]** Test all navigation links
- [ ] **[Gemini 3 Pro]** Test on mobile viewport

### 5.3 Run existing tests

- [ ] **[Codex/Opus]** Run `npm test` — all unit tests pass
- [ ] **[Gemini 3 Pro]** Run `npm run test:e2e:real` — all E2E tests pass
- [ ] **[Codex/Opus]** Fix any failing tests

---

*Captured: 2026-02-05T15:30:00-08:00*
