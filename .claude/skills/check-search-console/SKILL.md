---
name: check-search-console
description: Report on Google Search Console data for samkirk.com — what people actually searched before seeing or clicking the site, which pages earn impressions, and which queries are close enough to page 1 to be worth optimizing. Use whenever Sam asks what people are searching for, how the site ranks, why traffic changed, which keywords to target, or anything about SEO performance, impressions, click-through rate, or search position. This is the ONLY source for real search queries — Google Analytics structurally cannot provide them.
---

# Check Search Console

*Last updated: 2026-07-29 PST*

Search Console is Google's own server-side log of every query that surfaced
samkirk.com in results. It is the authoritative answer to "what were people
searching for?" — a question GA4 cannot answer at all, because Google stripped
query terms out of the referrer in 2011.

## Quick reference

All commands run from the project root. Default window is the last 28 days.

```bash
python3 .claude/skills/check-search-console/scripts/gsc.py queries
```

| Command | What it answers |
|---|---|
| `sites` | Which properties this Google account can read |
| `queries` | **What people searched** — clicks, impressions, CTR, position |
| `pages` | Which landing pages earn search traffic |
| `opportunities` | Queries ranking 5–20 with real volume — the cheapest wins |
| `zero-click` | Queries with impressions but no clicks — a title/meta problem |
| `countries` / `devices` | Where and how visitors search |

Flags: `--days N` (window), `--limit N` (rows), `--site <property>`.

`opportunities` also takes `--min-position`, `--max-position`, `--min-impressions`.
`zero-click` takes `--min-impressions`.

## One-time setup

The site is verified as a **domain property** (`sc-domain:samkirk.com`) via two
`google-site-verification` TXT records on the apex domain, so the property covers
every subdomain automatically.

### Why a service account

Google **blocks** non-Cloud sensitive scopes on the shared Google Cloud SDK OAuth
client. This command does not work and never will:

```
gcloud auth application-default login --scopes=...webmasters.readonly    # "This app is blocked"
```

The script therefore impersonates a service account that has been granted read
access to the property. No key file is downloaded — tokens are minted on demand
through the IAM Credentials API.

### Steps

```bash
# 1. Enable the APIs
gcloud services enable searchconsole.googleapis.com iamcredentials.googleapis.com --project=samkirk-v3

# 2. Create the reporting service account (shared with check-analytics)
gcloud iam service-accounts create seo-reporting \
  --display-name="SEO reporting (Search Console + GA4)" --project=samkirk-v3

# 3. Let Sam mint tokens as it
gcloud iam service-accounts add-iam-policy-binding \
  seo-reporting@samkirk-v3.iam.gserviceaccount.com \
  --member=user:sam@samkirk.com \
  --role=roles/iam.serviceAccountTokenCreator --project=samkirk-v3
```

**4. Grant it access in the Search Console UI** — this step cannot be scripted.

[Open Users and permissions for sc-domain:samkirk.com](https://search.google.com/search-console/users?resource_id=sc-domain%3Asamkirk.com)

→ **Add user** → paste the address below → permission **Full** → Add.

```
seo-reporting@samkirk-v3.iam.gserviceaccount.com
```

Verify with `gsc.py sites` — it should list `sc-domain:samkirk.com`.

The service account email can be overridden with the `SEO_SERVICE_ACCOUNT`
environment variable if it is ever recreated under a different name.

### If token minting fails

The script diagnoses the common cases itself. In general: `gcloud auth login`
covers user credentials for impersonation (this path does **not** use
application-default credentials, so a stale ADC does not matter here).

## Reading the output

**Position** is the average rank across all impressions. Position 1–3 captures
the large majority of clicks; by position 8–10 the click share is small, and
past 10 (page 2) it is close to nothing. This is why `opportunities` exists:
a query sitting at 12 with 200 impressions is worth far more attention than a
brand-new keyword, because Google has already judged the page relevant.

**Impressions without clicks** is a different diagnosis entirely. If position is
good (< 10) but CTR is near zero, the ranking is fine and the *title tag and meta
description* are the problem — that is a copy fix in `web/src/app/**/page.tsx`
metadata, not a content or backlink problem.

**The ~2-day lag** is real: Search Console data is not final for about 48 hours.
The scripts already shift the window back by 2 days so the last bucket does not
look like a cliff. Do not "fix" an apparent recent drop-off without checking
whether it is just the lag.

## Turning findings into changes

When a query looks worth pursuing, the edits usually land in:

- `web/src/lib/seo.ts` — the shared `KEYWORDS` list and site description
- `web/src/app/<route>/page.tsx` — that page's `metadata` title and description
- `web/src/app/sitemap.ts` — if a page is missing from the sitemap entirely
- The page's `<h1>` and opening paragraph, which should use the actual phrasing
  people search, not internal jargon

Do not stuff keywords. One clear title, one honest description, and body copy
that genuinely covers the topic outperforms keyword density every time.

## Related

- `check-analytics` — the GA4 side: what people DO once they arrive
- `docs/SEO-ANALYTICS.md` — the working doc tracking this effort
