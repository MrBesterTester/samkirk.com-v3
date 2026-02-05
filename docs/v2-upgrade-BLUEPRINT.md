# samkirk.com v3 Visual Upgrade — Blueprint

This document provides the step-by-step implementation plan for the visual upgrade specified in `docs/v2-upgrade-SPECIFICATION.md`.

> **Methodology note:** Per `docs/Dylan-Davis-50plus-method.md`, this blueprint breaks the work into small, iterative steps with testing at each stage.

## Guiding Principles

- **Incremental delivery**: Each step should result in a working, testable state
- **Visual comparison**: Regularly compare with v2 (localhost:4321) during development
- **Mobile-first**: Test responsive behavior at each step
- **No breaking changes**: Existing tool functionality must remain intact

## Phase 0 — Foundation (Color Palette + Assets)

### 0.1 Define new color palette

- **Goal**: Create balanced color tokens combining v2 warmth with v3 clean feel
- **Acceptance criteria**:
  - New color variables defined in Tailwind config
  - Colors documented for consistent usage
- **Test plan**: Visual inspection of color swatches
- **Prompt**:

```text
Create a new color palette for samkirk-v3 that balances:
- V2's warmth: dark slate (#0f172a) + cyan accent (#38bdf8)
- V3's clean feel: zinc grays with blue accents

Define in tailwind.config.ts with semantic names:
- primary (background)
- secondary (cards/surfaces)
- accent (highlights, CTAs)
- text-primary, text-secondary, text-muted

Ensure dark mode compatibility.
```

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

---

## Phase 1 — Header & Footer Updates

### 1.1 Update Header with location

- **Goal**: Add "Fremont, California" to header
- **Acceptance criteria**:
  - Location text appears after "Sam Kirk" on desktop
  - Hidden or abbreviated on mobile for space
- **Test plan**: Visual inspection on desktop and mobile viewports
- **Prompt**:

```text
Update web/src/components/Header.tsx:
- Change logo text from "Sam Kirk" to "Sam Kirk - Fremont, California"
- On mobile (sm breakpoint and below), hide the location or show abbreviated
- Maintain existing styling consistency

Test: npm run dev, check header on desktop and mobile widths.
```

### 1.2 Update Footer with build date

- **Goal**: Add dynamic build date in v2 format
- **Acceptance criteria**:
  - Build date displays as `v{MM-DD-YYYY_HH:MM}`
  - Uses PST timezone (America/Los_Angeles)
- **Test plan**: Visual inspection, verify time matches PST
- **Prompt**:

```text
Update web/src/components/Footer.tsx:
- Add "use client" directive (needed for client-side date)
- Add build date generation matching v2 format exactly:
  const buildDate = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(/\//g, '-').replace(', ', '_');
- Display as: v{buildDate}
- Style: text-xs font-mono text-zinc-500

Test: npm run dev, verify footer shows correct PST time.
```

---

## Phase 2 — Home Page Redesign

### 2.1 Create Hero section with photo

- **Goal**: Redesign hero with profile photo like v2
- **Acceptance criteria**:
  - Photo appears upper-left on desktop, centered on mobile
  - Name, location, and tagline display properly
- **Test plan**: Visual comparison with v2, responsive testing
- **Prompt**:

```text
Redesign the hero section in web/src/app/page.tsx:

Structure:
- Relative container with photo positioned absolutely on desktop
- Photo: upper-left on md+ screens, centered and above text on mobile
- Text content: name, tagline about AI/ML and software engineering

Styling (like v2):
- Photo: w-40 md:w-48 rounded-lg border-4 border-blue-400/30 shadow-lg
- Responsive: flex justify-center md:block md:absolute md:left-0 md:top-0

Test: Compare side-by-side with v2 on both desktop and mobile.
```

### 2.2 Create Tool Preview components

