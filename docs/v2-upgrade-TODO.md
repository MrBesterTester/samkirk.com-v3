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

- [x] **[Opus 4.5]** Design balanced color palette (v2 warmth + v3 clean)
- [x] **[Opus 4.5]** Define color tokens in `tailwind.config.ts`
- [x] **[Opus 4.5]** Document color usage guidelines
- [x] **[Opus 4.5]** Ensure dark mode compatibility
- [x] **[Gemini 3 Pro]** TEST: Visual inspection of color swatches

### 0.2 Copy profile photo asset

- [x] **[Codex/Opus]** Copy photo from v2 to `web/public/profile-photo.jpg`
- [x] **[Codex/Opus]** TEST: Verify image loads at `/profile-photo.jpg`

---

## Phase 1 — Header & Footer Updates

### 1.1 Update Header with location

- [x] **[Opus 4.5]** Add "Fremont, California" after "Sam Kirk" in header
- [x] **[Opus 4.5]** Hide/abbreviate location on mobile for space
- [x] **[Gemini 3 Pro]** TEST: Visual check on desktop and mobile viewports

### 1.2 Update Footer with build date

- [x] **[Opus 4.5]** Add `"use client"` directive to Footer component
- [x] **[Opus 4.5]** Implement build date generation (v2 format, PST timezone)
- [x] **[Opus 4.5]** Style build date: `text-xs font-mono`
- [x] **[Gemini 3 Pro]** TEST: Verify footer shows correct PST time

---

## Phase 2 — Home Page Redesign

### 2.1 Create Hero section with photo

- [x] **[Opus 4.5]** Redesign hero with profile photo positioning
- [x] **[Opus 4.5]** Photo: upper-left on desktop (absolute positioned)
- [x] **[Opus 4.5]** Photo: centered above text on mobile
- [x] **[Opus 4.5]** Add name, location, and tagline text
- [x] **[Gemini 3 Pro]** TEST: Compare with v2, test responsive behavior

### 2.2 Create Tool Preview component

- [x] **[Opus 4.5]** Create `web/src/components/ToolPreview.tsx`
- [x] **[Opus 4.5]** Props: title, description, previewContent, ctaText, ctaLink
- [x] **[Opus 4.5]** Style with card, hover effects, consistent colors
- [x] **[Codex/Opus]** Export from `web/src/components/index.ts`
- [x] **[Codex/Opus]** TEST: Component renders correctly

### 2.3 Add Hiring Manager tools section

- [x] **[Opus 4.5]** Add "Hiring Manager?" section heading
- [x] **[Opus 4.5]** Create "How Do I Fit?" preview card with CTA
- [x] **[Opus 4.5]** Create "Custom Resume" preview card with CTA
- [x] **[Opus 4.5]** Create "Interview Me Now" preview with sample Q&A
- [x] **[Opus 4.5]** Layout: grid on desktop, stack on mobile
- [x] **[Gemini 3 Pro]** TEST: Click CTAs, verify navigation works

### 2.4 Add Dance Menu preview

- [x] **[Opus 4.5]** Add Dance Menu section heading
- [x] **[Opus 4.5]** Create preview/teaser content
- [x] **[Opus 4.5]** Add CTA linking to `/dance-menu`
- [x] **[Gemini 3 Pro]** TEST: Visual inspection, CTA navigation

### 2.5 Add Photo Fun link section

- [x] **[Opus 4.5]** Add Photo Fun section with heading
- [x] **[Opus 4.5]** Write description of AI photo editing features
- [x] **[Opus 4.5]** Add external link to photo-fun.samkirk.com (new tab)
- [x] **[Gemini 3 Pro]** TEST: Click link, verify external site opens

### 2.6 Add Song Dedication full embed

- [x] **[Opus 4.5]** Embed complete song dedication content
- [x] **[Opus 4.5]** Include lyrics display
- [x] **[Opus 4.5]** Include audio player/link
- [x] **[Opus 4.5]** Style to fit single-scroll aesthetic
- [x] **[Gemini 3 Pro]** TEST: Visual inspection, audio playback

---

## Phase 3 — New Pages

### 3.1 Create Photo Fun link page

