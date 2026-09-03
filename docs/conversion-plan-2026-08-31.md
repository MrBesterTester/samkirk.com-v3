# samkirk.com — Status and Work Outstanding

*Created: 2026-07-29 PST · Revised: 2026-09-02 PST*
*Status: current. W1–W4 shipped; W5 is done but uncommitted and undeployed.*

This is a **plan** (how). Requirements live in [SPECIFICATION.md](SPECIFICATION.md).

## Table of Contents

- [Originating request (verbatim)](#originating-request-verbatim)
- [1. Where things stand](#1-where-things-stand)
- [2. Do now](#2-do-now)
  - [W5 — GA4 tag loaded outside production](#w5--ga4-tag-loaded-outside-production)
  - [W1 — `answerFitQuestion` reports no failures](#w1--answerfitquestion-reports-no-failures)
  - [W2 — `/hire-me` landing page](#w2--hire-me-landing-page)
  - [W3 — Dance menu: extension is treated as identity](#w3--dance-menu-extension-is-treated-as-identity)
  - [W4 — Run duration is never recorded](#w4--run-duration-is-never-recorded)
- [3. Deferred — the model migration](#3-deferred--the-model-migration)
- [4. photo-fun — backlink and GA tag](#4-photo-fun--backlink-and-ga-tag)
- [5. Standing decisions](#5-standing-decisions)
- [6. Files](#6-files)
- [7. Verification](#7-verification)

---

## Originating request (verbatim)

> remove the correction history and leave standing only current status and what needs to be done now. Also add a bug I just found: the download of the .txt file for the dance menu downloads the notes, not the menu. Also defer any changes to the new Google model and make it clear what's left for right now.

## 1. Where things stand

### The numbers were measuring us

Until 2026-09-02 the GA4 tag loaded on **every** environment — `layout.tsx` gated only on the
measurement ID being set, which it always is. So every `npm run dev` page load and every
Playwright run reported into the production property. Playwright opens a fresh browser context
per test, which GA4 counts as a brand-new user.

Split by hostname for 2026-08-05 → 2026-09-02:

| Hostname | Users | Sessions | Views |
|---|---|---|---|
| **localhost** | **297** | 300 | 337 |
| samkirk.com | 46 | 74 | 130 |
| Vercel preview URL | 4 | 4 | 7 |

**310 of 347 users arrived on a single day, 2026-08-31** — the day the E2E suite was run
repeatedly. The page mix confirms it: 36 views of a 404 page (`full-app.spec.ts` has 404
tests), plus `/admin/login`, `/dance-menu/admin`, `/hire-me/fit`, `/hire-me/resume`. That is
the test inventory, not a visitor's browsing.

This also corrects an earlier reading in this plan. The Fremont cluster was attributed to
datacenter egress, with the argument that it could not be Sam because it showed many users
with one session each rather than one user with many. That reasoning was wrong — an E2E suite
produces exactly that signature. The city × hostname split is unambiguous: **Fremont /
localhost, 297 users, 300 sessions.** It was this machine.

Google's emailed report for Aug 6 – Sep 2 ("347 active users, ▲80.73%") is therefore an
artifact of our own testing, not growth.

### Real traffic — production only, 2026-08-05 → 2026-09-02

| Metric | Value |
|---|---|
| Active users | **46** |
| Sessions | 74 |
| Page views | 130 |
| Engagement rate | **59.5%** |

| Page | Views | Users |
|---|---|---|
| `/` | 47 | 23 |
| `/dance-menu` | 39 | 9 |
| `/hire-me` | **7** | **7** |
| `/song-dedication` | 6 | 3 |

Sources: `(direct)` 62 sessions · google/organic 6 · YouTube referral 4 · bing/organic 1 ·
linkedin.com referral 1.

The engagement rate is roughly triple what the blended number showed — real visitors engage
far better than the property has been reporting.

### The `/hire-me` funnel — production only

| Event | Production | localhost |
|---|---|---|
| `tool_job_loaded` | **0** | 62 |
| `tool_run_started` | **0** | 74 |
| `tool_run_completed` | **0** | 20 |
| `tool_chat_message` | **0** | 53 |
| `tool_download` | **0** | 0 |
| `contact_click` | **0** | 9 |
| `cta_click` | 4 (3 users) | 28 |
| `nav_click` | 33 (7 users) | 0 |

**No real visitor has ever used the /hire-me tool.** Every generation run in every earlier
version of this document — the 11 started, the 3 completed, the 8 that went dark — was
localhost. `/hire-me` has had 7 production views at 23s.

That does not make W1–W4 wrong: the code defects they fixed were real, found by reading code
rather than by reading these numbers. It does mean the funnel cannot yet be used to judge
whether the fixes helped, because there is no traffic in it.

### Search — Search Console, 2026-08-02 → 2026-08-29

49 impressions, 1 click (on `/explorations`, 20% CTR). Homepage 57 impressions at position
18.1. `photo-fun.samkirk.com` 40 impressions at position **51.1**. Query mix is name variants
plus photo-fun variants. **No query anywhere in the 5–20 striking-distance band.** Search
Console is unaffected by the tag problem — it measures Google's index, not our page loads.

### What is working

- **Interview truncation is fixed.** Thinking is bounded to 256 tokens, `finishReason` is read
  in `processMessage`, and `INTERVIEW_MAX_TOKENS` is 3072. Answers went from 3,730 characters
  cut off to 13,047 complete, while billable output more than halved.
- **Spend accounting is fixed.** `billableOutputTokens()` sums `thoughtsTokenCount` into
  billable output, closing an ≈8.6× under-count that had been letting the $20 cap permit
  roughly $170 of real output spend.
- **CAPTCHA protection is live and does not block anyone.** `withToolProtection()` wraps all
  five tool routes. Every user who loaded a job also started a run.
- **Both home-page conversion buttons are covered by E2E**, including a live booking
  lifecycle, in `web/e2e/home-ctas.spec.ts`.
- **W1–W4 shipped 2026-09-02** (`653f244`): fit-answer failures are reported, the job input
  opens on arrival with a two-sentence intro, the dance-menu upload previews file contents
  before publishing, and run duration is recorded.

## 2. Do now

**W1–W4 are done and shipped** (`653f244`, 2026-09-02). They are kept below as the record of
what changed and why; none needs further work.

**W5 is new and is the only open item in this repository.** It is not on the site — it is the
reason none of the numbers above could be trusted.

**The photo-fun work is tracked separately in
[§4](#4-photo-fun--backlink-and-ga-tag)** because it lives in a different repository and needs
a push approval — not because it ranks below this list.

| # | Item | Type | Status |
|---|---|---|---|
| **W5** | GA4 tag loads outside production | **Bug** | **done, uncommitted — not deployed** |
| W1 | `answerFitQuestion` reports no failures | Bug | shipped `653f244` |
| W2 | `/hire-me` landing page | UX | shipped `653f244` |
| W3 | Dance menu: extension treated as identity | Hardening | shipped `653f244` |
| W4 | Run duration never recorded | Measurement | shipped `653f244` |

### W5 — GA4 tag loaded outside production

`layout.tsx` gated the gtag snippet only on the measurement ID being configured, which it
always is. Development and preview traffic therefore reported into the production property —
86% of the last 28 days' "users" (§1).

**The fix.** A pure `shouldLoadAnalytics()` in
[analytics-gate.ts](../web/src/lib/analytics-gate.ts), used by `layout.tsx`. It loads the tag
only when a real measurement ID is set **and** `VERCEL_ENV === "production"` **and** the E2E
flag is absent. Six unit tests cover the matrix; verified in a live browser that on localhost
`window.gtag` is undefined, `dataLayer` is absent, and no tag-manager script is requested.

`e2e/home-ctas.spec.ts` needed its GA harness reworked: it previously read `dataLayer` because
the real snippet replaced any stub it installed. With the tag gated off, `trackEvent` no-ops,
so the harness now installs its own `gtag` stub — which it could not do before. It still
pushes into `dataLayer`, so it keeps working if pointed at a build where the real tag loads.

**Known residue.** The CI `smoke-test` job runs against the production deployment, so its page
loads still register. That is a handful per deploy rather than hundreds, and distinguishing it
would mean threading the bypass secret into the gate. Recorded, not fixed.

### W1 — `answerFitQuestion` reports no failures

| Function | Fires `trackToolRunFailed`? |
|---|---|
| `triggerFit` | ✅ [line 566](../web/src/hooks/useHireMe.ts#L566) |
| `triggerResume` | ✅ [line 784](../web/src/hooks/useHireMe.ts#L784) |
| `answerFitQuestion` | ❌ **no** — catch at [line 692](../web/src/hooks/useHireMe.ts#L692) |

The catch shows the user an error and resets state but emits no analytics event, so every
error in the fit question round-trip is invisible. Three-line fix; add a regression case to
`analytics.test.ts`.

> **[§4 — photo-fun](#4-photo-fun--backlink-and-ga-tag) belongs at about this priority.** It
> sits outside the W-list only because it lives in another repository and needs a push
> approval, not because it matters less. photo-fun draws the only non-branded search
> impressions the domain has — roughly 40 of 49 — and every one of those visitors currently
> lands on a dead end: no route back to samkirk.com, and no analytics recording that they came
> at all. Ranked on value it would sit here, between W1 and W2.

### W2 — `/hire-me` landing page

Six interactions stand between arrival and value: **Add Job → choose mode → paste → submit →
pass captcha → Analyze My Fit.** Ahead of them sit ~120 words of operational detail — accepted
formats, "Sorry, no `.pdf` inputs", and a paragraph about `.zip` packages and choosing an
output folder after unzipping.

1. **Cut the intro to two sentences.** Move the formats and `.zip` explanation next to the
   download button where they become relevant, or into a collapsed disclosure.
2. **Open the job input by default.** `JobContextBar` initialises to
   `barState = "collapsed-empty"`; make it `"expanded"` when no job is stored. Removes a click
   and makes the primary action self-evident. The collapsed state stays correct once loaded.
3. **Promote the primary action.** "Add Job" is styled as a small secondary button; the paste
   textarea should be the visual centre.
4. **Offer a zero-input path.** The tool does nothing until a job posting is supplied. A "Just
   chat about my experience" entry point — already supported by `sendMessage` — lets a curious
   visitor get value with no input. This is a **behaviour change, not a fix**, and the one
   item here that warrants a decision rather than just implementation.
5. **Reconsider `MAX_FIT_QUESTIONS = 5`.** Five sequential clarifying questions is the in-flow
   equivalent of the six-click intro.

### W3 — Dance menu: extension is treated as identity

**Status: the symptom is gone. The weakness is not.**

The Plain Text download from `/dance-menu` was serving the *notes* instead of the menu. It no
longer does. **No dance-menu code changed** — the last change to the upload logic predates the
report, and the working tree is clean — so the stored file changed, not the program. The wrong
`.txt` was published; the right one now is.

That makes this preventive work rather than a live defect, which is why it sits below W1 and
W2 rather than at the top.

**Why it can recur.** The upload keys entirely on file extension. Every uploaded file is
renamed to a standard name by extension — `STANDARD_FILENAMES[ext]` at
[dance-menu-upload.ts:269](../web/src/lib/dance-menu-upload.ts#L269), where `.txt` maps to
`sams-dance-menu.txt` ([line 55](../web/src/lib/dance-menu-upload.ts#L55)). Content validation
([lines 188–211](../web/src/lib/dance-menu-upload.ts#L188)) only checks the `%PDF` magic bytes
for PDFs and UTF-8 decodability for everything else. **Nothing checks that a `.txt` is the
menu.** Whatever `.txt` is in the bundle becomes the published plain-text menu, and
`/api/dance-menu` serves it under the "Plain Text" label
([route.ts:30](../web/src/app/api/dance-menu/route.ts#L30)).

A file named `notes.txt` and a file named `menu.txt` are indistinguishable to this code. The
next mis-picked file publishes the same way — silently, with no error and nothing in the admin
UI to show which file went where.

**The fix.** Make the wrong file visible before it publishes, rather than trying to validate
menu-ness automatically:

- Surface each uploaded file's first line (or first ~100 characters) in the admin UI for
  confirmation before publish. Cheap, and it catches every variant of this mistake.
- Optionally a content sanity check on `.txt`, but keep it advisory. A hard rule about what a
  menu "looks like" will eventually reject a legitimate menu.

Worth doing because `/dance-menu` is the most-navigated part of the site — 16 of 25 nav clicks
and 99s average dwell — so a wrong file there reaches the most engaged audience.

### W4 — Run duration is never recorded

`trackToolRunCompleted(run, durationMs?)` supports a `duration_seconds` parameter
([analytics.ts:158–163](../web/src/lib/analytics.ts#L158)) and `analytics.test.ts:156` covers
it, but all three call sites omit it — lines [408](../web/src/hooks/useHireMe.ts#L408),
[670](../web/src/hooks/useHireMe.ts#L670), [761](../web/src/hooks/useHireMe.ts#L761). Capture
a start timestamp alongside `trackToolRunStarted` and pass the elapsed time. Two lines, and it
makes completed-run latency visible for the first time.

## 3. Deferred — the model migration

**Deferred by decision, 2026-08-31.** Not started, not scheduled here. Recorded because it has
a hard external date.

**Gemini 2.5 Flash, Flash-Lite and Pro endpoints are discontinued 2026-10-20.** Google
notified `sam@samkirk.com` on 2026-07-29. `web/.env.local:10` sets
`VERTEX_AI_MODEL=gemini-2.5-flash`, consumed at `vertex-ai.ts:343` and `:480`. All three
`/hire-me` tools route through Vertex, so on that date they stop working.

Nothing in §2 depends on it and it needs no work today. What it will need when taken up:

- **Re-measure, do not carry over.** `INTERVIEW_THINKING_BUDGET = 256` and
  `INTERVIEW_MAX_TOKENS = 3072` were fitted to `gemini-2.5-flash` by measurement, and the
  career-history question landed within 15 tokens of the cap. Both numbers are model-specific.
- **Confirm `thinkingConfig` is honoured.** It is not declared by
  `@google-cloud/vertexai@1.10.0` and is cast through to the REST API. A model that silently
  ignores it restores the truncation while appearing fixed.
- **Confirm `billableOutputTokens()` still sums correctly.** A model reporting thinking tokens
  under a different field, or not at all, silently under-counts the spend cap again.

Method and measurements: `docs/interview-truncation-plan-2026-08-31.md`.

## 4. photo-fun — backlink and GA tag

photo-fun earns the only non-branded search impressions the domain has (~40 of 49), and those
visitors land on a page with no route back to samkirk.com and no analytics at all.

Verified state of `MrBesterTester/photo-fun5` (public, the active repo):

- **No link to samkirk.com in any application source** — the code-search hits are all in
  `README.md`, `docs/`, and `do-work/`, none in `App.tsx`, `components/`, or `index.html`.
- **No analytics of any kind.**
- `index.html` has `<title>Photo Fun - Expert AI Editor</title>`, no meta description, no
  canonical.

One PR, two changes:

| Change | File | Detail |
|---|---|---|
| Backlink | `App.tsx` | Persistent footer link in real `<a href="https://samkirk.com">` markup — not a JS-only handler, so a crawler can follow it |
| GA tag | `index.html` | `gtag.js` for `G-QPGLH8V5MM`, as a second data stream on property 525472559 |

The app is Vite + React 19 via an `esm.sh` importmap with Tailwind from CDN, so the snippet
goes into `index.html` directly. No cross-domain config is needed: `samkirk.com` and
`photo-fun.samkirk.com` share a registrable domain, so subdomain traffic reports into one
property without a `linker`.

**Prerequisite.** The working copy is on the MacBook Pro. No file copying is needed — the
GitHub remote is the transport. On that machine:

```bash
git -C <path-to-photo-fun5> status --short --branch
```

Clean and current → branch from `origin/main`. Unpushed commits → `git push origin main`.
Uncommitted work → commit or push a WIP branch and name it.

**Requires explicit approval to push.** The repo is public and is not an agent/advisor
project, so the no-remote rule does not apply — but pushing is outward-facing.

Out of scope: repositioning photo-fun as a portfolio piece, and its title/meta/canonical
indexing gaps. Those gaps are real (position 51.1) but are a separate change.

## 5. Standing decisions

**The "Book a Call" CTA stays on the home page**, above the "Hiring Manager?" section. The
decision stands on the work invested in it and the E2E coverage it now carries, including a
live booking lifecycle.

**The click evidence that was cited for it does not survive §1.** All 9 `contact_click` events
in the window are localhost — our own E2E test clicking the booking button. Production
`contact_click` is **0**. The earlier reversal cited "3 users, all `method: calendar`" as
proof the CTA was used; that was our test suite. Production has 4 `cta_click` events from 3
users and no contact clicks at all, so neither home-page CTA has demonstrated real use yet.
Keeping the CTA is a judgement about the site's purpose, not a conclusion from data.

**The captcha stays where it is, on page load, and stays at reCAPTCHA v2 checkbox.**
`ToolGate` wraps the chat panel at
[hire-me/page.tsx:69](../web/src/app/hire-me/page.tsx#L69), so a first-time visitor sees the
checkbox before using the tool. Deferring it to first action was considered and **rejected**:

- **It blocks nobody who reaches it.** 10 users loaded a job and 11 started a run — everyone
  who met the challenge cleared it.
- **The case for moving it is unmeasured and, as scoped here, unmeasurable.** The claim would
  be that the visible checkbox deters people who never start at all. That population is the 28
  of 38 who did not load a job, and there is no data on them. The gate events that could test
  it were dropped as instrumenting a non-problem — so the rationale for moving the gate and
  the rationale for not measuring it cannot both stand.
- **The change is not cheap.** It touches `ToolGate.tsx`, `ReCaptcha.tsx`, and the
  `__E2E_TEST_CAPTCHA_TOKEN__` bypass the whole `/hire-me` E2E suite depends on — real
  regression risk on security-adjacent code, bought with a hunch.

Revisit only if evidence appears that arrivals are abandoning at the challenge. Keeping v2
over v3 is unchanged: per `docs/SECURITY-comparison-report.md`, v3's score thresholds and
low-score fallbacks are harder to get right, and explicit friction is a feature when gating
expensive LLM calls.

**Acquisition work is not scheduled.** With no query in striking distance, SEO here is content
creation over months, not metadata tuning. Conversion work is the tractable half.

## 6. Files

### `samkirk-v3`

| File | Change |
|---|---|
| [web/src/lib/analytics-gate.ts](../web/src/lib/analytics-gate.ts) | **W5** — `shouldLoadAnalytics()`; consumed by `layout.tsx`; harness reworked in `e2e/home-ctas.spec.ts` |
| [web/src/lib/dance-menu-upload.ts](../web/src/lib/dance-menu-upload.ts) | **W3** — surface each file's first line in the admin UI before publish; optional advisory `.txt` check |
| [web/src/hooks/useHireMe.ts](../web/src/hooks/useHireMe.ts) | **W1** failure event in the `answerFitQuestion` catch (~line 692); **W4** `durationMs` at lines 408, 670, 761 |
| [web/src/app/hire-me/page.tsx](../web/src/app/hire-me/page.tsx) | **W2** cut intro copy, promote primary action, zero-input chat path |
| [web/src/components/hire-me/JobContextBar.tsx](../web/src/components/hire-me/JobContextBar.tsx) | **W2** default `barState` to `"expanded"` |
| `web/src/lib/analytics.test.ts` | **W1** regression case for the failure path |
| [web/src/app/page.tsx](../web/src/app/page.tsx) | **No change** — see §5 |
| [web/src/lib/analytics.ts](../web/src/lib/analytics.ts) | **No new events** |

### `MrBesterTester/photo-fun5`

| File | Change |
|---|---|
| `App.tsx` | **§4** crawlable footer backlink |
| `index.html` | **§4** `gtag.js` for `G-QPGLH8V5MM` |

Reuse rather than reinvent: `trackEvent` and `sanitizeParams` in `analytics.ts` already clamp
to GA4's 100-char parameter limit and no-op safely when gtag is absent; `TrackedLink.tsx`
already wraps `trackCtaClick` / `trackContactClick` / `trackArtifactDownload`.

## 7. Verification

### W3 — dance menu

The symptom has cleared, so this is regression cover rather than diagnosis — confirm the
served `.txt` is the menu, and keep it confirmed:

```bash
curl -s https://samkirk.com/api/dance-menu | python3 -m json.tool
```

Vercel Bot Protection is set to **Challenge**, so a scripted fetch may get a security
checkpoint rather than the payload — verify in a real browser if so. `route.test.ts` covers
the API; add a case asserting the `.txt` served is the menu.

### W1, W2, W4

- `cd web && npm test` — Vitest.
- `cd web && npm run test:e2e` — Playwright. `fit-tool.spec.ts`, `resume-tool.spec.ts`,
  `interview-tool.spec.ts`, and `download-buttons.spec.ts` drive `/hire-me` and are sensitive
  to the `barState` default (W2). `home-ctas.spec.ts` must stay green.
  - `playwright.config.ts` sets `reuseExistingServer: !CI`. A dev server already running
    **without** the E2E flags gets reused with the captcha bypass off — stop it and free port
    3000 first.
- `cd web && npm run test:all` — master runner. Per CLAUDE.md, run it in the background.

### §4 — photo-fun

CI on `photo-fun5` must pass. After deploy, view source on `photo-fun.samkirk.com` and find
the `<a href>` — a crawler must see it without executing JS. Confirm the GA tag fires via
`google-analytics.com/g/collect`, then GA4 Realtime.

### Re-measuring after W5

Every GA4 query must be read production-only until enough clean data accumulates. Filter on
hostname; the skill's commands do not do this yet:

```python
{"filter": {"fieldName": "hostName", "stringFilter": {"value": "samkirk.com"}}}
```

Historic data cannot be cleaned retroactively — GA4 has no delete. Treat everything before
2026-09-02 as blended, and do not compare across that boundary without splitting by hostname.

### Measuring the effect

Re-measure after about a week, not immediately:

```bash
python3 .claude/skills/check-analytics/scripts/ga4.py funnel --days 7
```

The success criterion is **not** the first-stage ratio — that denominator is mostly bots. It
is that **`tool_run_started` and `tool_run_completed` balance**: every started run should
produce a completion or a failure. Only once the books balance is the completion *rate* worth
optimising, and only then is a non-zero download count a meaningful target.

Ad blockers suppress GA4 for a meaningful share of technical visitors — treat absolute counts
as a floor and trust ratios.