- **Goal**: Reusable Preview + CTA component for tools
- **Acceptance criteria**:
  - Component accepts title, description, preview content, and link
  - Consistent styling across all tool previews
- **Test plan**: Component renders correctly with test props
- **Prompt**:

```text
Create web/src/components/ToolPreview.tsx:

Props:
- title: string
- description: string
- previewContent: React.ReactNode (optional - for sample Q&A, etc.)
- ctaText: string
- ctaLink: string
- icon?: React.ReactNode

Styling:
- Card with rounded corners, subtle border
- Hover effect on CTA button
- Consistent with new color palette

Export from web/src/components/index.ts.
```

### 2.3 Add Hiring Manager tools section

- **Goal**: Preview + CTA for Fit, Resume, Interview tools
- **Acceptance criteria**:
  - All three tools have preview cards
  - Interview Me includes sample Q&A exchange
  - CTAs link to respective tool pages
- **Test plan**: Click CTAs, verify navigation
- **Prompt**:

```text
Add Hiring Manager section to home page (web/src/app/page.tsx):

Section heading: "Hiring Manager?" (or similar)

Three ToolPreview cards:
1. How Do I Fit?
   - Description: Get a detailed fit analysis for your role
   - CTA: "Analyze Fit" → /tools/fit

2. Custom Resume
   - Description: Generate a tailored 2-page resume
   - CTA: "Generate Resume" → /tools/resume

3. Interview Me Now
   - previewContent: Sample Q&A (e.g., "Q: What's your experience with AI?")
   - CTA: "Start Interview" → /tools/interview

Layout: Grid on desktop, stack on mobile.
```

### 2.4 Add Dance Menu preview

- **Goal**: Preview + CTA for Dance Menu
- **Acceptance criteria**:
  - Shows teaser/snippet of current menu
  - CTA links to full dance menu page
- **Test plan**: Visual inspection, CTA navigation
- **Prompt**:

```text
Add Dance Menu section to home page:

- Heading: "This Week's Dance Menu" (or similar)
- Preview: Brief description or snippet
- CTA: "View Full Menu" → /dance-menu

Consider: Could fetch current menu title/date from API or show static teaser.
```

### 2.5 Add Photo Fun link section

- **Goal**: Link with description to Photo Fun app
- **Acceptance criteria**:
  - Description explains what Photo Fun does
  - Link opens photo-fun.samkirk.com in new tab
- **Test plan**: Click link, verify external site opens
- **Prompt**:

```text
Add Photo Fun section to home page:

Content:
- Heading: "Photo Fun"
- Description: AI-powered photo editing using Google Gemini. Transform your photos
  with artistic styles like Professional, Claymation, Cyberpunk, and Pencil Sketch.
- Link: "Try Photo Fun →" → https://photo-fun.samkirk.com (target="_blank")

Styling: Card or highlighted section to draw attention.
```

### 2.6 Add Song Dedication full embed

- **Goal**: Embed complete song dedication on home page
- **Acceptance criteria**:
  - Lyrics display fully
  - Audio embed/link works
  - Styled consistently with page
- **Test plan**: Visual inspection, audio playback
- **Prompt**:

```text
Add Song Dedication section to home page:

- Embed the full content from /song-dedication page
- Include lyrics and audio player/link
- Style to fit the single-scroll home page aesthetic

Consider: Extract shared content to a component if duplicating between
home page and /song-dedication route.
```

---

## Phase 3 — New Pages

### 3.1 Create Photo Fun link page

- **Goal**: Dedicated page for Photo Fun with description
- **Acceptance criteria**:
  - Page exists at `/photo-fun`
  - Description of app and features
  - Prominent link to external site
- **Test plan**: Navigation, link functionality
- **Prompt**:

```text
Create web/src/app/photo-fun/page.tsx:

Content:
- Title: "Photo Fun"
- Description: AI-powered photo editing application using Google Gemini
- Features list:
  - 4 preset styles: Professional, Claymation, Cyberpunk, Pencil Sketch
  - Custom prompts for personalized transformations
  - Real-time image processing
- CTA: Large button linking to https://photo-fun.samkirk.com

Add to navigation in Header.tsx.
```

