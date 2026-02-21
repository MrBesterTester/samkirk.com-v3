# samkirk.com v3

Personal website and showcase of Sam Kirk's projects over the past three years in generative AI, mainly in software development. Built using state-of-the-art generative AI methods, layering Matt Maher's do-work methodology on top of Dylan Davis' 3-document method.

**Interview Me NOW - LLM-powered hiring tools - The Sam Kirk chatbot** — Upload a job description to the Sam Kirk chatbot to get a tailored fit analysis, a custom two-page resume, or just have an interactive interview with my chatbot alter ego, all driven by a master resume and Vertex AI.

**Creative AI demos** — AI photo editing with Gemini (preset styles + custom prompts), a song dedication composed with ChatGPT and Udio, and a weekly curated dance-music menu.

**Educational explorations** — Interactive pages on category theory, tensor logic (bridging neural and symbolic AI), Pocket Flow tutorials (Crawl4Ai, Modular Max, Mojo), dance instruction, and advanced AI prompting techniques.

[Visit samkirk.com to see my projects and to Interview Me NOW.](https://www.samkirk.com)

## Table of Contents

- [samkirk.com v3](#samkirkcom-v3)
  - [Principles of Operation (POO)](#principles-of-operation-poo)
  - [Standard Operating Procedures (SOP)](#standard-operating-procedures-sop)
    - [Updating the Resume](#updating-the-resume)
    - [Updating the Dance Schedule](#updating-the-dance-schedule)
    - [Validating LLM Spend](#validating-llm-spend)
    - [Checking Analytics & Search Performance](#checking-analytics-search-performance)
  - [The README Project Structure](#the-readme-project-structure)
  - [Tech Stack](#tech-stack)
  - [Development Methodology](#development-methodology)
  - [Notes](#notes)
  - [Punch Down List](#punch-down-list)

## Principles of Operation (POO)

Most of the website content is fixed — static pages that rarely change. Two sections are the flexible exceptions:

- **Dance Menu** (small) — A weekly-updated listing of upcoming dance events. An admin uploads `.txt` and `.html` files (with optional `.md` and `.pdf`) via the admin panel, and they're served to visitors on the `/dance-menu` page.
- **Hire Me** (large) — The interactive hiring toolkit. Visitors upload a job description, and the system uses the stored resume plus LLM processing to generate tailored cover letters, fit reports, and interview prep materials.

## Standard Operating Procedures (SOP)

> **Note:** The **Admin** nav link only appears in development mode (`NODE_ENV=development`). In production, `/admin` is still accessible by URL but hidden from the navigation for security.

Both procedures below require GCP login (`/login-gcloud`).

### Updating the Resume

**Initial setup (new environment):**
1. Edit `web/data/baseline-resume.md` with your resume content
2. Validate chunking: `npm run validate:resume -- data/baseline-resume.md`
3. Seed to GCP: `npm run seed:resume` (purges all existing chunks and resets to version 1)

**Updating your resume:**
- **Via admin page:** `/admin/resume` (requires Google OAuth login)
- **Via CLI:** Edit `web/data/baseline-resume.md` and run `npm run seed:resume`

**Resume format requirements:**
- Markdown with headings (##, ###) for logical sections
- Each section: 100-2000 characters
- Content under headings, not just nested sub-headings

### Updating the Dance Schedule

Go to `/admin/dance-menu` (requires admin authentication).

**Required files:** `.txt` and `.html` versions of the menu. **Optional:** `.md` and `.pdf`.

**Steps:**
1. Drag and drop (or click to browse) your files into the upload area
2. The page shows validation status — yellow for required-but-missing, green for ready
3. Click **"Publish Dance Menu"** (enabled once both `.txt` and `.html` are present)
4. The menu is immediately live on the public `/dance-menu` page

**Constraints:** Max 10 MB per file, 50 MB total. One file per format. Files are stored in GCS as `sams-dance-menu.{ext}`, replacing the previous version.

### Validating LLM Spend

Run monthly (or whenever you suspect pricing drift) to compare the app's estimated spend against actual GCP billing:

```bash
cd web && npm run validate:spend
```

Requires GCP credentials (`/login-gcloud`). The script reads the current month's Firestore `spendMonthly` document and prints estimated spend, budget, percentage used, and the hardcoded pricing constants. It also prints a direct link to the GCP Billing console for manual comparison.

If the `LAST_PRICING_REVIEW` date in the script is older than 30 days, it warns you to re-check Vertex AI pricing. Update the date in `web/scripts/validate-spend.ts` after each review.

### Checking Analytics & Search Performance

Two Google dashboards track how samkirk.com is performing. Both are signed in under `sam@samkirk.com`.

**Google Analytics 4** — [analytics.google.com](https://analytics.google.com/) (property: samkirk.com, measurement ID: `G-QPGLH8V5MM`)

Shows visitor activity *on* your site. Key reports:
- **Realtime** — live visitors currently on the site
- **Engagement › Pages and screens** — which pages get the most views
- **Acquisition › Traffic acquisition** — where visitors come from (Google search, direct, social, referral)
- **User › Demographics** — visitor locations and devices

**Google Search Console** — [search.google.com/search-console](https://search.google.com/search-console?resource_id=sc-domain:samkirk.com) (domain property: samkirk.com)

Shows how your site appears *in Google Search*. Key reports:
- **Performance** — which search queries lead to impressions and clicks, click-through rates, and average position
- **Indexing › Pages** — how many pages are indexed vs. excluded, and why
- **Sitemaps** — status of the submitted sitemap (`https://samkirk.com/sitemap.xml`, 11 pages)
- **URL Inspection** (top search bar) — check indexing status of any specific page

> **Note:** Search Console does not send email notifications when indexing completes for a requested URL. To check indexing status, go to the same [Google Search Console link](https://search.google.com/search-console?resource_id=sc-domain:samkirk.com) above, type the page URL into the "Inspect any URL" search bar at the top, and look for "URL is on Google" (indexed) vs. "URL is not on Google" (still pending). Indexing typically takes a few days to a couple of weeks after requesting. Search Console does send email alerts for crawl errors, security issues, or manual actions — just not for routine indexing completions.

## The README Project Structure

Nearly every folder has a `README.md` — linked below via the folder name — providing detailed context for that area. Follow them to get a clear, readable understanding of how everything fits together. The README for the [`docs/`](docs/README.md) folder is a very good practical starting point. For the methodologically minded, start with [`REFERENCES/`](REFERENCES/README.md).

<pre>
samkirk-v3/
├── <a href=".claude/README.md">.claude/</a>                 # Claude Code integration
├── <a href=".cursor/README.md">.cursor/</a>                 # Cursor IDE commands and rules
├── <a href="do-work/README.md">do-work/</a>                 # Autonomous work queue
│   ├── <a href="do-work/archive/README.md">archive/</a>             # Completed and on-hold REQs
│   ├── <a href="do-work/user-requests/README.md">user-requests/</a>       # Incoming REQ files
│   └── <a href="do-work/working/README.md">working/</a>             # Currently processing
├── <a href="docs/README.md">docs/</a>                    # Project documentation (30+ files)
├── <a href="web/README.md">web/</a>                     # Next.js application
│   ├── <a href="web/data/README.md">data/</a>                # Resume data
│   ├── <a href="web/e2e/README.md">e2e/</a>                 # Playwright E2E tests
│   │   └── <a href="web/e2e/fixtures/README.md">fixtures/</a>        # Upload test inputs
│   ├── <a href="web/scripts/README.md">scripts/</a>             # Build & test scripts
│   ├── <a href="web/src/README.md">src/</a>
│   │   ├── <a href="web/src/app/README.md">app/</a>             # Pages & API routes
│   │   ├── <a href="web/src/components/README.md">components/</a>      # Shared React components
│   │   ├── <a href="web/src/lib/README.md">lib/</a>             # Core business logic (40+ modules)
│   │   └── <a href="web/src/test/README.md">test/</a>            # Test utilities
│   └── <a href="web/test-fixtures/README.md">test-fixtures/</a>       # Saved tool outputs
│       ├── <a href="web/test-fixtures/fit-report/README.md">fit-report/</a>      # Fit report data flow
│       ├── <a href="web/test-fixtures/interview-chat/README.md">interview-chat/</a>  # Interview chat data flow
│       └── <a href="web/test-fixtures/resume-generator/README.md">resume-generator/</a>    # Resume generator data flow
├── CLAUDE.md                # AI assistant project instructions
├── <a href="README.md">README.md</a>                # This file
├── <a href="README_dev_guide.md">README_dev_guide.md</a>      # Developer guide: methodology, testing, conventions
└── <a href="REFERENCES/README.md">REFERENCES/</a>              # Methodology study guides
    ├── <a href="REFERENCES/Dylan-Davis-50plus-method.html">Dylan-Davis-50plus-method.html</a>   # Three-document system (Spec → Blueprint → TODO)
    └── <a href="REFERENCES/Matt-Maher_Claude-Code.html">Matt-Maher_Claude-Code.html</a>      # Six practices + do-work autonomous queue
</pre>

## Tech Stack

- **Frontend + backend**: Next.js (App Router) on Vercel
- **Language**: TypeScript (strict)
- **LLM**: Gemini via Vertex AI
- **Storage**: Cloud Storage (files) + Firestore (metadata/counters)

## Development Methodology

This project was built entirely with AI, layering **Matt Maher's do-work methodology** for autonomous execution on top of **Dylan Davis's three-document system** (Specification, Blueprint, TODO) for structured planning. A custom `/ingest-todo` bridge connects the two — TODO steps become do-work queue items that process autonomously with fresh AI context per task.

**For the full write-up** (how both methods work, the bridge, workflow diagrams, and links to original source videos): **[Development Methodology in the Developer Guide](README_dev_guide.md#development-methodology)**

**Study guides** — standalone HTML references for the two methodologies behind this project:
- [Dylan Davis: I've Built 50+ Apps with AI](REFERENCES/Dylan-Davis-50plus-method.html) — three-document system (Specification → Blueprint → TODO)
- [Matt Maher: Claude Code Meta-Programming](REFERENCES/Matt-Maher_Claude-Code.html) — six practices + the do-work autonomous queue pattern

**Three-document sets** (Dylan Davis pattern — used six times in this project):

| Set | Spec | Blueprint | TODO | Status |
|-----|------|-----------|------|--------|
| V1 Core | [SPECIFICATION.md](docs/SPECIFICATION.md) | [BLUEPRINT.md](docs/BLUEPRINT.md) | [TODO.md](docs/TODO.md) | Complete |
| V2 Visual | [v2-upgrade-SPEC](docs/v2-upgrade-SPECIFICATION.md) | [v2-upgrade-BP](docs/v2-upgrade-BLUEPRINT.md) | [v2-upgrade-TODO](docs/v2-upgrade-TODO.md) | Complete |
| Master Tests | [master-test-SPEC](docs/master-test-SPECIFICATION.md) | [master-test-BP](docs/master-test-BLUEPRINT.md) | [master-test-TODO](docs/master-test-TODO.md) | Complete |
| Hire Me Unified | [unified-SPEC](docs/hire-me-unified-SPECIFICATION.md) | [unified-BP](docs/hire-me-unified-BLUEPRINT.md) | [unified-TODO](docs/hire-me-unified-TODO.md) | Complete |
| Hire Me Streamline | [streamline-SPEC](docs/hire-me-streamline-SPECIFICATION.md) | [streamline-BP](docs/hire-me-streamline-BLUEPRINT.md) | [streamline-TODO](docs/hire-me-streamline-TODO.md) | Pending |
| Security Hardening | [security-SPEC](docs/security-SPECIFICATION.md) | [security-BP](docs/security-BLUEPRINT.md) | [security-TODO](docs/security-TODO.md) | In Progress |

The Master Tests set also has two companion documents: [`master-test-plan.md`](docs/master-test-plan.md) (the original monolithic plan, superseded when it was restructured into the three-document format) and [`master-test-START-DEV.md`](docs/master-test-START-DEV.md) (a temporary quick-reference card for kicking off the do-work build process).

**Tool Support:**
- **Cursor IDE**: Project commands in `.cursor/commands/`, rules in `.cursor/rules/`
- **Claude Code**: Project skills in `.claude/skills/`, rules in `.claude/RULES.md`
- See [`.claude/CURSOR-COMPATIBILITY.md`](.claude/CURSOR-COMPATIBILITY.md) for command mapping between tools

Both tools can be used interchangeably. Workflow commands (create-spec, create-blueprint, create-todo, start-step, continue-step) work in both environments.

## Notes

- Secrets must never be committed (use env vars / GCP Secret Manager).
- Phone numbers for future SMS alerting must be treated as secrets and not logged/exposed.

## Punch Down List

Requests on hold — to be picked up after current priorities:

- [REQ-035: Fix DNS for tensor-logic.samkirk.com](do-work/archive/hold/REQ-035-fix-tensor-logic-dns.md)
- [REQ-037: Add photo option on generated resume](do-work/archive/hold/REQ-037-photo-option-generated-resume.md)