- [x] **[Opus 4.5]** Create `web/src/app/photo-fun/page.tsx`
- [x] **[Opus 4.5]** Add title, description, features list
- [x] **[Opus 4.5]** Add prominent CTA button to external site
- [x] **[Codex/Opus]** Add to Header navigation
- [x] **[Gemini 3 Pro]** TEST: Navigation, link functionality

### 3.2 Create Tensor Logic link page

- [x] **[Opus 4.5]** Create `web/src/app/explorations/tensor-logic/page.tsx`
- [x] **[Opus 4.5]** Add title, description of educational demo
- [x] **[Opus 4.5]** List features (8 examples, 5 AI paradigms)
- [x] **[Opus 4.5]** Add link to tensor-logic.samkirk.com
- [x] **[Opus 4.5]** Add reference to arXiv paper
- [x] **[Codex/Opus]** Update Explorations hub to include Tensor Logic
- [x] **[Codex/Opus]** Update Header navigation dropdown
- [x] **[Gemini 3 Pro]** TEST: Navigation from Explorations hub

### 3.3 Add descriptions to Exploration pages

- [x] **[Opus 4.5]** Add description to Category Theory page
- [x] **[Opus 4.5]** Add description to Pocket Flow page
- [x] **[Opus 4.5]** Add description to Dance Instruction page
- [x] **[Opus 4.5]** Add description to Uber Level AI Skills page
- [x] **[Gemini 3 Pro]** TEST: Visual inspection of each exploration page

---

## Phase 4 — Styling Polish

### 4.1 Apply new color palette globally

- [x] **[Opus 4.5]** Update Header colors
- [x] **[Opus 4.5]** Update Footer colors
- [x] **[Opus 4.5]** Update card/surface colors
- [x] **[Opus 4.5]** Update CTA/button colors
- [x] **[Opus 4.5]** Update text colors (primary, secondary, muted)
- [x] **[Gemini 3 Pro]** TEST: Visual inspection of all pages
- [x] **[Gemini 3 Pro]** TEST: Dark mode verification

### 4.2 Mobile responsiveness audit

- [x] **[Gemini 3 Pro]** Test all pages at 375px width (iPhone SE)
- [x] **[Gemini 3 Pro]** Test all pages at 390px width (iPhone 14)
- [x] **[Gemini 3 Pro]** Verify no horizontal scrolling
- [x] **[Gemini 3 Pro]** Verify all content readable
- [x] **[Gemini 3 Pro]** Verify touch targets at least 44px
- [x] **[Opus 4.5]** Fix any responsiveness issues found

---

## Phase 5 — Cleanup & Verification

### 5.1 Delete incorrect plan file

- [x] **[Codex/Opus]** Delete `docs/PLAN-v2-features.md` — DONE (deleted during spec creation)

### 5.2 Final visual comparison

- [x] **[Gemini 3 Pro]** Start v2 on localhost:4321
- [x] **[Gemini 3 Pro]** Start v3 on localhost:3000
- [x] **[Gemini 3 Pro]** Compare home page personal feel
- [x] **[Gemini 3 Pro]** Compare color warmth
- [x] **[Gemini 3 Pro]** Verify photo placement matches
- [x] **[Gemini 3 Pro]** Verify location visibility
- [x] **[Gemini 3 Pro]** Verify build date format
- [x] **[Gemini 3 Pro]** Test all navigation links
- [x] **[Gemini 3 Pro]** Test on mobile viewport

### 5.3 Run existing tests

- [x] **[Codex/Opus]** Run `npm test` — all unit tests pass
- [x] **[Gemini 3 Pro]** Run `npm run test:e2e:real` — all E2E tests pass
- [x] **[Codex/Opus]** Fix any failing tests

---

## Summary

| Phase | Focus | Primary Model |
|-------|-------|---------------|
| 0 | Foundation (colors, assets) | Opus 4.5 + Codex/Opus |
| 1 | Header & Footer | Opus 4.5 |
| 2 | Home Page Redesign | Opus 4.5 |
| 3 | New Pages | Opus 4.5 + Codex/Opus |
| 4 | Styling Polish | Opus 4.5 + Gemini 3 Pro |
| 5 | Cleanup & Verification | Gemini 3 Pro + Codex/Opus |

---

**Workflow reminder:** After completing each step, check off items here. Start fresh chats between phases using the methodology's `/start-step` or `/continue-step` pattern to maintain context quality.
