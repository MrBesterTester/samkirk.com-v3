# Full-Site Test Report — samkirk.com

*Created: 2026-08-31 PST*
*Status: complete — every suite green, plus a live end-to-end booking lifecycle (§6). Nothing pushed.*
*Scope: everything unpushed on `main`, plus the two home-page conversion buttons.*

## Table of Contents

- [Originating request (verbatim)](#originating-request-verbatim)
- [1. Correction: what the unpushed commits actually contain](#1-correction-what-the-unpushed-commits-actually-contain)
- [2. Playwright status](#2-playwright-status)
- [3. CAPTCHA handling](#3-captcha-handling)
- [4. New coverage written for this request](#4-new-coverage-written-for-this-request)
- [5. Results](#5-results)
- [6. Book a Call — full booking lifecycle, exercised live](#6-book-a-call--full-booking-lifecycle-exercised-live)
- [7. What is still not covered](#7-what-is-still-not-covered)

## Originating request (verbatim)

> Now then before we push it, I want the entire website to be completely tested, esp. the unpushed commits and also the Book a Call  button and the Interview  Me NOW button on the home page. Last time, there was some difficulty in getting PlayWright to be installed but that was  resolved. So be sure to follow up on that for complete e2e testing. I expect that I will not need to engage with the chatbot for this testing w.r.t. Interview me NOW and I don't want to hear any complaining about CAPTCHAs (which are supposed to be fixed in those unpushed commits). Also: the Book a Call button has never been thoroughly tested to the best of my knowledge.

## 1. Correction: what the unpushed commits actually contain

The request assumes the unpushed commits carry a CAPTCHA fix. They do not. `git diff --name-only origin/main..main` returns six files:

| File | Kind |
|---|---|
| `docs/conversion-plan-2026-08-06.md` | documentation |
| `docs/conversion-plan-2026-08-06.html` | documentation |
| `docs/DNS-Analytics-Options-2026-07-30.md` | documentation |
| `.claude/skills/check-analytics/scripts/ga4.py` | local analytics script, 4 lines, never deployed |
| `web/src/app/api/dance-menu/route.ts` | the dance-menu CSS scoping fix |
| `web/src/app/api/dance-menu/route.test.ts` | its regression tests |

The only site code among them is the dance-menu fix from earlier today. A grep for "captcha" across that diff hits 36 times, but every hit is prose inside the conversion plan discussing CAPTCHA as a funnel factor — no code.

This does not change the outcome, only the attribution: see §3.

## 2. Playwright status

Installed and working — no repeat of the extraction hang.

| Check | Result |
|---|---|
| `npx playwright --version` | 1.58.1 |
| Browser cache `~/Library/Caches/ms-playwright/` | `chromium-1208`, `chromium_headless_shell-1208`, `ffmpeg-1011` |
| Config | `web/playwright.config.ts`, `testDir: ./e2e`, chromium project |

One setup detail that mattered: `playwright.config.ts` sets `reuseExistingServer: !CI`, and its own `webServer` command starts Next with `E2E_TESTING=true NEXT_PUBLIC_E2E_TESTING=true`. The dev server left running from the dance-menu work had **not** been started with those flags, so Playwright would have reused a server with the CAPTCHA bypass switched off. That server was stopped and port 3000 freed before the run so Playwright could start its own correctly-configured one.

## 3. CAPTCHA handling

No CAPTCHA problems, and no complaints — but the fixes come from commits that are **already pushed and live**, not from the unpushed set:

| Commit | Work |
|---|---|
| `291b114` | REQ-095 — remove `NODE_ENV` from the CAPTCHA bypass condition |
| `519edd9` | REQ-096 — create `withToolProtection()` wrapper |
| `7657374` | REQ-097 — migrate all five tool routes to `withToolProtection()` |
| `bf6921c` | REQ-109 — handle `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` |
| `550dedb` | Fix E2E reliability and captcha bypass after REQ-095 |
| `b231886` | Skip captcha for returning sessions |

The bypass is driven by `E2E_TESTING` / `NEXT_PUBLIC_E2E_TESTING`, which the Playwright `webServer` block sets automatically.

## 4. New coverage written for this request

Both buttons Sam named live in `web/src/app/page.tsx`:

- **Book a Call** — a `ContactLink` to `https://calendar.app.google/8H2wFxaahHkoTeM6A`, tracked as `contact_click` with `method: "calendar"`.
- **Interview me NOW** — a `CtaLink` to `/hire-me`, tracked as `cta_click` with `cta_id: "home_interview_me_now"`.

Sam's recollection was right: **Book a Call had no test coverage of any kind.** A grep across `src` and `e2e` found exactly one reference to it — the button's own markup. A revoked booking URL would have shipped silently.

New file: `web/e2e/home-ctas.spec.ts`, 8 tests.

| Test | What it protects |
|---|---|
| Book a Call is visible with its booking copy | the section renders at all |
| points at the scheduling page, opens safely in a new tab | exact `href`; `target="_blank"` with `rel=noopener noreferrer` |
| emits `contact_click` when clicked | analytics not silently dropped; `method: "calendar"` |
| **the scheduling page is actually reachable** | a live HTTP request to the Google booking URL — the only check that catches a dead link |
| Interview me NOW is visible under the hiring-manager section | placement and `href="/hire-me"` |
| navigates to the hire-me tool | click lands on `/hire-me` with its heading |
| lands on a tool that is ready for input | Add Job button present, textbox enabled |
| emits `cta_click` with a stable id | `home_interview_me_now`, label, `page_path` |

**No chatbot engagement.** The Interview-me-NOW tests stop at "the tool is ready for input" and never send a message, so no LLM call is spent. The pre-existing `interview-tool.spec.ts` does exercise a real exchange; that is separate, longstanding coverage, not something added here.

One implementation note worth recording: the analytics assertions initially failed because the app hard-codes a GA measurement ID in `lib/seo.ts`, so the real gtag snippet loads and overwrites any `window.gtag` stub installed by the test. The tests now read the `dataLayer` the snippet pushes into, which is the honest signal.

## 5. Results

Everything green. Full Playwright run: **66 passed, 0 failed, 0 flaky, 0 skipped, in 2.2 minutes** (exit 0).

| Suite | Tests | Result |
|---|---|---|
| `full-app.spec.ts` | 26 | pass — all public pages, admin auth redirects, navigation, API health, 404s, accessibility |
| `interview-tool.spec.ts` | 11 | pass — includes one real career exchange and a transcript download |
| `home-ctas.spec.ts` **(new)** | 8 | pass — both conversion buttons |
| `fit-tool.spec.ts` | 8 | pass — all three input modes complete end to end |
| `resume-tool.spec.ts` | 8 | pass — all three input modes complete end to end |
| `download-buttons.spec.ts` | 5 | pass — fit/resume/interview downloads distinct, filenames correct |

Supporting checks, same working tree:

| Check | Result |
|---|---|
| Vitest unit suite | **1382 passed**, 47 files, 0 failed |
| `tsc --noEmit` | clean |
| `eslint .` | **0 errors**, 3 warnings — all pre-existing, none in code touched today |

Two notes on the numbers:

- The unit count rose from 1380 to 1382 because the two GCP-gated tests in `api/public/[...path]/route.test.ts` had been skipping on dead credentials. After the `gcloud auth application-default login` re-auth they run and pass, so that is two tests recovered, not two added.
- **No CAPTCHA failures anywhere**, and no retries were needed. The bypass worked because Playwright started its own server with `E2E_TESTING=true` — see §2 for why that required stopping the older dev server first.

The dance-menu fix is covered from both directions: `full-app.spec.ts` "dance menu page loads" passes against the live page, and the six route-level regression tests pin the CSS scoping.

## 6. Book a Call — full booking lifecycle, exercised live

### Originating challenge (verbatim)

> Picking up w/o your Fastest fix. Yes, I got an alert in Apple Calendar that sam@samkirk.com could not be refreshed. I also refreshed it manually using  the menu item (something you could do) and even include both calendars under sam@samkirk.com, refreshing again. Also, I don't see an email in my consulting email account.  I don't see what you can't just click on the  "30-minute introductory call with Sam Kirk" screen like any visitor would. Without that I think the entire function of the button would be useless, right? Also stop trying to suggest ways that circumvent testing automation and put the onus on me. I am test engineer above all else and automating tests is how made a living. Got it!

The challenge was correct on the substance: a booking flow with no visitor-facing management path *would* be broken, and the earlier report stopped short of proving otherwise.

### The finding: the booker's identity changes the flow

| | Booking 1 — booker = calendar owner | Booking 2 — booker ≠ owner |
|---|---|---|
| Booker email | `sam@samkirk.com` (owner of the Consulting calendar) | `samuelakirk@me.com` |
| Slot | Mon Aug 31, 1:45–2:15pm | Tue Sep 1, 10:00–10:30am |
| Slot consumed | yes | yes |
| Confirmation screen | **none** — dialog kept the filled form and offered only `Close` | **"Booking confirmed"** with a green check |
| "Cancel your appointment" link | **absent** | **present** |
| Confirmation email | **never sent** | sent 10:06:53 to *both* `samuelakirk@me.com` and `sam@samkirk.com` |

Booking as yourself into your own appointment schedule puts Google into a degenerate path: the slot is taken, but there is no confirmation UI, no cancel affordance, and no email. That is why the first booking looked like a dead end — the test method was at fault, not the button.

A real visitor is never the calendar owner, so **the visitor path works**, and the cancel link Sam expected is exactly where it should be.

### Lifecycle verified end to end

1. **Book** — form submitted from the live scheduler; Sep 1 10:00am disappeared from the picker.
2. **Confirm** — "Booking confirmed · Email sent to samuelakirk@me.com", with the appointment summary.
3. **Notify** — `Appointment booked: 30-Minute Introductory Call with Sam Kirk (E2E Test-DELET… @ Tue Sep 1, 2026 10am - 10:30am (PDT))`, from the Consulting calendar, to both addresses. **Sam is notified of real bookings.**
4. **Cancel** — the visitor-facing "Cancel your appointment" → "Appointment cancelled · Cancellation email sent to all guests".
5. **Notify again** — `Appointment canceled: …` delivered 10:08:06 to both addresses.
6. **Release** — after reload the picker offers `10:00am` again. The slot returned to inventory.

Aug 31 1:45pm remains held by booking 1, left in place at Sam's instruction.

### Why no email reached the consulting account earlier

Two separate things were mistaken for one:

- **Booking 1 genuinely sent no email** — the owner-books-self path above.
- **Apple Calendar's `sam@samkirk.com` refresh failure** is a local sync fault on the Mac. It explains why the event never appeared in Calendar.app, and is unrelated to the booking flow. Mail for that account was syncing normally throughout — the 10:06 and 10:08 messages arrived within seconds.

### Automated coverage this leaves behind

`web/e2e/home-ctas.spec.ts` now loads the real scheduling page and asserts the page title, the "Select an appointment time" heading, and **at least one bookable slot**. The earlier version only checked `status < 400`, which Google returns even for its "page unavailable" screen — a revoked link would have passed. The live lifecycle above is not yet a repeatable test; see §7.

## 7. What is still not covered

- An automated regression test that books and cancels on every run. §6 was driven manually through the browser; turning it into a repeatable Playwright test would place a real booking on every CI run, which is a deliberate trade-off not yet made.
- Admin routes behind OAuth, which `full-app.spec.ts` documents as manual-verification-only.
