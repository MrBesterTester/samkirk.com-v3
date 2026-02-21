# SEO + Google Analytics Setup for samkirk.com

## Table of Contents

- [Verbatim Request](#verbatim-request)
- [Initial Request (Plan)](#initial-request-plan)
- [Background](#background)
- [Findings (Pre-Implementation)](#findings-pre-implementation)
- [Checklist](#checklist)
  - [Code Changes](#code-changes)
  - [Google Analytics 4](#google-analytics-4)
  - [Google Search Console](#google-search-console)
  - [Deploy & Verify](#deploy--verify)
  - [Optional Future Improvements](#optional-future-improvements)
- [What Was Implemented](#what-was-implemented)
  - [Shared SEO Constants](#shared-seo-constants)
  - [Enhanced Root Layout](#enhanced-root-layout)
  - [robots.ts + sitemap.ts](#robotsts--sitemapts)
  - [Per-Page Metadata](#per-page-metadata)
  - [File Inventory](#file-inventory)
- [Google Analytics 4 Setup](#google-analytics-4-setup)
  - [Create GA4 Property](#create-ga4-property)
  - [Update Measurement ID in Code](#update-measurement-id-in-code)
  - [Verify After Deploy](#verify-after-deploy)

---

## Verbatim Request

> I need to have Search Engine Optimization (SEO) applied to this website. I needs to emphasize Sam Kirk's skill in generative AI as it applies to sofware development and his skill of creating skills in Claude Cowork. Please consider these keywords:
> Sam Kirk, Samuel Kirk, Samuel A. Kirk, Samuel Allan Kirk
> Google,  Gemini OpenAI, ChatGPT Anthropic, Claude Microsoft, CoPilot Perplexity, Perplexity.ai
> sam@samkirk.com, MrBesterTester, MrBesterTester@gmail.com
> I also need to have samkirk.com registered with Google Analytics so I can track samkirk.com there using my Google Standard Enterprrise Workspace Google registered under samkirk.com. So the files docs/GCP-DEPLOY.md and/or docs/GCP-SETUP.md need to be updated.

---

## Initial Request (Plan)

Detailed plan given to Claude Code for implementation:

<details>
<summary>Full request (click to expand)</summary>

```
# SEO + Google Analytics Plan for samkirk.com

## Context

samkirk.com has minimal SEO — only a root title ("Sam Kirk") and generic description. No per-page
metadata, Open Graph tags, Twitter Cards, robots.txt, sitemap.xml, structured data, or analytics
tracking exist. This plan adds comprehensive SEO emphasizing Sam Kirk's generative AI and Claude
Code expertise, plus Google Analytics 4 integration.

## Findings from Google Analytics Console

- **GA account**: sam@samkirk.com (376572742) — exists, has 4 unrelated properties (gen-lang-client,
  photo-fun)
- **No samkirk.com GA4 property exists** — must be created manually by the user
- The plan includes step-by-step instructions in `docs/GCP-DEPLOY.md` for creating the property and
  getting the measurement ID

---

## Step 1: Create shared SEO constants

**Create** `web/src/lib/seo.ts`

Shared constants (site URL, name, descriptions, author info, GA measurement ID placeholder) imported
by all page metadata. Single source of truth.

## Step 2: Enhance root layout metadata + JSON-LD + Google Analytics

**Modify** `web/src/app/layout.tsx`

- Replace minimal `metadata` with full Next.js Metadata export:
  - `metadataBase: new URL("https://samkirk.com")`
  - `title: { default: "Sam Kirk — GenAI Software Engineer | Cursor & Claude Code", template: "%s | Sam Kirk" }`
  - `description` emphasizing generative AI, Claude Code, Cursor, full-stack TypeScript
  - `keywords` array with all requested terms (name variations, AI platforms, contact info)
  - `authors`, `creator`
  - `openGraph` (type, locale, siteName, title, description, image using profile-photo.jpg)
  - `twitter` card (summary_large_image)
  - `alternates.canonical`
- Add JSON-LD `<script>` tags in `<body>`:
  - **Person** schema (name, alternateName variants, jobTitle, knowsAbout with AI skills, sameAs
    links, email)
  - **WebSite** schema (name, url, author)
- Add Google Analytics via `next/script`:
  - gtag.js script with `strategy="afterInteractive"`
  - Config script with measurement ID from `seo.ts`
  - Placeholder `G-XXXXXXXXXX` until user creates GA4 property

## Step 3: Create robots.ts and sitemap.ts

**Create** `web/src/app/robots.ts`
- Allow `/` for all user agents
- Disallow `/admin/` and `/api/`
- Reference sitemap at `https://samkirk.com/sitemap.xml`

**Create** `web/src/app/sitemap.ts`
- 11 public URLs with appropriate `changeFrequency` and `priority`
- Homepage priority 1.0, hire-me 0.9, explorations/dance-menu 0.7, others 0.5-0.6

## Step 4: Add per-page metadata to all public pages

For **client component pages** (`"use client"`), create a wrapper `layout.tsx` that exports metadata:

**Create** `web/src/app/hire-me/layout.tsx` — "Hire Me — AI-Powered Candidate Evaluation"
**Create** `web/src/app/dance-menu/layout.tsx` — "Sam's Dance Menu — Weekly Curated Playlists"

For **server component pages**, add `export const metadata` directly:

| File | Title |
|------|-------|
| `web/src/app/song-dedication/page.tsx` | "Resilience in the Storm — Song Dedication" |
| `web/src/app/photo-fun/page.tsx` | "Photo Fun — AI Photo Transformation with Google Gemini" |
| `web/src/app/explorations/page.tsx` | "Explorations — Side Projects & Experiments" |
| `web/src/app/explorations/category-theory/page.tsx` | "Category Theory — Everyday Examples" |
| `web/src/app/explorations/dance-instruction/page.tsx` | "Dance Instruction — Teaching & Learning Dance" |
| `web/src/app/explorations/pocket-flow/page.tsx` | "Pocket Flow — AI Workflow Framework" |
| `web/src/app/explorations/tensor-logic/page.tsx` | "Tensor Logic — Unified AI Programming Paradigm" |
| `web/src/app/explorations/uber-level-ai-skills/page.tsx` | "Uber Level AI Skills — Advanced AI Techniques" |

Each page gets: `title`, `description`, `openGraph` (title, description, url, type),
`alternates.canonical`.

## Step 5: Update docs with Google Analytics setup instructions

**Modify** `docs/GCP-DEPLOY.md`

Add new **Step 12: Google Analytics 4** section with:
- Instructions to create a GA4 property under the sam@samkirk.com account (376572742)
- How to get the measurement ID (G-XXXXXXXXXX)
- Where to update the code (`web/src/lib/seo.ts` → `GA_MEASUREMENT_ID`)
- Verification: check Network tab for gtag.js requests after deploy

Also add a checklist item to the Deployment Checklist section.

---

## File Inventory

| Action | File |
|--------|------|
| CREATE | `web/src/lib/seo.ts` |
| MODIFY | `web/src/app/layout.tsx` |
| CREATE | `web/src/app/robots.ts` |
| CREATE | `web/src/app/sitemap.ts` |
| CREATE | `web/src/app/hire-me/layout.tsx` |
| CREATE | `web/src/app/dance-menu/layout.tsx` |
| MODIFY | `web/src/app/song-dedication/page.tsx` |
| MODIFY | `web/src/app/photo-fun/page.tsx` |
| MODIFY | `web/src/app/explorations/page.tsx` |
| MODIFY | `web/src/app/explorations/category-theory/page.tsx` |
| MODIFY | `web/src/app/explorations/dance-instruction/page.tsx` |
| MODIFY | `web/src/app/explorations/pocket-flow/page.tsx` |
| MODIFY | `web/src/app/explorations/tensor-logic/page.tsx` |
| MODIFY | `web/src/app/explorations/uber-level-ai-skills/page.tsx` |
| MODIFY | `docs/GCP-DEPLOY.md` |

**Total: 5 new files, 10 modified files, 0 npm packages to install**

## OG Image

Use existing `/public/profile-photo.jpg` for Open Graph. Not ideal aspect ratio (192x256 vs
1200x630) but functional — can be replaced with a branded card image later.

## Verification

1. `cd web && npm run build` — confirm no TypeScript errors
2. `npm run dev` — check each page's `<head>` for title, description, og:*, twitter:*, canonical
3. Visit `/robots.txt` — should show allow/disallow rules
4. Visit `/sitemap.xml` — should list all 11 public URLs
5. View page source — search for `application/ld+json` to verify Person + WebSite schemas
6. Check browser Network tab for `gtag/js` request (once GA measurement ID is set)
7. After deploy: Google Rich Results Test on `https://samkirk.com`
```

</details>

---

## Background

samkirk.com had minimal SEO — only a root title ("Sam Kirk") and a generic description. No per-page metadata, Open Graph tags, Twitter Cards, robots.txt, sitemap.xml, structured data, or analytics tracking existed.

**Goal:** Add comprehensive SEO emphasizing Sam Kirk's generative AI and Claude Code expertise, plus Google Analytics 4 integration.

## Findings (Pre-Implementation)

- **GA account**: sam@samkirk.com (376572742) — exists, has 4 unrelated properties (gen-lang-client, photo-fun)
- **No samkirk.com GA4 property exists** — must be created manually
- **DNS**: Managed via Microsoft 365 admin center (admin.microsoft.com). Already has a Google site verification TXT record.
- **Profile photo**: `/public/profile-photo.jpg` (192x256) used for OG image — not ideal 1200x630 ratio but functional

---

## Checklist

### Code Changes

- [x] 1.1 Create shared SEO constants (`web/src/lib/seo.ts`)
- [x] 1.2 Enhance root layout — full Metadata export, JSON-LD (Person + WebSite), GA4 script (`web/src/app/layout.tsx`)
- [x] 1.3 Create `robots.ts` — allow `/`, disallow `/admin/` and `/api/`
- [x] 1.4 Create `sitemap.ts` — 11 public URLs with priorities
- [x] 1.5 Add per-page metadata to all public pages (10 pages: 2 layout wrappers + 8 direct exports)
- [x] 1.6 Build verification — `npm run build` passes, `robots.txt` and `sitemap.xml` confirmed as static routes

### Google Analytics 4

- [x] 2.1 Create GA4 property for samkirk.com (see [setup instructions](#google-analytics-4-setup) below)
- [x] 2.2 Get measurement ID (`G-QPGLH8V5MM`) and update `web/src/lib/seo.ts` → `GA_MEASUREMENT_ID`
  - **Note**: GA4 does NOT require DNS changes. The measurement ID is a JavaScript tag embedded in the
    website code that sends analytics data to Google when visitors load pages. It works as soon as the
    code is deployed — no DNS TXT records needed. DNS verification is only required for **Google Search
    Console** (step 3.1–3.2), which is a separate Google product for monitoring search appearance,
    submitting sitemaps, and requesting indexing. Search Console verifies domain ownership via a DNS
    TXT record (managed in [Microsoft 365 admin center](https://admin.microsoft.com) → Domains →
    samkirk.com). A Google site verification TXT record may already exist from a previous setup.
- [x] 2.3 Deploy and verify `gtag.js` loads in browser Network tab

### Google Search Console

- [x] 3.1 Add `samkirk.com` as a Domain property in [Search Console](https://search.google.com/search-console)
- [x] 3.2 Verify ownership via DNS TXT record (auto-verified — existing DNS TXT record from previous setup)
- [x] 3.3 Submit sitemap: `https://samkirk.com/sitemap.xml` (11 pages discovered; removed 2 stale 2010-era sitemaps)
- [x] 3.4 Request indexing of key pages (homepage, `/hire-me`) via URL Inspection

### Deploy & Verify

- [ ] 4.1 Ship code changes (metadata, robots.txt, sitemap.xml, structured data, GA script)
- [ ] 4.2 Verify `<title>`, `og:*`, `twitter:*`, canonical tags in page source
- [ ] 4.3 Verify `https://samkirk.com/robots.txt` shows allow/disallow rules
- [ ] 4.4 Verify `https://samkirk.com/sitemap.xml` lists 11 URLs
- [ ] 4.5 Verify `application/ld+json` Person + WebSite schemas in page source
- [ ] 4.6 Verify GA loads (Network tab → filter `gtag`) — requires 2.2 complete
- [ ] 4.7 Run [Google Rich Results Test](https://search.google.com/test/rich-results) on `https://samkirk.com`

### Optional Future Improvements

- [ ] Replace OG image with branded 1200x630 card (current profile photo is 192x256)
- [ ] Add LinkedIn and other social profiles to Person schema `sameAs` array
- [ ] Set up GA4 events for key interactions (hire-me tool usage, dance menu downloads)

---

## What Was Implemented

### Shared SEO Constants

**Created** `web/src/lib/seo.ts`

Single source of truth for site URL, name, descriptions, author info, keywords, OG image path, and GA measurement ID placeholder (`G-XXXXXXXXXX`).

### Enhanced Root Layout

**Modified** `web/src/app/layout.tsx`

- Full Next.js `Metadata` export: `metadataBase`, title template (`%s | Sam Kirk`), description, keywords, authors, creator, Open Graph, Twitter Card, canonical URL
- JSON-LD structured data: **Person** schema (name, alternateName, jobTitle, knowsAbout, sameAs, email) + **WebSite** schema
- Google Analytics 4 via `next/script` with `afterInteractive` strategy

### robots.ts + sitemap.ts

**Created** `web/src/app/robots.ts`
- Allows `/` for all user agents
- Disallows `/admin/` and `/api/`
- References sitemap at `https://samkirk.com/sitemap.xml`

**Created** `web/src/app/sitemap.ts`
- 11 public URLs with appropriate `changeFrequency` and `priority`
- Homepage priority 1.0, hire-me 0.9, explorations/dance-menu 0.7, others 0.5–0.6

### Per-Page Metadata

**Client component pages** (have `"use client"`) — created wrapper `layout.tsx` files:

| File Created | Title |
|---|---|
| `web/src/app/hire-me/layout.tsx` | Hire Me — AI-Powered Candidate Evaluation |
| `web/src/app/dance-menu/layout.tsx` | Sam's Dance Menu — Weekly Curated Playlists |

**Server component pages** — added `export const metadata` directly:

| File Modified | Title |
|---|---|
| `web/src/app/song-dedication/page.tsx` | Resilience in the Storm — Song Dedication |
| `web/src/app/photo-fun/page.tsx` | Photo Fun — AI Photo Transformation with Google Gemini |
| `web/src/app/explorations/page.tsx` | Explorations — Side Projects & Experiments |
| `web/src/app/explorations/category-theory/page.tsx` | Category Theory — Everyday Examples |
| `web/src/app/explorations/dance-instruction/page.tsx` | Dance Instruction — Teaching & Learning Dance |
| `web/src/app/explorations/pocket-flow/page.tsx` | Pocket Flow — AI Workflow Framework |
| `web/src/app/explorations/tensor-logic/page.tsx` | Tensor Logic — Unified AI Programming Paradigm |
| `web/src/app/explorations/uber-level-ai-skills/page.tsx` | Uber Level AI Skills — Advanced AI Techniques |

Each page gets: `title`, `description`, `openGraph` (title, description, url, type, images), `alternates.canonical`.

### File Inventory

| Action | File |
|--------|------|
| CREATE | `web/src/lib/seo.ts` |
| MODIFY | `web/src/app/layout.tsx` |
| CREATE | `web/src/app/robots.ts` |
| CREATE | `web/src/app/sitemap.ts` |
| CREATE | `web/src/app/hire-me/layout.tsx` |
| CREATE | `web/src/app/dance-menu/layout.tsx` |
| MODIFY | `web/src/app/song-dedication/page.tsx` |
| MODIFY | `web/src/app/photo-fun/page.tsx` |
| MODIFY | `web/src/app/explorations/page.tsx` |
| MODIFY | `web/src/app/explorations/category-theory/page.tsx` |
| MODIFY | `web/src/app/explorations/dance-instruction/page.tsx` |
| MODIFY | `web/src/app/explorations/pocket-flow/page.tsx` |
| MODIFY | `web/src/app/explorations/tensor-logic/page.tsx` |
| MODIFY | `web/src/app/explorations/uber-level-ai-skills/page.tsx` |

**Total: 5 new files, 10 modified files, 0 npm packages installed**

---

## Google Analytics 4 Setup

> This is the single source of truth for GA4 setup. `docs/GCP-DEPLOY.md` Step 12 references this section.

### Create GA4 Property

The GA account `sam@samkirk.com` (account ID: 376572742) already exists with 4 unrelated properties. A new property is needed for samkirk.com.

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in as `sam@samkirk.com`
3. Click **Admin** (gear icon, bottom-left)
4. Under **Account** (376572742), click **Create Property**
5. **Property name:** `samkirk.com`
6. **Reporting time zone:** Eastern Time (US & Canada)
7. **Currency:** USD
8. Click **Next**, select **Business size** and **objectives**, then **Create**
9. Under **Data Streams**, click **Add stream** → **Web**
10. **Website URL:** `samkirk.com`
11. **Stream name:** `samkirk.com production`
12. Click **Create stream**

### Update Measurement ID in Code

After creating the stream, copy the **Measurement ID** (format: `G-XXXXXXXXXX`) from the stream details page.

Update `web/src/lib/seo.ts`:

```typescript
export const GA_MEASUREMENT_ID = "G-XXXXXXXXXX"; // ← replace with your actual ID
```

### Verify After Deploy

1. Deploy the updated code to Vercel
2. Open `https://samkirk.com` in Chrome
3. Open DevTools → **Network** tab
4. Filter for `gtag` — you should see a request to `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`
5. In Google Analytics → **Realtime** report, confirm your visit appears
