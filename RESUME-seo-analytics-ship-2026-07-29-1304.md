# RESUME — SEO Analytics Instrumentation + Iframe Fix (ready to ship)

**Saved:** 2026-07-29 13:04 PDT (Pacific)
**Purpose:** Paste the block below into a clean Claude Code session to continue where this one left off.
**State at save time:** 4 commits sit local on `main`, unpushed. All local gates pass except the Playwright E2E suite, which cannot run because the machine's Playwright browser cache is corrupt and downloads hang. Sam was about to restart the Mac to clear stuck disk I/O.

---

## Paste this into a new session

```text
CONTEXT
I'm Sam Kirk. samkirk.com is my consulting/portfolio site (Next.js, deployed on Vercel via
GitHub Actions CI). Goal: increase organic search traffic (SEO). In the previous session we
built GA4 click instrumentation, two reporting skills (Search Console + GA4), and fixed a
major SEO defect where page content was hidden inside iframes. Everything is committed
LOCALLY but NOT pushed. The only thing blocking the push is that the Playwright E2E suite
cannot run on this machine.

ORIENT FIRST — read these, in this order:
1. /Users/sam/Projects/ClaudeProjects/samkirk-v3/docs/SEO-ANALYTICS.html
   The working report (HTML — Sam wants it kept in HTML from here on, NOT markdown).
   Open it with: open -a Safari docs/SEO-ANALYTICS.html
2. git log --oneline -5   (the 4 unpushed commits are described below)
3. /Users/sam/Projects/ClaudeProjects/samkirk-v3/.claude/skills/check-search-console/SKILL.md
4. /Users/sam/Projects/ClaudeProjects/samkirk-v3/.claude/skills/check-analytics/SKILL.md

STATE — what is already done and verified

The 4 unpushed commits on main (oldest first):
  bf3c93d  feat(analytics): GA4 click instrumentation + Search Console/GA4 reporting skills
  bbb51ad  fix(seo): server-render static write-ups instead of iframing them
  299a265  docs(seo): retire SEO-ANALYTICS.md — superseded by the HTML report
  c3c870b  fix(seo): drop the embedded heading only when it repeats the page heading

Google setup — ALL DONE, no further setup needed:
- Search Console: verified domain property `sc-domain:samkirk.com`, permission siteFullUser.
- GA4: property 525472559, account 376572742 (named "sam@samkirk.com"),
  measurement ID G-QPGLH8V5MM, stream "SAK Consulting".
- Service account `seo-reporting@samkirk-v3.iam.gserviceaccount.com` has Search Console
  "Full" + GA4 "Viewer". Sam has roles/iam.serviceAccountTokenCreator on it.
  APIs enabled: searchconsole, analyticsdata, analyticsadmin, iamcredentials.
- All 7 GA4 custom dimensions registered 2026-07-29: link_text, nav_location, cta_id,
  method, artifact_id, run_type, reason. (GA4 UI path: Admin -> Data display ->
  Custom definitions. NOT directly under Admin.)
- Enhanced Measurement confirmed ON (scrolls, outbound clicks, file downloads, site search,
  form interactions).

Reporting commands that WORK right now:
  python3 .claude/skills/check-search-console/scripts/gsc.py queries --days 90
  python3 .claude/skills/check-search-console/scripts/gsc.py opportunities --days 90
  python3 .claude/skills/check-analytics/scripts/ga4.py overview
  python3 .claude/skills/check-analytics/scripts/ga4.py funnel
(Flags work on either side of the subcommand. Pure-stdlib Python, no pip deps. They
impersonate the service account via `gcloud auth print-access-token
--impersonate-service-account=...` — do NOT try `gcloud auth application-default login
--scopes=...webmasters.readonly`; Google blocks non-Cloud sensitive scopes on the shared
Cloud SDK OAuth client with "This app is blocked".)

Verification already completed (do not redo unless code changes):
- 1,374 unit tests pass (vitest). 34 of them cover the new CSS scoper + heading dedupe.
- npx tsc --noEmit: clean. eslint: clean.
- npm run build: succeeds, every page still statically prerendered.
- IN A REAL BROWSER on localhost:3000 (production build), confirmed:
  * nav_click, cta_click, artifact_download all fire with correct payloads
  * KaTeX renders 60 elements on /computer-diagnostics/physics-of-lora, 0 raw $...$ left
  * 0 iframes remain on all 8 converted pages
  * heading dedupe worked: math-physics-guide and physics-of-lora now have 1 <h1>;
    the other 6 pages correctly keep their 2 (their embedded headings differ and add info)
- gitleaks detect --source . : no leaks, 363 commits scanned.

THE ONE BLOCKER — Playwright E2E cannot run:
- The macOS Playwright browser cache is CORRUPT. `chromium-1208` exists but its
  "Google Chrome for Testing Framework" binary is missing, so it aborts with SIGABRT.
  `chromium_headless_shell-1208` is absent entirely.
- Two separate `playwright install` attempts HUNG (one for 3.5 hours) and had to be killed.
  One browser process was unkillable (kill EPERM) — suggests stuck disk I/O.
- Network is NOT the problem: measured 35.4 MB/s from Cloudflare, DNS 23ms, Playwright CDN
  reachable. A 190 MB download should take ~6 seconds.
- Sam was going to RESTART THE MAC to clear the stuck I/O state.
- Cleanup already done: stray wrong-version chromium-1223 removed (531 MB freed), __dirlock
  cleared, hung processes killed.

DO THIS NEXT

1. Ask Sam whether he restarted the Mac. Then repair Playwright with the PROJECT-LOCAL
   binary (NOT npx — npx resolves to latest Playwright and downloads build 1223, which is
   the WRONG version and wasted 531 MB last time; the project pins Playwright 1.58.1 ->
   build 1208):

   cd /Users/sam/Projects/ClaudeProjects/samkirk-v3/web \
     && rm -rf /Users/sam/Library/Caches/ms-playwright/chromium-1208 \
     && ./node_modules/.bin/playwright install chromium

   Verify this file exists and is executable afterward:
   /Users/sam/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell

2. If the install hangs again (>10 min with no growth in the cache dir), STOP and tell Sam.
   Next suspect is security/endpoint software or a proxy interfering with
   playwright.download.prss.microsoft.com — a restart will not fix that. Do not burn more
   time; ask him how he wants to proceed.

3. Once the browser installs, run the full suite IN THE BACKGROUND (project convention):
   cd web && npm run test:all -- --no-gcp
   (--no-gcp skips the real-LLM and GCP smoke suites, which cost money and are unrelated to
   these changes. Unit + Playwright E2E is what matters here.)
   NOTE: if you ran `next build` beforehand, `rm -rf web/.next` first — Playwright's
   webServer runs `next dev`, and a production .next cache causes ERR_ABORTED.

4. If E2E is GREEN: finish the ship —
   git push origin main
   then monitor CI: gh run list --limit 1 --json status,conclusion,url,databaseId
   CI jobs: build-and-test + security-scan (parallel), then deploy (vercel prebuilt --prod).
   Vercel git auto-deploy is disabled; production deploys go exclusively through CI.
   On failure: gh run view <run-id> --log-failed, report, and STOP.
   After deploy, confirm the site loads and report the deployment URL.

5. If E2E is RED: read the failures carefully. Distinguish real regressions in the changed
   code from environmental failures. Report to Sam and STOP — do not push a red suite.

6. AFTER a successful deploy, the SEO work continues. Highest-value remaining items:
   a. Create the free Ahrefs Webmaster Tools account (verify via the existing Google Search
      Console connection — takes ~5 min, no payment method). Search Console reports neither
      search volume nor keyword difficulty and is blind to terms the site doesn't yet rank
      for; Ahrefs fills exactly that gap. Treat its numbers as estimates — Search Console is
      ground truth where they disagree.
   b. Re-measure in ~4 weeks: gsc.py queries --days 90 and gsc.py opportunities.
      Organic search moves slowly; don't read week-to-week noise as signal.

BASELINE (90 days, captured 2026-07-29) — so you can tell if things improve:
  Page                      Clicks  Impressions  Position
  /                              6          262      14.9
  /hire-me                       1           16       4.6
  photo-fun.samkirk.com          0           41      39.9
  /explorations                  0           25      11.5
  Total: 7 clicks / 350 impressions.
  IMPORTANT: the query-dimension report shows only 126 impressions and 0 clicks because
  Search Console withholds low-volume queries; clicks on withheld queries vanish from that
  view. ALWAYS use page-level figures for totals; treat the query list as a sample.
  Top visible queries: "sam kirk" (38 impr, pos 32.9), "samuel kirk" (25, 26.7).
  GA4 28d: 34 active users, 86 sessions, 129 page views, 37.2% engagement.

CONVENTIONS — honor these
- Report format: docs/SEO-ANALYTICS.html is HTML from here on. Do NOT convert back to
  markdown. Include a PST/PDT timestamp near the top and a clickable Table of Contents.
- Sam is COLOR-BLIND. Never red-vs-green. Use the blue/orange house palette
  (--blue:#1f6feb / --orange:#e8710a), never encode by color alone (always add a text label
  or marker shape), and NEVER use background patterns/hatching. Highlight with a solid
  accent border + pale tint.
- Graphics in HTML reports: inline SVG by default; JPEG only for photographic images.
- Sam relies on end-of-turn bullet/table RECAPS — always produce one for any turn with a
  tangible deliverable. Never suggest disabling them. Keep chat free of file-by-file tool
  narration; batch edits to minimize diff spam.
- git: push directly to main, no squash, no intermediate branches. Run
  `gitleaks detect --source .` before pushing. This repo DOES have a GitHub remote
  (github.com/MrBesterTester/samkirk.com-v3) — that is expected and correct for samkirk-v3.
- Every deliverable must be locatable: state the full path, or make it TOC-linked.
- Don't fan out subagents unless the parallelism clearly pays for itself.
- Never enter credentials or authenticate on Sam's behalf; hand sign-in steps back to him.
```

