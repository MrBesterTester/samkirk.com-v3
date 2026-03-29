---
id: REQ-137
title: Add Computer Diagnostics via LLM Fine-Tuning section and subpages
status: done
created_at: 2026-03-27T19:10:00Z
completed_at: 2026-03-29T11:00:00Z
user_request: UR-042
related: [REQ-136]
---

# Add Computer Diagnostics via LLM Fine-Tuning Section and Subpages

## What Was Delivered

### Homepage section
- New "Computer Diagnostics via LLM Fine-Tuning" showcase section at top of project list
- Links to dedicated `/computer-diagnostics` subpage (not directly to GitHub/HuggingFace)

### Dedicated subpage (`/computer-diagnostics`)
- **Intro**: Fault Isolation and Fault Identification from IBM's field service philosophy (replaced "40 years of expertise" framing)
- **Why This Project Matters**: use vs. teach AI; CompuFlair physics-based interpretation at macro and micro levels (bullet points with context links)
- **What I Built**: specs table (model, method, dataset, hardware, training time, val loss)
- **Why It's a Differentiator**: three bullet points (bridges careers, consumer hardware, dramatic results)
- **Project Evolution**: v1 (basic) knowledge base → v2 (current) FD/FI working diagnostician → v3 (next) explicit diagnostic mode classification
- **References**: annotated links to Physics of LoRA (local subpage + source in repo), GitHub repo, HuggingFace weights, CompuFlair

### Physics of LoRA subpage (`/computer-diagnostics/physics-of-lora`)
- Imported `Compu-Flair/Physics_of_LoRA.html` from the repo as a static HTML page via StaticHtmlViewer
- KaTeX math equations, SVG diagrams, and table of contents all render correctly
- Back-link to parent `/computer-diagnostics` page

## Files Changed
- `web/src/app/page.tsx` — homepage section with link to subpage
- `web/src/app/computer-diagnostics/page.tsx` — main subpage
- `web/src/app/computer-diagnostics/layout.tsx` — SEO metadata
- `web/src/app/computer-diagnostics/physics-of-lora/page.tsx` — Physics of LoRA subpage
- `web/public/static/physics-of-lora.html` — static HTML asset

## Key Decisions
- Replaced "40 years of expertise" with Fault Isolation / Fault Identification from IBM field service philosophy
- CompuFlair macro/micro physics framing with context links (README for macro, Physics of LoRA for micro)
- Removed speculative "code generation" future direction; replaced with verified 3-version evolution from repo docs
- Physics of LoRA hosted locally (GitHub raw HTML doesn't render) via StaticHtmlViewer iframe

---
*Source: "The Computer Diagnostics is explained well in /Users/sam/Projects/ClaudeProjects/MyCareerAgent/SAK_Consulting_Campaign_Briefing_2026-03-18.html"*
