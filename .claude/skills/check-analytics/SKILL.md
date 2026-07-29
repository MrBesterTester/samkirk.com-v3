---
name: check-analytics
description: Report on Google Analytics 4 data for samkirk.com — visitor counts, traffic sources, top pages, custom click events, and the /hire-me tool funnel. Use whenever Sam asks how many people visited, where traffic came from, which pages or links get used, whether the hire-me tool is being completed or abandoned, or anything about on-site visitor behavior. For what people SEARCHED before arriving, use check-search-console instead — GA4 cannot answer that.
---

# Check Analytics

*Last updated: 2026-07-29 PST*

GA4 measures what happens **on** the site: arrival, navigation, clicks, and
completion. It cannot tell you what was typed into Google — that is
`check-search-console`.

## Quick reference

All commands run from the project root. Default window is the last 28 days.

```bash
python3 .claude/skills/check-analytics/scripts/ga4.py overview
```

| Command | What it answers |
|---|---|
| `overview` | Users, sessions, page views, engagement rate |
| `sources` | Where traffic comes from — `google / organic` is the SEO line |
| `pages` | Most-viewed pages |
| `events` | Every event by volume; custom ones are flagged with `*` |
| `clicks` | Which nav links and CTAs actually get clicked |
| `funnel` | **The /hire-me funnel** — visit → job loaded → run → download |
| `failures` | Failed generation runs, grouped by reason |
| `properties` | List GA4 properties (for `--property`) |

Flags: `--days N`, `--limit N`, `--property <numeric-id>`.

## One-time setup

Google **blocks** non-Cloud sensitive scopes on the shared Google Cloud SDK OAuth
client, so `gcloud auth application-default login --scopes=...analytics.readonly`
fails with "This app is blocked". The script instead impersonates a service
account granted Viewer on the GA4 property. No key file is downloaded.

The service account is **shared with `check-search-console`** — if that skill is
already set up, only step 3 below is new.

```bash
# 1. Enable the APIs
gcloud services enable analyticsdata.googleapis.com analyticsadmin.googleapis.com \
  iamcredentials.googleapis.com --project=samkirk-v3

# 2. Create the service account and grant Sam token-minting rights
#    (skip if check-search-console setup already did this)
gcloud iam service-accounts create seo-reporting \
  --display-name="SEO reporting (Search Console + GA4)" --project=samkirk-v3

gcloud iam service-accounts add-iam-policy-binding \
  seo-reporting@samkirk-v3.iam.gserviceaccount.com \
  --member=user:sam@samkirk.com \
  --role=roles/iam.serviceAccountTokenCreator --project=samkirk-v3
```

### ⚠ Two GA accounts share the name "samkirk.com"

Check the **account ID** in the GA4 account selector before granting anything:

| Account ID | What it is | Use it? |
|---|---|---|
| `376572742` | Holds the live `G-QPGLH8V5MM` property | **Yes** |
| `18083060` | Dormant 2010 Universal Analytics shell, zero GA4 properties | No |

Granting on `18083060` appears to succeed and then reports no properties, because
there are none. If `ga4.py properties` prints an account header with nothing
under it, this is why.

### ⚠ Grant Viewer on the PROPERTY, not Administrator on the ACCOUNT

Account-level Administrator is far more privilege than reporting needs, and it
carries a real hazard: **removing the last human administrator locks you out of
the account entirely.** That happened once on `18083060` — recovery was only
possible because the service account itself held admin and could re-grant access
via the API:

```bash
TOKEN=$(gcloud auth print-access-token \
  --impersonate-service-account=seo-reporting@samkirk-v3.iam.gserviceaccount.com \
  --scopes=https://www.googleapis.com/auth/analytics.manage.users)

# Inspect who currently has access (note: accessBindings is v1alpha, not v1beta)
curl -s -H "Authorization: Bearer $TOKEN" \
  https://analyticsadmin.googleapis.com/v1alpha/accounts/<ACCOUNT_ID>/accessBindings

# Re-grant a locked-out human
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"user":"sam@samkirk.com","roles":["predefinedRoles/admin"]}' \
  https://analyticsadmin.googleapis.com/v1alpha/accounts/<ACCOUNT_ID>/accessBindings
```