---

## Notes

- **Default next action if Sam is ambiguous:** repair Playwright, run `npm run test:all -- --no-gcp`,
  and if green, push. He explicitly chose "kill the stuck install, then run E2E" over
  "push without E2E," so don't push on a red or unrun suite without asking again.
- **Open question:** whether the restart actually fixed the stuck I/O. If `playwright install`
  hangs a third time, stop chasing it — it's very likely endpoint-security or proxy
  interference with `playwright.download.prss.microsoft.com`, which no amount of retrying
  fixes. That's a Sam-side investigation.
- **Known-good escape hatch:** everything except E2E regression coverage is already verified,
  including direct in-browser confirmation of every behavior that changed. If Sam later
  decides E2E isn't worth unblocking, pushing is defensible — just say plainly that the E2E
  gate was skipped and why.
- **Gotcha — two GA accounts share the name "samkirk.com".** Account `376572742` (display
  name "sam@samkirk.com") holds the real property. Account `18083060` is a dormant 2010
  Universal Analytics shell with zero GA4 properties. Only the numeric ID distinguishes them.
  Earlier in the session, granting on the wrong one and then deleting the last human admin
  locked Sam out; recovery required the service account's own admin rights via the
  **v1alpha** accessBindings endpoint (v1beta 404s). Sam now has admin restored on both.
- **Gotcha — GA4 deep links need the property segment.** Working form:
  `https://analytics.google.com/analytics/web/?authuser=1#/a376572742p525472559/admin/...`
  Sam's Chrome default Google account is NOT sam@samkirk.com, so always pin `authuser=1`
  or links silently resolve against the wrong account.
- **Cosmetic items Sam deliberately declined:** the embedded write-ups render inside a
  nested "framed document" container, and 6 pages still have 2 `<h1>` elements (their
  embedded headings differ and carry real information). He reviewed both and chose to keep
  them. Multiple H1s are not an SEO problem. Don't "fix" these unprompted.
- **Optional background** (not required to resume): `docs/SEO.md` is the older 2026 SEO
  setup doc; `docs/GCP-DEPLOY.md` Step 12 covers the original GA4 property creation.