### 3.2 Create Tensor Logic link page

- **Goal**: Add Tensor Logic to Explorations
- **Acceptance criteria**:
  - Page exists at `/explorations/tensor-logic`
  - Description of the educational demo
  - Link to external site
- **Test plan**: Navigation from Explorations hub
- **Prompt**:

```text
Create web/src/app/explorations/tensor-logic/page.tsx:

Content:
- Title: "Tensor Logic"
- Description: Educational interactive demo illustrating Pedro Domingos' Tensor Logic—
  a unified programming paradigm bridging neural and symbolic AI
- Features:
  - 8 interactive examples across 5 AI paradigms
  - Demonstrates mathematical unification via Einstein summation
  - Based on peer-reviewed research
- CTA: Link to https://tensor-logic.samkirk.com
- Reference: arXiv:2510.12269

Update Explorations hub and Header navigation to include Tensor Logic.
```

### 3.3 Add descriptions to Exploration pages

- **Goal**: Add context/intro before static HTML content
- **Acceptance criteria**:
  - Each exploration page has a description section
  - Static HTML content follows description
- **Test plan**: Visual inspection of each exploration page
- **Prompt**:

```text
Update exploration pages to add descriptions before static content:

1. /explorations/category-theory
   - Add intro explaining what Category Theory exploration covers

2. /explorations/pocket-flow
   - Add intro explaining Pocket Flow

3. /explorations/dance-instruction
   - Add intro about dance instruction content

4. /explorations/uber-level-ai-skills
   - Add intro about AI skills content

Pattern: Description section above the StaticHtmlViewer component.
```

---

## Phase 4 — Styling Polish

### 4.1 Apply new color palette globally

- **Goal**: Update all components to use new color tokens
- **Acceptance criteria**:
  - Consistent color usage across site
  - Warmer feel achieved
  - Dark mode still works
- **Test plan**: Visual inspection of all pages
- **Prompt**:

```text
Apply the new color palette defined in Phase 0.1 across all components:

- Header: Update background and text colors
- Footer: Update to match
- Cards/surfaces: Use secondary color
- CTAs/buttons: Use accent color
- Text: Use text-primary, text-secondary, text-muted appropriately

Test on multiple pages and in dark mode.
```

### 4.2 Mobile responsiveness audit

- **Goal**: Ensure all pages display correctly on mobile
- **Acceptance criteria**:
  - No horizontal scrolling
  - All content readable
  - Touch targets appropriately sized
- **Test plan**: Test on actual mobile device or DevTools
- **Prompt**:

```text
Audit and fix mobile responsiveness:

1. Test all pages at 375px width (iPhone SE)
2. Test at 390px width (iPhone 14)
3. Check:
   - Hero photo centering
   - Tool preview cards stacking
   - Navigation hamburger menu
   - Footer layout
   - All touch targets at least 44px

Fix any issues found.
```

---

## Phase 5 — Cleanup & Verification

### 5.1 Delete incorrect plan file

- **Goal**: Remove the incorrectly created standalone plan
- **Acceptance criteria**:
  - `docs/PLAN-v2-features.md` deleted
- **Prompt**:

```text
Delete the incorrectly created file: docs/PLAN-v2-features.md
This was created before following the Dylan Davis methodology properly.
```

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

### 5.3 Run existing tests

- **Goal**: Ensure no regressions
- **Acceptance criteria**:
  - All unit tests pass
  - All E2E tests pass
- **Test plan**: `npm test` and `npm run test:e2e:real`
- **Prompt**:

```text
Run all tests to verify no regressions:

cd /Users/sam/Projects/samkirk-v3/web
npm test
npm run test:e2e:real

Fix any failing tests.
```