Keep at least two administrators on any GA account that matters.

**3. Grant it access in the GA4 UI** — cannot be scripted.

[Open GA4 Property access management](https://analytics.google.com/analytics/web/#/admin/suiteusermanagement/property)

→ **`+`** (top right) → **Add users** → paste the address below → role **Viewer**
→ **uncheck "Notify new users by email"** (service accounts have no inbox) → Add.

```
seo-reporting@samkirk-v3.iam.gserviceaccount.com
```

Verify with `ga4.py properties`. Override the account name with the
`SEO_SERVICE_ACCOUNT` environment variable if it is ever recreated.

The measurement ID in `web/src/lib/seo.ts` (`G-QPGLH8V5MM`) is **not** the
property ID the Data API needs. The script discovers the numeric ID from the
Admin API and caches it in `scripts/.property-id`; delete that file to re-detect.

### Registering custom dimensions (required for `clicks` and `failures`)

GA4 collects custom event parameters immediately, but will not let you *report*
on them until each is registered as a custom dimension. This is a one-time
click-through in the GA4 UI, not something the API can do:

[Open GA4 Custom definitions](https://analytics.google.com/analytics/web/#/admin/customdefinitions)
→ **Create custom dimension** → scope **Event**, for each parameter below.

| Dimension name | Event parameter | Used by |
|---|---|---|
| Link text | `link_text` | `clicks` |
| Nav location | `nav_location` | `clicks` |
| CTA ID | `cta_id` | `clicks` |
| Contact method | `method` | contact reporting |
| Artifact ID | `artifact_id` | download reporting |
| Run type | `run_type` | `funnel`, `failures` |
| Failure reason | `reason` | `failures` |

Until these are registered, `clicks` and `failures` return no rows even though
the data is arriving. `overview`, `sources`, `pages`, `events`, and `funnel`
work without them.

Registration is **not retroactive** — a dimension only reports data collected
after it was created, so do this early.

### Enhanced Measurement

Confirm [Data streams](https://analytics.google.com/analytics/web/#/admin/streams/table)
→ samkirk.com → **Enhanced measurement** is on. It
supplies `page_view`, `scroll`, outbound link clicks, and `file_download` with
no code. The custom events in `web/src/lib/analytics.ts` deliberately cover only
what Enhanced Measurement cannot see, so the two do not double-count.

## The custom events

Defined in [`web/src/lib/analytics.ts`](../../../web/src/lib/analytics.ts) — that
file is the single source of truth. Add an event there, then add it to
`CUSTOM_EVENTS` in `scripts/ga4.py` and register any new parameter as a custom
dimension.

| Event | Fired when |
|---|---|
| `nav_click` | Header/footer link clicked (`nav_location` distinguishes desktop/mobile/footer) |
| `cta_click` | Named in-page CTA clicked |
| `contact_click` | Calendar booking, LinkedIn, or mailto clicked |
| `artifact_download` | An exploration HTML write-up downloaded |
| `tool_job_loaded` | A job description was ingested on /hire-me |
| `tool_run_started` / `tool_run_completed` / `tool_run_failed` | Fit-report or resume generation |
| `tool_chat_message` | A free-form chat message sent |
| `tool_download` | The .zip artifact bundle downloaded |
| `tool_reset` | Conversation reset |

## Reading the funnel

`funnel` counts **users**, not events, so one person running two generations
counts once per stage. The stage that matters most is `tool_job_loaded` →
`tool_run_started`: a recruiter who pasted a job description and then left had
real intent and hit friction. A large drop there is a UX bug, not a traffic
problem.

Low absolute numbers at every stage mean the problem is upstream — that is a
Search Console question, not a GA4 one.

## Caveats

- **Ad blockers** suppress GA4 for a meaningful share of technical visitors.
  Treat counts as a floor, and trust *ratios* between stages more than absolutes.
- **Custom dimensions are not retroactive** (see above).
- GA4 applies data thresholds on low-volume segments and may withhold rows.

## Related

- `check-search-console` — what people searched before arriving
- `docs/SEO-ANALYTICS.md` — the working doc tracking this effort
