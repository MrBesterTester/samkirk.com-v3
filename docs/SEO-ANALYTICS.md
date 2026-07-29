# SEO & Analytics — samkirk.com

*Last updated: 2026-07-29 PST*

Working doc for the effort to increase visitor traffic to samkirk.com through
search engine optimization, and the measurement infrastructure that tells us
whether it is working.

## Table of Contents

- [Originating request (verbatim)](#originating-request-verbatim)
- [The goal](#the-goal)
- [Which tool answers which question](#which-tool-answers-which-question)
- [Search Console verification status](#search-console-verification-status)
- [What was built](#what-was-built)
  - [Custom event instrumentation](#custom-event-instrumentation)
  - [Reporting skills](#reporting-skills)
- [Setup still required from Sam](#setup-still-required-from-sam)
- [GA4 account hazards — read before granting access](#ga4-account-hazards--read-before-granting-access)
- [On Ahrefs free](#on-ahrefs-free)
- [Current SEO baseline](#current-seo-baseline)
- [Next steps](#next-steps)

---

## Originating request (verbatim)

> I would now like to consider upgrading the search activity analysis on samkirk.com using my current Google account to get finer details of what's being clicked on. My understanding is that this takes additional instrumentation in the code so that the web page click can report back to Google Analytics exactly what was clicked on.
>
> I would also like to know if the free service at https://ahrefs.com/free can actually tell me what users were searching for when they happened to click on my website. Is this something that Google Analytics cannot do?

> My main intent is to improve the number of visitors I get to my website, i.e., what I understand to be Search Engine Optimization (SEO). check if Search Console is verified, then build the instrumentation. I will also need some workflows in the form of skills to check the analytics and the search console.

---

## The goal

Increase organic search traffic to samkirk.com. Everything below is either a
measurement capability that tells us where the traffic is or is not coming from,
or a change made in response to that measurement.

The measurement work is not the goal — it is the feedback loop that makes the
SEO work non-guesswork.

---

## Which tool answers which question

The single most important distinction in this whole effort, because conflating
these two wastes a lot of time:

| Question | Tool | Why |
|---|---|---|
| What did people type into Google before clicking? | **Search Console** | Google's own server-side query log. Exact, free. |
| What did they do once they arrived? | **Google Analytics 4** | On-site behavior: pages, clicks, funnel completion. |
| What terms *could* I rank for, and how hard? | Ahrefs free | Estimated from Ahrefs' own SERP crawl, not from real visitors. |

**GA4 structurally cannot report search queries.** Google stripped query terms
out of the HTTP referrer in 2011 (the "(not provided)" change) and finished the
job in 2013. No amount of instrumentation recovers this, because the data never
reaches the page. This is not a configuration gap.

---

## Search Console verification status

**Verified**, as a domain property.

Two `google-site-verification` TXT records are live on the apex domain:

```
google-site-verification=3SrHif1VVivXbqNPSugAP2X2MEDjMWav1T6-BQYJ6h4
google-site-verification=uCryfJG8tceSefMpNlvffaDHRHfjrD_jZ-6lwiJN6wo
```

Domain-property verification via DNS covers every subdomain automatically, so
`photo-fun.samkirk.com` and `tensor-logic.samkirk.com` are included without
separate setup. The property identifier is `sc-domain:samkirk.com`.

Two tokens rather than one usually means a property was verified twice (or an
older one was never cleaned up). Harmless — but worth confirming in the GSC UI
which property is actually receiving data before relying on historical numbers.

*Caveat on this check:* the DNS records confirm the verification tokens are
published. Confirming the property is actively collecting requires either the
GSC UI or an authenticated API call, which is blocked until the auth step below
is done. Running `gsc.py sites` after auth will settle it definitively.

---

## What was built

### Custom event instrumentation

GA4's Enhanced Measurement already covers `page_view`, `scroll`, outbound link
clicks, and `download=` file downloads with zero code. The instrumentation added
here deliberately covers **only what Enhanced Measurement cannot see**, so the
two never double-count.

| File | Role |
|---|---|
| [`web/src/lib/analytics.ts`](../web/src/lib/analytics.ts) | Single source of truth: event names + typed helpers. No-ops safely when gtag is absent. |
| [`web/src/lib/analytics.test.ts`](../web/src/lib/analytics.test.ts) | 21 unit tests covering truncation, undefined-stripping, and the no-gtag path. |
| [`web/src/components/TrackedLink.tsx`](../web/src/components/TrackedLink.tsx) | `CtaLink` / `ContactLink` / `DownloadLink` — client wrappers that let server components stay server-rendered. |
| [`web/src/components/Header.tsx`](../web/src/components/Header.tsx) | Nav clicks, desktop and mobile distinguished. |
| [`web/src/components/Footer.tsx`](../web/src/components/Footer.tsx) | LinkedIn + mailto (mailto is *not* covered by Enhanced Measurement). |
| [`web/src/app/page.tsx`](../web/src/app/page.tsx) | Home CTAs, including the consultation booking link. |
| [`web/src/hooks/useHireMe.ts`](../web/src/hooks/useHireMe.ts) | The full /hire-me funnel, instrumented at the hook — the single chokepoint. |
| 4 × `web/src/app/explorations/*/page.tsx` | Artifact downloads, keyed by a stable `artifactId` rather than filename. |

Events: `nav_click`, `cta_click`, `contact_click`, `artifact_download`,
`tool_job_loaded`, `tool_run_started`, `tool_run_completed`, `tool_run_failed`,
`tool_chat_message`, `tool_download`, `tool_reset`.

The highest-value signal here is the /hire-me funnel. A recruiter who pastes a
job description and then abandons had real intent and hit friction — that is a
fixable UX problem, and it was previously invisible because the tool's downloads
are JS-built blob URLs that automatic tracking cannot see.

### Reporting skills

Two project skills, both pure-stdlib Python against the REST APIs — no pip
dependencies to install or keep current.

| Skill | Commands |
|---|---|
| [`check-search-console`](../.claude/skills/check-search-console/SKILL.md) | `queries`, `pages`, `opportunities`, `zero-click`, `countries`, `devices`, `sites` |
| [`check-analytics`](../.claude/skills/check-analytics/SKILL.md) | `overview`, `sources`, `pages`, `events`, `clicks`, `funnel`, `failures`, `properties` |

The two SEO-specific reports worth calling out:

- **`opportunities`** — queries ranking position 5–20 with real impression
  volume. Google already considers the page relevant; moving one of these up is
  far cheaper than ranking a brand-new term.
- **`zero-click`** — queries with impressions but no clicks. If position is good
  and CTR is near zero, the title tag and meta description are the problem, not
  the ranking.

---

## Setup still required from Sam

### Why not personal-account OAuth

The obvious approach — adding the Search Console and Analytics scopes to
`gcloud auth application-default login` — **does not work**. Attempting it
returns:

> This app is blocked. This app tried to access sensitive info in your Google
> Account. To keep your account safe, Google blocked this access.

That command uses Google's shared "Google Cloud SDK" OAuth client, which Google
restricts to Cloud scopes. Adding `webmasters.readonly` or `analytics.readonly`
trips the block. This is a platform restriction, not a misconfiguration.

Two escape hatches exist. Registering a private OAuth client via
`--client-id-file` keeps everything on the personal account, but an unverified
External app in Testing status expires refresh tokens every **7 days** — a bad
fit for a workflow run monthly. So the chosen path is a **service account with
impersonation**: no key file on disk, no token expiry, tokens minted on demand
through the IAM Credentials API.

### Steps

Run these (they can go in any terminal — impersonation uses `gcloud auth login`
credentials, which are already valid; the stale application-default credentials
are irrelevant to this path):

```bash
gcloud services enable searchconsole.googleapis.com analyticsdata.googleapis.com analyticsadmin.googleapis.com iamcredentials.googleapis.com --project=samkirk-v3
```

```bash
gcloud iam service-accounts create seo-reporting --display-name="SEO reporting (Search Console + GA4)" --project=samkirk-v3
```

```bash
gcloud iam service-accounts add-iam-policy-binding seo-reporting@samkirk-v3.iam.gserviceaccount.com --member=user:sam@samkirk.com --role=roles/iam.serviceAccountTokenCreator --project=samkirk-v3
```

Then three UI steps that cannot be scripted. The address to paste in steps 1
and 2 is the same:

```
seo-reporting@samkirk-v3.iam.gserviceaccount.com
```

**1. Search Console — grant property access.**
[Open Users and permissions for sc-domain:samkirk.com](https://search.google.com/search-console/users?resource_id=sc-domain%3Asamkirk.com)
→ **Add user** → paste the address → permission **Full** → Add.

**2. GA4 — grant property access.**
[Open GA4 Property access management](https://analytics.google.com/analytics/web/#/admin/suiteusermanagement/property)
→ **`+`** (top right) → **Add users** → paste the address → role **Viewer** →
**uncheck "Notify new users by email"** (service accounts have no inbox) → Add.

**3. GA4 — register custom dimensions.**
[Open GA4 Custom definitions](https://analytics.google.com/analytics/web/#/admin/customdefinitions)
→ **Create custom dimension** → scope **Event**. Repeat once per parameter:

| Dimension name | Event parameter |
|---|---|
| Link text | `link_text` |
| Nav location | `nav_location` |
| CTA ID | `cta_id` |
| Contact method | `method` |
| Artifact ID | `artifact_id` |
| Run type | `run_type` |
| Failure reason | `reason` |

Custom dimensions are **not retroactive** — a dimension only reports data
collected after it was created, so this is worth doing before the instrumentation
ships.

**Also confirm Enhanced Measurement is on:**
[Open GA4 Data streams](https://analytics.google.com/analytics/web/#/admin/streams/table)
→ the samkirk.com stream → **Enhanced measurement** toggle.

*Note on the GA4 links:* GA4 has no stable per-property deep-link format without
the numeric account and property IDs (which we cannot read until step 2 is done).
These land on the admin section for whichever property was last opened — if the
wrong one loads, switch it with the property selector at the top.

---

## GA4 account hazards — read before granting access

Two problems surfaced during setup on 2026-07-29. Both are recorded here because
neither is discoverable from the GA4 UI.

### Two GA accounts are both named "samkirk.com"

| Account ID | What it is | Use it? |
|---|---|---|
| `376572742` | Holds the live `G-QPGLH8V5MM` property | **Yes** |
| `18083060` | Dormant Universal Analytics shell created 2010-08-19, zero GA4 properties | No |

The names are identical, so the **account ID in the selector is the only way to
tell them apart**. Granting access on `18083060` appears to succeed and then
reports nothing, because the account contains no properties.

`MrBesterTester@gmail.com` appearing as a user on `18083060` is not an error —
that account dates to 2010, long before the Google Workspace under samkirk.com,
and was created under the personal Gmail of the era.

### Removing the last administrator locks you out

Granting the service account **Administrator at the account level** (rather than
Viewer on the property) and then deleting the only human administrator removed
all human access to `18083060`.

Recovery worked only because the service account itself held admin and could
re-grant access through the API — `accessBindings` lives in **v1alpha**, not
v1beta:

```bash
TOKEN=$(gcloud auth print-access-token \
  --impersonate-service-account=seo-reporting@samkirk-v3.iam.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/analytics.manage.users)

curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"user":"sam@samkirk.com","roles":["predefinedRoles/admin"]}' \
  https://analyticsadmin.googleapis.com/v1alpha/accounts/18083060/accessBindings
```

Two rules follow: grant the service account **Viewer on the property**, never
Administrator on the account; and keep **at least two administrators** on any GA
account that matters.

---

## On Ahrefs free

Ahrefs Webmaster Tools (the free tier at `ahrefs.com/free`) gives verified site
owners: Site Explorer limited to 1K keywords/backlinks visible at once, Site
Audit with 5K crawl credits/month, and Web Analytics. Own sites only — no
competitor lookups.

It reports keywords the site **ranks for**, derived from Ahrefs' own crawl of
Google's results plus clickstream modeling, with search volume and keyword
difficulty attached. That is an **estimate about the search results page**, not
a record of actual visitors.

So it does not answer "what were users searching when they clicked my site" —
Search Console does, exactly and for free. Ahrefs free is still worth verifying
the domain for, because volume and difficulty numbers are genuinely useful for
deciding *which* terms to pursue, and Search Console does not provide those. Use
it as a complement, not a substitute.

---

## Current SEO baseline

Already in place and in reasonable shape:

- `web/src/app/sitemap.ts` — 17 URLs with priorities and change frequencies
- `web/src/app/robots.ts` — allows all, disallows `/admin/` and `/api/`
- JSON-LD structured data in `layout.tsx`: Person, WebSite, ProfilePage
- Per-page `metadata` with Open Graph tags
- `web/src/lib/seo.ts` — shared `KEYWORDS`, description, OG image

Not yet assessed (needs post-auth data): actual ranking positions, which pages
earn impressions, whether titles and descriptions match real search phrasing.

---

## Next steps

1. Sam completes the three setup steps above.
2. Run `gsc.py sites` to confirm the property is live and collecting, and
   resolve the two-verification-token question.
3. Run `gsc.py queries --days 90` and `gsc.py opportunities` to establish a
   baseline of what the site currently ranks for.
4. Rewrite titles and meta descriptions for the highest-impression pages based
   on real query phrasing rather than assumed keywords.
5. Verify the domain in Ahrefs free for volume/difficulty on candidate terms.
6. Re-measure after ~4 weeks — organic search moves slowly.
