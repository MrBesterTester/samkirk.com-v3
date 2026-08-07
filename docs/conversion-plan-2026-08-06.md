# /hire-me Conversion Plan — and the photo-fun Backlink

*Created: 2026-07-29 PST · Revised: 2026-08-06 PST (run-completion gap root-caused; traffic re-baselined against bot filtering)*
*Status: proposed — next step approved, not yet executed. Nothing in Plans A–D has shipped.*

> **Revision note (2026-08-06).** This supersedes `conversion-plan-2026-07-29.md`.
> Two things changed since the 07-30 revision: the 8 → 2 run-completion loss has
> been traced to specific code paths (§4, new), and a traffic spike in the
> intervening week turned out to be datacenter noise, which revises the reading
> of the funnel's first stage (§3). The companion
> `conversion-plan-2026-07-29.html` has **not** been regenerated and is one
> revision behind.

## Table of Contents

- [0. Next step](#0-next-step)
- [1. Context](#1-context)
- [2. What the data actually says](#2-what-the-data-actually-says)
- [3. Correction — the first funnel stage is mostly bots](#3-correction--the-first-funnel-stage-is-mostly-bots)
- [4. Root cause of the run-completion gap](#4-root-cause-of-the-run-completion-gap)
- [5. Correction to the original captcha diagnosis](#5-correction-to-the-original-captcha-diagnosis)
- [6. The landing experience, as built](#6-the-landing-experience-as-built)
- [7. Plan A — instrument the dark stretch first](#7-plan-a--instrument-the-dark-stretch-first)
- [8. Plan B — reduce time-to-first-value](#8-plan-b--reduce-time-to-first-value)
- [9. Plan C — defer the captcha gate](#9-plan-c--defer-the-captcha-gate)
- [10. Plan D — the photo-fun PR](#10-plan-d--the-photo-fun-pr)
- [11. Sequencing](#11-sequencing)
- [12. Verification](#12-verification)
- [13. Files to be modified](#13-files-to-be-modified)

---

## 0. Next step

**Open the PR against `MrBesterTester/photo-fun5` — backlink *and* GA tag together.**

This resolves the two questions left open in the previous revision. Both changes
land in one pull request:

1. A crawlable footer backlink to `https://samkirk.com`, in real `<a href>`
   markup on the app shell so it appears on every view.
2. The GA4 tag `G-QPGLH8V5MM` in `index.html`, registered as a second data
   stream on property 525472559.

Rationale for doing both at once: they touch adjacent files in a repo whose
working copy is not on this machine, and photo-fun is the only asset earning
non-branded search impressions. Splitting them across two round trips to a
laptop that isn't reachable buys nothing.

**Requires explicit approval to push to a remote before I execute.** The repo is
public and is not an agent/advisor project, so the no-remote rule does not apply
here — but pushing is still an outward-facing action that needs a go-ahead.

> **2026-08-06 note.** §4 turned up a genuine silent-error bug (A2 in the fix
> table) that costs nothing to fix and is not blocked on anyone's approval.
> Consider taking that one ahead of the PR; the sequencing in §11 reflects this.

### Prerequisite — getting `photo-fun5` current

The open question was whether `origin/main` on GitHub matches the working copy on
the MacBook Pro, since the PR has to branch from something current.

**Originating request (verbatim):**

> I think there's a plan in ../MyIT-Agent on how to link the  two computers, though maybe just scp-ing  from my MacBook to my  iMac here will be sufficient.

Two findings:

1. **There is no machine-linking plan in `MyIT-agent`.** The three files that
   mention SSH / file-sharing terms are
   `macbook-pro-15-2018-profile-2026-06-30.md` (hardware profile — dock, ports,
   macOS Sequoia 15.7.7), `imac-backup-drive-2026-06-03.md` (Time Machine and the
   WD My Passport, not host-to-host access), and `iterm2-setup-2026-04-03.md`.
   Nothing covers reaching one Mac from the other.
2. **Neither linking nor `scp` is needed.** `photo-fun5` already has a GitHub
   remote — that *is* the transport. Copying a working tree between machines
   would create a second untracked copy of a git repo, which is strictly worse
   than letting git do it.

The actual prerequisite, run **on the MacBook Pro**:

```bash
git -C <path-to-photo-fun5> status --short --branch
```

- **Clean and up to date** → nothing to do; I branch from `origin/main`.
- **Unpushed commits** → `git push origin main`.
- **Uncommitted work in progress** → commit it, or push it as a WIP branch
  (`git push -u origin wip-<name>`) and tell me which branch to base the PR on.

Once `origin/main` reflects the laptop, I need no access to that machine at all —
the PR is two small file changes I can make from a fresh clone here.

## 1. Context

samkirk.com has two separate problems, and this plan addresses only the second.

**Acquisition** is near zero: 76 search impressions and 2 organic sessions in 28
days, average position 16–45, and no query anywhere in the 5–20 striking-distance
band. There is nothing to optimize yet — that is a months-long content play.

**Conversion** is the tractable one. GA4 shows 12 generation runs started in 28
days, 3 completed, and **zero** downloads. Traffic that arrived by
hand-delivered link — 220 of 242 sessions were direct — still did not convert.
Fixing acquisition before conversion would pour more visitors into a funnel that
currently leaks 100%.

The intended outcome of this plan: a `/hire-me` page where a hiring manager
reaches something of value in one click instead of six, plus enough
instrumentation to tell *why* the ones who leave are leaving. Secondarily, a
crawlable link and working analytics on `photo-fun.samkirk.com`.

## 2. What the data actually says

### GA4 funnel, users not events, 2026-07-09 → 2026-08-06

| Stage | Users | Drop |
|---|---|---|
| Visited `/hire-me` | 105 | — |
| Loaded a job description | 10 | **−90%** |
| Started a generation run | 10 | −0% |
| Run completed | 2 | **−80%** |
| Downloaded the .zip | 0 | −100% |

**The first drop is not real — see §3.** The denominator is inflated by
datacenter traffic. The 10 → 2 → 0 tail is real and is the subject of §4.

### Run events broken out by `run_type`

This is the breakdown the previous revision did not have, and it splits the
"8 → 2" loss into two unrelated failures:

| `run_type` | Started | Completed | Failed | **Dark** |
|---|---|---|---|---|
| `fit_report` | 6 | 2 | 0 | **4** |
| `resume` | 6 | 1 | 0 | **5** |
| **Total** | **12** | **3** | **0** | **9** |

Nine of twelve runs emitted no terminal event of any kind. Not a completion, not
a failure. The two run types get there by different routes (§4).

### Supporting signals

- `/hire-me` average time on page: **4 seconds** (109 views) — down from 12s,
  consistent with the bot influx. By contrast `/robotics` is 2172s and
  `/dance-menu` is 971s.
- Site-wide engagement rate: **19.0%**.
- `nav_click`: 15 events from **5 users**. `cta_click`: 2 from **1 user**.
- `tool_run_failed`: **zero events**, again.
- `tool_download`: **zero events**. This zero is trustworthy —
  `trackToolDownload` fires at the *top* of `download()`
  ([useHireMe.ts:915](../web/src/hooks/useHireMe.ts#L915)), before the fetch, so
  it records click intent rather than delivery success. Nobody clicked.
- `contact_click`: still absent from the event list entirely.

### Search Console, 2026-07-08 → 2026-08-04

| Landing page | Clicks | Impr | CTR | Position |
|---|---|---|---|---|
| `samkirk.com/` | 1 | 99 | 1.0% | 16.5 |
| `/explorations` | 1 | 11 | 9.1% | 22.4 |
| `photo-fun.samkirk.com/` | 0 | 49 | 0.0% | 44.7 |
| `/hire-me` | 0 | 4 | 0.0% | 4.5 |

Top queries total **76 impressions, 0 clicks** across 15 queries. (Query-level
rows sum to fewer clicks than page-level rows because Google withholds
low-volume queries; the page table is the more complete count.)

Two observations worth carrying forward:

- **The site does not rank for Sam's own name.** `samuel kirk` sits at position
  23.8, `sam kirk` at 30.8, `who is sam kirk` at 15.0 — all page 2–3. A recruiter
  who is told the name and searches it does not reliably find the site.
- **`/hire-me` ranks at position 4.5 but draws 4 impressions.** The one page that
  converts is well-placed for a query nobody issues.
- Remaining query volume is `photo fun*` variants (chasing a generic app name)
  plus `sean kirk ai` and `david kirk nvidia` — different people.

## 3. Correction — the first funnel stage is mostly bots

The previous revision treated **80 → 8** as the headline problem and attributed
it to time-to-first-value. That reading needs qualifying: most of the
denominator is not human.

Evidence, from the same 28-day window:

| Signal | Value | Why it matters |
|---|---|---|
| `(direct)/(none)` | 220 sessions, 188 users, **14.5% engaged** | Real direct traffic engages; this does not |
| Fremont, CA | 141 sessions, **140 users** | ~1 session per user — no returns |
| Flint Hill | 24 sessions, **24 users** | Same 1:1 signature |
| `/hire-me` dwell | **4s** across 105 users | Not reading |
| Organic sessions | **2** | GSC independently confirms near-zero search arrival |

The Fremont cluster deserves a caution, because Fremont is also where Sam lives
and the coincidence invites a wrong conclusion. It is not him: Sam would appear
as **one** user with many sessions, and this is **140 users with one session
each**. Fremont is a major colocation hub (Hurricane Electric's FMT facilities),
so datacenter egress geolocating there is the ordinary explanation.

Netting out Fremont and Flint Hill leaves roughly **29 plausibly-human users**
for the month. Against that denominator, 10 job-descriptions-loaded is not a 90%
collapse — it is something closer to a third of real visitors taking the first
step, which is unremarkable.

**Consequence for this plan:** Plan B (§8) loses its claim to being the largest
expected win. It is still worth doing — the landing copy is genuinely too long
and the six-click path is real — but it should no longer be sequenced ahead of
the run-completion work on the strength of a 90% number that is mostly noise.

**This is not proven, only strongly indicated.** GA4 exposes no IP or ASN, so
the datacenter attribution is inferred from the geography, the 1:1
user-to-session ratio, and the engagement rate together. Confirming it properly
means either Vercel's own request logs (which do carry IPs) or enabling GA4's
bot-filtering report and comparing.

## 4. Root cause of the run-completion gap

Nine of twelve runs ended in silence. The code says this happens two different
ways, and only one of them is a bug.

### 4a. `fit_report` — the flow parks on an unanswered question, by design

`triggerFit` fires `trackToolRunStarted("fit_report")` at
[useHireMe.ts:479](../web/src/hooks/useHireMe.ts#L479), then branches on the
server's response:

- **`status === "ready"`** → calls `generateFitReport`, which fires
  `trackToolRunCompleted` at [line 408](../web/src/hooks/useHireMe.ts#L408).
  Terminal. Fine.
- **`status === "question"`** → appends a `fit-question` message and sets
  `active: true, isLoading: false`
  ([lines 530–553](../web/src/hooks/useHireMe.ts#L530)). **The run now waits for
  a human, indefinitely, with no terminal event pending.**

Completion for that branch only arrives via `answerFitQuestion` reaching
`status === "complete"` at
[line 670](../web/src/hooks/useHireMe.ts#L670). The flow allows up to
`MAX_FIT_QUESTIONS = 5` rounds, so a visitor may face five sequential clarifying
questions before seeing anything.

A visitor who is asked a question and closes the tab therefore produces
`tool_run_started` and nothing else — forever. This is not a crash; it is a
structural dead end in the measurement. Four `fit_report` runs are sitting in it.

### 4b. `answerFitQuestion` has no failure instrumentation — a real bug

The three run-driving functions handle their catch blocks inconsistently:

| Function | Catch block | Fires `trackToolRunFailed`? |
|---|---|---|
| `triggerFit` | [line 562](../web/src/hooks/useHireMe.ts#L562) | ✅ yes, [line 566](../web/src/hooks/useHireMe.ts#L566) |
| `triggerResume` | [line 780](../web/src/hooks/useHireMe.ts#L780) | ✅ yes, [line 784](../web/src/hooks/useHireMe.ts#L784) |
| `answerFitQuestion` | [line 692](../web/src/hooks/useHireMe.ts#L692) | ❌ **no** |

`answerFitQuestion`'s catch shows the user an error message and resets state, but
emits no analytics event. Every error in the question round-trip — the longest
and most LLM-dependent stretch of the fit flow — is invisible. If the fit flow
has been breaking for real users, the current data physically cannot show it.

This is the one item here that is a defect rather than a measurement gap, and it
is a three-line fix.

### 4c. `resume` — abandonment while the request is in flight

`triggerResume` is single-shot: one `POST /api/tools/resume`, then either
`trackToolRunCompleted` at [line 761](../web/src/hooks/useHireMe.ts#L761) or
`trackToolRunFailed` at [line 784](../web/src/hooks/useHireMe.ts#L784). Every
path that *settles* is instrumented.

Yet 6 started and 1 completed, with zero failures. The only way to get there is
for the promise never to settle in a live page — the visitor navigated away or
closed the tab while the request was outstanding.

Two contributing conditions:

- **No `maxDuration` is set** on any route under `web/src/app/api/tools/`, so the
  platform default governs. A server-side timeout would surface as a non-OK
  response and *would* be caught and reported as a failure — the absence of
  failures says these runs are not timing out server-side.
- **No `AbortController`** anywhere in `useHireMe.ts`, so there is no client-side
  cancel path and no unmount hook to fire a terminal event.

Five resume runs are in this state. Combined with 4a, that accounts for all nine.

### 4d. Duration is still never recorded

`trackToolRunCompleted(run, durationMs?)` supports a `duration_seconds`
parameter ([analytics.ts:158–163](../web/src/lib/analytics.ts#L158)) and
`analytics.test.ts:156` covers it — but **all three call sites omit it**
(lines [408](../web/src/hooks/useHireMe.ts#L408),
[670](../web/src/hooks/useHireMe.ts#L670),
[761](../web/src/hooks/useHireMe.ts#L761)). The latency hypothesis for 4c
therefore cannot be tested against the three runs that *did* succeed. This gap
was identified in the 07-29 revision and has not been closed.

### Summary

| Loss | Runs | Mechanism | Class |
|---|---|---|---|
| Fit run parks on unanswered question | 4 | No terminal event by design | Measurement gap |
| Fit question round-trip errors | unknown | Catch block emits nothing | **Defect** |
| Resume abandoned in flight | 5 | Promise never settles | Measurement gap |
| Completed-run duration | 3 | `durationMs` never passed | Measurement gap |

## 5. Correction to the original captcha diagnosis

*(Retained from the 07-30 revision; still valid.)*

The reCAPTCHA gate was initially named as the primary cause of the first-stage
drop. The code and the funnel together say that is **wrong**.

`JobContextBar` is rendered **outside** `ToolGate` in
[hire-me/page.tsx](../web/src/app/hire-me/page.tsx). Pasting a job posting
therefore does not require passing the captcha. And the funnel shows
`tool_job_loaded` = 10 → `tool_run_started` = 10, a **0% drop** — every single
visitor who loaded a job also passed the captcha and started a run. The gate
stopped nobody, in two consecutive measurement windows.

The captcha still deserves to move (§9) — it is friction shown before any value
is demonstrated — but it is hygiene, not a fix for anything the data shows.

## 6. The landing experience, as built

A first-time visitor to `/hire-me` sees, top to bottom:

1. `<h1>` "Interview me NOW".
2. Roughly 120 words of operational detail before any control: accepted input
   formats (`.docx`, `.html`, `.txt`, `.md`), "Sorry, no `.pdf` inputs", and a
   full paragraph about `.zip` packages, traceability, and choosing an output
   folder after unzipping.
3. A small collapsed bar — "Add a job posting to enable fit analysis and custom
   resume" — with a secondary-looking **Add Job** button. `JobContextBar`
   initialises to `barState = "collapsed-empty"`, so the input is not even
   visible yet.
4. A reCAPTCHA v2 checkbox panel: "Verify to use Hire Me Tools".

Clicks to first value: **Add Job → choose mode → paste → submit → pass captcha →
Analyze My Fit.** Six interactions, fronted by a paragraph about unzipping files
and a bot challenge, for a visitor who has not yet been shown anything worth the
effort.

Add to that the finding in §4a: a visitor who gets through all six may then be
asked up to five clarifying questions before any output appears.

## 7. Plan A — instrument the dark stretch first

Any copy or layout change shipped now would be unfalsifiable. Instrument first,
ship changes second. The list below supersedes the 07-29 version; items A1–A3 are
new and come directly from §4.

| # | Change | File | Class |
|---|---|---|---|
| **A1** | Fire `trackToolRunFailed(run, reason)` in `answerFitQuestion`'s catch, matching the other two handlers | [useHireMe.ts:692](../web/src/hooks/useHireMe.ts#L692) | **Bug fix** |
| **A2** | On unmount / `beforeunload` with `fitFlow.active`, fire `tool_run_failed` with `reason: "abandoned_at_question"` | `useHireMe.ts` | Measurement |
| **A3** | Same for an in-flight `resumeFlow`, `reason: "abandoned_in_flight"` | `useHireMe.ts` | Measurement |
| **A4** | Capture a start timestamp and pass `durationMs` at all three completion sites | `useHireMe.ts` lines 408, 670, 761 | Measurement |
| **A5** | Set an explicit `maxDuration` on the tools routes so a slow run fails visibly instead of hanging | `web/src/app/api/tools/**/route.ts` | Hygiene |

Plus the funnel-visibility events from the original plan:

| New event | Fired when | Answers |
|---|---|---|
| `tool_gate_shown` | `ToolGate` resolves to `captcha` | How many even see the challenge |
| `tool_gate_passed` | `CaptchaGate` verifies | Captcha pass rate |
| `tool_gate_failed` | Verification errors out | Whether the gate breaks for anyone |
| `tool_job_input_opened` | `handleExpand` in `JobContextBar` | Intent to start — separates "did not care" from "tried and gave up" |
| `tool_fit_question_shown` | A `fit-question` message is appended | **How often the flow parks**, and at which round |
| `tool_fit_question_answered` | `answerFitQuestion` submits | The park → answer rate, directly |

`tool_fit_question_shown` / `_answered` are the pair that make §4a measurable
rather than inferred. Carry the question number as a parameter so it is possible
to see whether people quit at round 1 or round 4.

Each new event parameter must be registered as a **custom dimension** in GA4
before it will report, and **registration is not retroactive** — do it in the
same sitting as the deploy.

## 8. Plan B — reduce time-to-first-value

*Priority lowered — see §3. The 90% first-stage drop that justified putting this
first is mostly datacenter traffic.*

The goal is one visible, valuable action above the fold.

1. **Cut the intro to two sentences.** Keep what the tool does; delete the
   formats list, the "no `.pdf`" apology, and the entire `.zip`/unzipping
   paragraph. Those are answers to questions a visitor has not asked yet — move
   them next to the download button where they become relevant, or into a
   collapsed "How downloads work" disclosure.
2. **Open the job input by default.** Change `JobContextBar`'s initial
   `barState` from `"collapsed-empty"` to `"expanded"` when no job is stored.
   This removes a whole click and makes the primary action self-evident. The
   collapsed state remains correct for the loaded case.
3. **Promote the primary action.** "Add Job" is styled as a small secondary
   button; the paste textarea should be the visual centre of the page.
4. **Offer a zero-input path.** The tool currently does nothing until a job
   posting is supplied. A "Just chat about my experience" entry point — already
   supported by `sendMessage` — lets a curious visitor get value with no input at
   all.
5. **Reconsider the five-question ceiling.** `MAX_FIT_QUESTIONS = 5` is the
   in-flow equivalent of the six-click intro. Once A1–A3 land and the park rate
   is visible, this number should be revisited on evidence.

Items 4 and 5 are genuine changes in behaviour rather than fixes; flagged as such
rather than folded in silently.

### Home page — drop the "Book a Call" CTA

The same problem exists one level up, on `/`. The first call to action a visitor
meets is not the tool — it is a consulting pitch.

**What it is today.** [page.tsx](../web/src/app/page.tsx) lines 41–59: a
full-width bordered section, "Book a Free 30-Min Consultation," with a
`ContactLink` to a Google Calendar booking page rendering a **Book a Call →**
button. It sits *above* the "Hiring Manager?" section, so it outranks the
**Interview me NOW →** CTA that leads into the actual funnel.

**Why it goes.** In two consecutive 28-day windows, **`contact_click` does not
appear in the event list at all** — not once. That single event covers the
calendar link, LinkedIn, and the mailto, so zero clicks on any of them. Over the
same period `cta_click` fired twice, both `home_interview_me_now`. The most
valuable position on the home page is held by a CTA with no recorded use, ahead
of the one that does get used.

**The change.** Delete the entire booking `<section>`. "Interview me NOW" becomes
the single primary CTA, and the "Hiring Manager?" block moves up to sit directly
under the hero.

Notes for whoever implements it:

- **Keep `ContactLink` and the `"calendar"` member of `ContactMethod`.**
  `Footer.tsx` still uses `ContactLink` for LinkedIn and the mailto, and
  `ContactMethod` is a closed set backing the registered `method` custom
  dimension in GA4. Removing the member gains nothing and risks the historical
  dimension mapping.
- **No test churn.** Neither `page.test.tsx` nor anything under `web/e2e/`
  references "Book a Call" or "Consultation", so nothing should go red.

**The tradeoff, stated plainly:** this removes the only direct-booking path from
the home page. Contact remains reachable via the footer's LinkedIn and
`sam@samkirk.com` links. If the booking link should survive in some form, the
alternative is to **demote** it — move it below the hire-me CTA or into the
footer — rather than delete it. Dropping outright is what was asked for and is
what the zero-click data supports; the demote option is recorded here so the
choice is visible rather than assumed.

## 9. Plan C — defer the captcha gate

Chosen approach: keep reCAPTCHA v2 checkbox (per the conclusion in
`docs/SECURITY-comparison-report.md` that v3's score thresholds and low-score
fallbacks are harder to get right, and that explicit friction is a feature when
gating expensive LLM calls) — but stop showing it on page load.

In [ToolGate.tsx](../web/src/components/ToolGate.tsx), add an `activateOn` prop
so the gate renders its children immediately and only interposes the challenge
when a guarded action is first invoked. `/hire-me` then wraps the *generate* and
*send* handlers rather than the whole chat panel.

This preserves the server-side protection exactly as-is — `/api/session/init` and
`/api/captcha/verify` are untouched, and no expensive call can be made before
verification. It changes only *when* the challenge appears. The LLM cost surface
does not widen.

**Additional argument as of 2026-08-06:** §3 established that a large share of
inbound requests are automated. The captcha is the thing keeping those requests
away from the LLM endpoints, which raises the cost of getting the deferral wrong.
`activateOn` must gate the *action*, not merely hide the widget.

## 10. Plan D — the photo-fun PR

photo-fun is the only part of the domain earning non-branded impressions: 49 of
76 total, on queries like `photo fun`, `photo fun editor`, `photofun.ai`. Those
visitors currently land on a page with no route back to samkirk.com and no
analytics at all.

Verified state of `MrBesterTester/photo-fun5` (public, last pushed 2026-03-26 —
the active repo; `MrBesterTester/photo-fun` is a Dec 2025 predecessor):

- **No link to samkirk.com in any application source.** The 14 code-search hits
  are all in `README.md`, `docs/`, and `do-work/` — none in `App.tsx`,
  `components/`, or `index.html`.
- **No analytics of any kind.** The single `gtag` hit is an unrelated
  `package-lock.json` string. Those impressions land on an entirely unmeasured
  page.
- `index.html` has `<title>Photo Fun - Expert AI Editor</title>` and **no meta
  description and no canonical link**.

### The PR contents

| Change | File | Detail |
|---|---|---|
| Backlink | `App.tsx` | Persistent footer link, real `<a href="https://samkirk.com">` markup — not a JS-only handler, so a crawler can follow it. Appears on every view via the app shell. |
| GA tag | `index.html` | Standard `gtag.js` snippet for `G-QPGLH8V5MM`, added as a second data stream on property 525472559 so subdomain traffic reports into the same property `check-analytics` already reads. |

The app is Vite + React 19 loaded through an importmap from `esm.sh`, with
Tailwind from CDN — so the GA snippet goes in `index.html` directly rather than
through a framework integration. There is no Next.js `Script` component here.

Note that GA4 does not need cross-domain configuration for this: `samkirk.com`
and `photo-fun.samkirk.com` share a registrable domain, so subdomain traffic is
tracked as one property by default without a `linker` config.

One consequence to expect: adding this stream will pull photo-fun's traffic —
including whatever share of it is automated — into the same property the funnel
is measured in. Segment by hostname when reading the funnel afterwards.

### Deliberately out of scope

Repositioning photo-fun as a portfolio piece, and the title/meta/canonical
indexing fixes. The indexing gaps are recorded above so they are not lost —
average position 44.7 is poor, and the missing meta description and canonical are
the likely reason, but that is a separate change from this PR.

## 11. Sequencing

Revised 2026-08-06. The ordering changed: A1 moved to the front because it is a
defect, and Plan B moved back because §3 undercut its justification.

1. **A1 — the `answerFitQuestion` failure event.** A three-line bug fix, no
   approval needed, and until it lands the fit flow's error rate is unknowable.
2. **Plan D — the photo-fun PR.** The approved next step (§0), independent of
   everything else and unblocked.
3. **Plan A, remainder** — A2–A5 plus the new events. Register the custom
   dimensions the same day. Ship and let it collect for about a week, so there is
   a real baseline.
4. **Plan B** — copy cut, expanded-by-default input, and the `MAX_FIT_QUESTIONS`
   review, now informed by the park-rate data A2 produces.
5. **Plan C** — defer the gate. Independent of B; can ride along.

Plan A genuinely must precede B and C. Shipping the copy rewrite first would
leave us unable to say whether it worked.

## 12. Verification

### For the photo-fun PR

- CI on `photo-fun5` must pass — the repo has `.github/workflows/ci.yml` and a
  `.gitleaks.toml`.
- Confirm the backlink is in the served HTML, not just the source: after deploy,
  view source on `photo-fun.samkirk.com` and find the `<a href>`. A crawler must
  see it without executing JS for it to pass link authority.
- Confirm the GA tag fires: check network requests to
  `google-analytics.com/g/collect`, then GA4 Realtime with the subdomain filtered.
- Note that Vercel Bot Protection is set to **Challenge**, so `curl` gets a
  security checkpoint on both hosts. Verification has to happen in a real browser
  that runs JS — a scripted fetch will report a false negative.

### For the /hire-me work

- `cd web && npm test` — Vitest. `Header.test.tsx`, `Footer.test.tsx`, and
  `ToolGate.test.tsx` all exist and must stay green; `ToolGate.test.tsx` needs
  new cases for the deferred-activation path. `analytics.test.ts` needs a case
  for the `answerFitQuestion` failure path (A1) — that test is the regression
  guard for the defect.
- `cd web && npm run test:e2e` — Playwright. `e2e/fit-tool.spec.ts`,
  `resume-tool.spec.ts`, `interview-tool.spec.ts`, and `download-buttons.spec.ts`
  all drive `/hire-me` and will be sensitive to both the `barState` default and
  the gate change. Expect to update selectors.
  - E2E bypasses the captcha via `NEXT_PUBLIC_E2E_TESTING=true` and the
    `__E2E_TEST_CAPTCHA_TOKEN__` path in `ReCaptcha.tsx`. The deferred-gate
    refactor must keep that bypass working or the whole suite goes red.
- `cd web && npm run test:all` — master runner. Per CLAUDE.md, run it in the
  background.
- **Confirm events actually arrive.** Unit tests prove the helpers are called;
  they do not prove GA4 received anything. Load `/hire-me` and check the network
  requests to `google-analytics.com/g/collect` for the new event names, then
  confirm in GA4 Realtime.
- **Re-measure after a week**, not immediately:
  ```bash
  python3 .claude/skills/check-analytics/scripts/ga4.py funnel --days 7
  ```
  The success criterion has changed. It is no longer "the first-stage ratio
  moves" — that number is mostly bots. It is:
  **`tool_run_started` and `tool_run_completed` should balance.** Every started
  run must produce a completion or a failure. If runs still go dark after A1–A3,
  the instrumentation is still wrong. Only once the books balance is the
  completion *rate* worth optimising, and only then is a non-zero download count
  a meaningful target.

  Ad blockers suppress GA4 for a meaningful share of technical visitors, so treat
  absolute counts as a floor and trust the stage-to-stage ratios.

## 13. Files to be modified

### `MrBesterTester/photo-fun5` (the PR)

| File | Change |
|---|---|
| `App.tsx` | Crawlable footer backlink to samkirk.com |
| `index.html` | `gtag.js` snippet for `G-QPGLH8V5MM` |

### `samkirk-v3`

| File | Change |
|---|---|
| [web/src/hooks/useHireMe.ts](../web/src/hooks/useHireMe.ts) | **A1** failure event in `answerFitQuestion` catch (~line 692); **A2/A3** abandonment events on unmount; **A4** `durationMs` at lines 408, 670, 761; fire the new fit-question events |
| [web/src/lib/analytics.ts](../web/src/lib/analytics.ts) | New gate, job-input, and fit-question events; reuse existing `trackEvent`/`sanitizeParams` |
| `web/src/app/api/tools/**/route.ts` | **A5** explicit `maxDuration` |
| [web/src/components/ToolGate.tsx](../web/src/components/ToolGate.tsx) | `activateOn` prop for deferred challenge; fire gate events |
| [web/src/components/ReCaptcha.tsx](../web/src/components/ReCaptcha.tsx) | Fire pass/fail events from `CaptchaGate`; preserve E2E bypass |
| [web/src/components/hire-me/JobContextBar.tsx](../web/src/components/hire-me/JobContextBar.tsx) | Default `barState` to `"expanded"`; fire open/abandon events |
| [web/src/app/page.tsx](../web/src/app/page.tsx) | Delete the "Book a Free 30-Min Consultation" section (lines 41–59); "Interview me NOW" becomes the sole primary CTA |
| [web/src/app/hire-me/page.tsx](../web/src/app/hire-me/page.tsx) | Cut intro copy; promote primary action; zero-input chat path; move `ToolGate` to action scope |
| `web/src/lib/analytics.test.ts` | Regression case for the A1 failure path |
| `web/src/components/ToolGate.test.tsx` | Cases for deferred activation |
| GA4 UI (not a file) | Register new custom dimensions — **not retroactive** |

Existing utilities to reuse rather than reinvent: `trackEvent` and
`sanitizeParams` in `analytics.ts` (already clamp to GA4's 100-char parameter
limit and no-op safely when gtag is absent), and `TrackedLink.tsx`, which already
wraps `trackCtaClick` / `trackContactClick` / `trackArtifactDownload` for link
markup.
