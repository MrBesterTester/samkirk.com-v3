# samkirk.com v3 Visual Upgrade — Specification

## 1) Summary

Upgrade the visual design and user experience of samkirk.com v3 to feel more **personal and human** while maintaining its professional appeal to hiring managers. This revision brings warmth from v2's design language into v3's modern architecture, creating a hybrid experience that showcases Sam Kirk's genAI capabilities through examples of his work.

## 2) Goals

1. **Make v3 feel more personal/human** — like a real person's portfolio, not just a tool collection
2. **Improve first impressions for hiring managers** — immediate visual appeal and clear value proposition
3. **Showcase genAI capabilities** — highlight Sam's AI work through integrated demos and examples

## 3) Non-goals (This Revision)

- Changing core tool functionality (Fit, Resume, Interview)
- Modifying admin workflows
- Adding new LLM-powered features
- Changing backend architecture or data storage

## 4) Key Visual Elements

### 4.1) Profile Photo
- **Placement**: Hero section, upper-left on desktop, centered on mobile
- **Source**: `/Users/sam/Projects/samkirk.com-v2/public/profile-photo.jpg`
- **Styling**: Rounded corners, subtle border, shadow (matching v2 aesthetic)

### 4.2) Location Identity
- Display "**Sam Kirk - Fremont, California**" in the header/hero area
- Grounds the site as belonging to a real person in a real place

### 4.3) Single-Page Feel (Hybrid Layout)
- **Home page**: Single-scroll experience with all key content sections
- **Tool pages**: Remain as separate pages for full functionality
- Navigation provides access to both approaches

### 4.4) Color Palette
- **New balanced palette** combining:
  - V2's warmth: dark slate (`#0f172a`) + cyan accent (`#38bdf8`)
  - V3's clean feel: zinc grays with blue accents
- Goal: Professional yet warm and inviting

### 4.5) Build Date (Footer)
- Format: `v{MM-DD-YYYY_HH:MM}` (e.g., `v02-04-2026_14:30`)
- Timezone: **PST** (America/Los_Angeles)
- Matches v2's implementation exactly

## 5) Home Page Structure

The home page becomes a single-scroll experience with the following sections:

### 5.1) Hero Section
- Profile photo (upper-left on desktop, centered on mobile)
- Name: "Sam Kirk"
- Location: "Fremont, California"
- Tagline about software engineering and AI/ML expertise

### 5.2) Hiring Manager Tools (Preview + CTA for each)
Each tool shows a brief preview/teaser with a call-to-action to the full tool:

1. **How Do I Fit?**
   - Preview: Brief description of fit analysis capability
   - CTA: Link to `/tools/fit`

2. **Custom Resume**
   - Preview: Brief description of tailored resume generation
   - CTA: Link to `/tools/resume`

3. **Interview Me Now**
   - Preview: Sample Q&A exchange to demonstrate the chat experience
   - CTA: Link to `/tools/interview`

### 5.3) Dance Menu (Preview + CTA)
- Preview: This week's highlights or menu snippet
- CTA: Link to `/dance-menu` for full menu and downloads

### 5.4) Photo Fun (Link with Description)
- Description of what Photo Fun does (AI-powered photo editing)
- Prominent link to https://photo-fun.samkirk.com

### 5.5) Song Dedication (Full Embed)
- Complete song dedication content displayed inline
- Lyrics and audio embed/link
- No separate page navigation needed

### 5.6) Footer
- Build date in v2 format (`v{MM-DD-YYYY_HH:MM}` PST)
- Contact email: sam@samkirk.com
- Copyright notice

## 6) Other Pages (Navigation)

All existing pages remain accessible via navigation with updated styling:

### 6.1) Tool Pages (Full Functionality)
- `/tools/fit` — How Do I Fit? (full multi-turn flow)
- `/tools/resume` — Custom Resume (full generation)
- `/tools/interview` — Interview Me Now (full chat interface)

### 6.2) Content Pages
- `/dance-menu` — Full dance menu with download options
- `/song-dedication` — Full song dedication page (may duplicate home page content)
- `/photo-fun` — **NEW** Link page with description → photo-fun.samkirk.com

### 6.3) Explorations Hub
- `/explorations` — Hub page with descriptions for each exploration
  - Category Theory (static HTML + description)
  - Pocket Flow (static HTML + description)
  - Dance Instruction (static HTML + description)
  - Uber Level AI Skills (static HTML + description)
  - **Tensor Logic** — **NEW** annotated link → tensor-logic.samkirk.com

### 6.4) Admin Area
- `/admin` — Unchanged functionality (resume upload, dance menu upload, submissions)

## 7) External Apps (Link Pages)

### 7.1) Photo Fun
- **URL**: https://photo-fun.samkirk.com
- **Description**: AI-powered photo editing application using Google Gemini
- **Features to highlight**:
  - 4 preset artistic styles (Professional, Claymation, Cyberpunk, Pencil Sketch)
  - Custom prompt support for personalized transformations
  - Real-time image processing

### 7.2) Tensor Logic
- **URL**: https://tensor-logic.samkirk.com
- **Description**: Educational interactive demo of Pedro Domingos' Tensor Logic
- **Features to highlight**:
  - 8 interactive examples across 5 AI paradigms
  - Demonstrates mathematical unification of neural and symbolic AI
  - Based on peer-reviewed research (arXiv:2510.12269)

## 8) Technical Requirements

### 8.1) Mobile Responsiveness
- **Priority**: All pages must display correctly on mobile devices
- Hero photo: centered on mobile, upper-left on desktop
- Navigation: hamburger menu on mobile (existing)
- All sections: appropriate stacking and spacing

### 8.2) Color Palette Implementation
- Define new color tokens in Tailwind config
- Apply consistently across all components
- Maintain dark mode support

### 8.3) Asset Migration
- Copy profile photo from v2 to v3 public folder
- Ensure proper image optimization

## 9) Acceptance Criteria

### 9.1) Home Page
- [ ] Profile photo displays correctly (upper-left desktop, centered mobile)
- [ ] Location "Fremont, California" visible with name
- [ ] All three tool previews display with working CTAs
- [ ] Dance Menu preview displays with working CTA
- [ ] Photo Fun link with description present
- [ ] Song Dedication fully embedded
- [ ] Build date in footer matches v2 format (PST)

### 9.2) Navigation & Pages
- [ ] All existing pages accessible
- [ ] New `/photo-fun` page with description and external link
- [ ] Tensor Logic added to Explorations as annotated link
- [ ] Exploration pages have descriptions added

### 9.3) Styling
- [ ] New color palette applied consistently
- [ ] Warmer, more personal feel achieved
- [ ] Mobile responsive on all pages

### 9.4) Comparison
- [ ] Side-by-side with v2 shows similar personal feel
- [ ] Professional appearance maintained for hiring managers
