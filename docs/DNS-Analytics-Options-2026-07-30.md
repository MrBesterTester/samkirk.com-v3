# DNS-Level Analytics for samkirk.com — Does Microsoft Offer Anything?

**Created:** July 30, 2026 10:45 PST | **Revised:** July 30, 2026 11:57 PST — added [Publishing DKIM and DMARC](#publishing-dkim-and-dmarc-for-samkirkcom) and [Vercel Analytics + Speed Insights](#vercel-analytics--speed-insights-for-later) | **Domain:** samkirk.com | **Authoritative DNS (Domain Name System):** Microsoft 365 (`ns1–ns4.bdm.microsoftonline.com`) | **Hosting:** Vercel

**Short answer: No.** Microsoft's DNS for samkirk.com has no analytics surface at all, and even the Microsoft product that *does* have DNS metrics offers far less than Cloudflare — and nothing that GA4 (Google Analytics 4) and Search Console aren't already covering better. There is, however, a genuinely useful gap-filler that isn't Microsoft or Cloudflare: **Vercel Analytics**. See [What Would Actually Add Signal](#what-would-actually-add-signal).

**Two follow-on sections were added on July 30.** The DNS-analytics conclusion above is settled and unchanged; what follows it now is the actual work that came out of it — [publishing DKIM and DMARC](#publishing-dkim-and-dmarc-for-samkirkcom) (do this), and [Vercel Analytics + Speed Insights](#vercel-analytics--speed-insights-for-later) (deferred, documented so it isn't re-researched later).

---

## Table of Contents

1. [Originating Request (verbatim)](#originating-request-verbatim)
2. [Why This Question Came Up](#why-this-question-came-up)
3. [What DNS You Are Actually Running](#what-dns-you-are-actually-running)
4. [Microsoft's Three DNS Products — What Each Reports](#microsofts-three-dns-products--what-each-reports)
5. [What Cloudflare Would Give You (and the Catch)](#what-cloudflare-would-give-you-and-the-catch)
6. [Why DNS Analytics Are Weak Analytics Anyway](#why-dns-analytics-are-weak-analytics-anyway)
7. [What Would Actually Add Signal](#what-would-actually-add-signal)
8. [Publishing DKIM and DMARC for samkirk.com](#publishing-dkim-and-dmarc-for-samkirkcom)
9. [Vercel Analytics + Speed Insights (for later)](#vercel-analytics--speed-insights-for-later)
10. [Recommendation](#recommendation)
11. [Sources](#sources)

---

## Originating Request (verbatim)

> Please also research if MS does an analysis via DNS similar to Cloudflare which would add something above and beyond the work we did yesterday with Google Analytics and Google Console Search in samkirk-v3. Hmmm... really should have this conversation in samkirk-v3.

> Yes, work up the DMARC and DKIM setup, adding to the doc in samkirk-v3 as background task.  I understand that DNS analytics isn't worthwhile so let's forget about that.  Please now coach on the registration migration so we can get that done and over with. Please also include the Vercel Analytics + Speed insights for later.

*(Recorded here per the second half of that request — this is the samkirk-v3 side of a conversation that started in MyFinancialAdvisor over the Network Solutions → Porkbun registrar migration. The registrar/fee half stays there; see `~/Projects/ClaudeProjects/MyFinancialAdvisor/Porkbun-Migration-Guide-2026-07-30.md`.)*

---

## Why This Question Came Up

While evaluating registrars for the samkirk.com transfer, Cloudflare Registrar came up and was **rejected** — it mandates Cloudflare authoritative DNS, which would force samkirk.com off Microsoft DNS and put Exchange mail at risk. Porkbun was selected instead precisely because it preserves the Microsoft nameservers.

That raised a fair follow-up: Cloudflare is known for free DNS analytics. If we're declining Cloudflare, are we leaving analytics on the table — and does Microsoft offer an equivalent that would add something on top of the GA4 click instrumentation and Search Console reporting shipped in this repo on July 29, 2026 (`bf3c93d`, `bbb51ad`)?

---

## What DNS You Are Actually Running

This distinction turns out to decide the whole answer.

```
$ dig +short NS samkirk.com
ns1.bdm.microsoftonline.com.
ns2.bdm.microsoftonline.com.
ns3.bdm.microsoftonline.com.
ns4.bdm.microsoftonline.com.
```

`BDM` is Microsoft's **bulk domain management** nameserver pool — the DNS hosting bundled with **Microsoft 365** when you let Microsoft manage a domain's records. It is administered at *Microsoft 365 admin center → Settings → Domains → samkirk.com → DNS records*.

**This is not Azure DNS.** Azure DNS zones answer from `ns1-NN.azure-dns.com` and are a separate, billable Azure resource. The two products are frequently conflated; they have completely different capabilities.

---

## Microsoft's Three DNS Products — What Each Reports

| Product | Is it what samkirk.com uses? | Analytics available |
|---|---|---|
| **Microsoft 365 DNS** (`*.bdm.microsoftonline.com`) | **Yes** | **None.** The admin center DNS tab is a record editor — add, edit, delete. No query counts, no logs, no dashboard, no export. Microsoft publishes no analytics surface for it. |
| **Azure DNS** (`*.azure-dns.com`) | No — would require migrating the zone | Three Azure Monitor metrics only: `QueryVolume`, `RecordSetCount`, `RecordSetCapacityUtilization` |
| **Azure Monitor "DNS Analytics"** | No | Despite the promising name, this is for **on-premises Windows DNS Server** via the Log Analytics agent. It does not apply to public hosted zones. A dead end — worth naming so it doesn't get chased. |

**On Azure DNS specifically**, even if you migrated the zone there, what you'd get is thin: Microsoft's own docs state *"the most granular element that you can see metrics for is a DNS zone."* That means one aggregate query-count line for samkirk.com. No breakdown by record name, no geography, no response codes, no client resolver data — none of the things that make Cloudflare's DNS dashboard interesting. Azure DNS also has **no free tier** (roughly $0.50/zone/month plus per-million-query charges), where Cloudflare's authoritative DNS is free at unlimited queries.

So: migrating from Microsoft 365 DNS to Azure DNS would mean rebuilding the zone by hand, taking on the same Exchange-mail risk we just rejected at Cloudflare, paying for the privilege, and receiving a single query-volume counter. That's a clear no.

---

## What Cloudflare Would Give You (and the Catch)

For completeness, since Cloudflare set the bar in the question. Cloudflare actually has **two distinct** things people call "Cloudflare analytics," and they have different prerequisites:

**1. DNS Analytics** — query volume over time, queries per second, average processing time, top queried names, response codes. *Requires Cloudflare to be your authoritative DNS.* Rejected for samkirk.com.

**2. Web Analytics** — the GA4-competitor. Cookieless, no consent banner, and counts requests **at the edge**, which means it sees traffic GA4 structurally cannot: ad-blocked visitors, bots, AI crawlers, API calls, and anyone whose browser doesn't run the JS (JavaScript) beacon. Also reports Core Web Vitals.

The edge-counting advantage in #2 is the genuinely interesting one — GA4 only ever sees users who execute JavaScript and aren't blocking it, which on a technical audience can undercount substantially. But that advantage **only exists when traffic is proxied through Cloudflare's network** (orange-cloud), which again means Cloudflare DNS, and for a Vercel-hosted site means stacking Cloudflare in front of Vercel — added latency, added failure surface, and a second CDN (Content Delivery Network) to reason about.

Cloudflare Web Analytics can be deployed standalone as a JS beacon without Cloudflare DNS — but stripped of the edge advantage it becomes just another client-side tracker, duplicating GA4 while lacking Custom Events, UTM (Urchin Tracking Module) tracking, funnels, live visitors, and any Search Console / Ads / Tag Manager integration. Not worth the tag.

---

## Why DNS Analytics Are Weak Analytics Anyway

Worth stating plainly, because it reframes the question: **DNS query data is a poor proxy for human visitors**, regardless of vendor.

- **Resolver caching hides most traffic.** Once a recursive resolver caches your A record for the TTL (Time To Live), thousands of visitors behind it generate *zero* additional queries at your authoritative nameserver.
- **One query ≠ one visit.** A single page load fires lookups for the apex, `www`, and any third-party domains. A returning visitor within the TTL fires none.
- **No page-level anything.** DNS sees `samkirk.com`, never `/hire-me` or `/dance-menu`. Every page-level insight in the GA4 work — which links get clicked, which pages convert — is invisible at the DNS layer.
- **Mail and machines dominate.** MX (Mail Exchanger) and autodiscover lookups from Exchange, SPF (Sender Policy Framework) checks by receiving mail servers, and uptime monitors all count as queries. For a personal site with an active mail domain, a large share of DNS traffic isn't people at all.

DNS analytics are an infrastructure-health signal — "are we being queried, is the zone being hammered" — not an audience measurement tool. GA4 plus Search Console is answering a different and more useful question.

---

## What Would Actually Add Signal

If the real goal is *"what sees traffic that GA4 and Search Console miss?"*, the answer isn't DNS and it isn't Microsoft. It's the platform already serving the site:

**Vercel Analytics + Speed Insights.** samkirk.com is already on Vercel, so this is a project-setting toggle plus a small package — no DNS change, no new vendor, no risk to mail.

| Gap in GA4 + Search Console | Does Vercel Analytics close it? |
|---|---|
| Ad-blocked / no-JS visitors undercounted | **Partly** — first-party script path, see [Section 9](#vercel-analytics--speed-insights-for-later) for the honest limits |
| Bot and AI-crawler traffic invisible | **Partly** — visible in Vercel's request/log data, not in the Analytics visitor counts |
| Real-user Core Web Vitals (field data, not Lighthouse lab data) | **Yes** — Speed Insights |
| Per-route performance regressions after a deploy | **Yes** — and correlated to the deploy that caused them |
| Search queries and impressions | No — that's Search Console's job, already covered |
| Click/conversion behavior | No — that's the GA4 instrumentation, already covered |

That is a real complement to what shipped today rather than a duplicate of it. Full detail, pricing, and a verdict: [Vercel Analytics + Speed Insights (for later)](#vercel-analytics--speed-insights-for-later).

**The other genuine gap, unrelated to analytics:** `dig` shows samkirk.com publishes **no DMARC record** and **no DKIM selectors** — only SPF. For a domain sending professional correspondence to recruiters and clients through Exchange, that's a deliverability risk worth closing, and it's configured in the same Microsoft 365 admin center. Worked up in full in the next section.

---

## Publishing DKIM and DMARC for samkirk.com

**DKIM (DomainKeys Identified Mail)** attaches a cryptographic signature to every outbound message, and publishes the matching public key in DNS so receivers can verify the message really came from your domain and wasn't altered. **DMARC (Domain-based Message Authentication, Reporting and Conformance)** is the policy layer on top: it tells receivers what to do when a message claiming to be from samkirk.com fails both SPF and DKIM, and it asks them to send you reports about it.

### Current state (verified by `dig`, July 29–30, 2026)

| Record | Present? | Value |
|---|---|---|
| SPF (`TXT` at apex) | **Yes** | `v=spf1 include:spf.protection.outlook.com -all` |
| DKIM `selector1._domainkey` CNAME | **No** | *(empty)* |
| DKIM `selector2._domainkey` CNAME | **No** | *(empty)* |
| DMARC (`TXT` at `_dmarc`) | **No** | *(empty)* |

So one of three legs is up. SPF alone does not give DMARC alignment for forwarded mail, and it gives receivers nothing to report on.

### The registrar migration does not gate any of this

The Network Solutions → Porkbun transfer moves **registration**, not the **zone**. samkirk.com's nameservers stay `ns1–ns4.bdm.microsoftonline.com` throughout, and every record discussed below lives inside that Microsoft-hosted zone. **Do not sequence these behind the transfer.** DKIM and DMARC can be published today, mid-migration, and the transfer will not touch them. (The one thing the transfer *does* require is that the nameserver delegation be re-pointed at Microsoft's four nameservers at Porkbun if Porkbun defaults to its own — that's a migration checklist item, and it is unrelated to the record contents here.)

### 1. Order matters — DKIM first, then DMARC at `p=none`

This is the whole reason to write the steps down rather than wing it:

1. **Enable DKIM signing and confirm messages are actually being signed.** Until Microsoft detects the CNAMEs and flips the domain to `Valid`, outbound mail is unsigned.
2. **Only then publish DMARC, and publish it at `p=none` first.** `p=none` is monitor-only: no receiver changes delivery behavior, but they start mailing you aggregate reports.
3. **Tighten to `p=quarantine`, then `p=reject`, only after the reports show clean.**

Publishing an enforcing DMARC policy (`p=quarantine` or `p=reject`) before DKIM is signing is exactly how people break their own mail: any legitimate message that loses SPF alignment — most commonly forwarded mail, or a mailing list — has no DKIM signature to fall back on, fails DMARC, and gets junked or bounced at the far end by *your own* instruction. Microsoft's guidance is explicit that SPF and DKIM must both be configured before DMARC.

There is one additional Microsoft-specific hazard worth knowing: outbound mail from a Microsoft 365 domain that fails DMARC at the destination is routed through Microsoft's **high-risk delivery pool**, and there is no override for that behavior. Getting DKIM right first is what keeps you out of it.

### 2. Enable DKIM for Exchange Online

**Portal path:** Microsoft Defender portal at `https://security.microsoft.com` → **Email & collaboration** → **Policies & rules** → **Threat policies** → **Email authentication settings** → **DKIM** tab. Direct link: `https://security.microsoft.com/authentication?viewid=DKIM`.

**Find the tenant's initial domain first.** The DKIM CNAME targets embed it. It is the `*.onmicrosoft.com` domain created when the tenant was first set up, and it is listed at *Microsoft 365 admin center → Settings → Domains* alongside samkirk.com. Only the prefix is used — for `contoso.onmicrosoft.com` the prefix is `contoso`.

**Steps:**

1. On the **DKIM** tab, find `samkirk.com` in the list and slide its **Toggle** from **Disabled** toward **Enabled**.
2. A **Client error** dialog opens saying the CNAMEs are missing. Dismiss it. The domain's **Status** becomes `CnameMissing`.
3. Click the `samkirk.com` row to open its details flyout. The **Publish CNAMEs** section now shows the two exact values, with a **Copy** button. **Use these values verbatim — do not retype from this document.**
4. Create the two CNAME records in the samkirk.com zone (see below).
5. Return to the flyout and set **Toggle** to **Enabled** again. Microsoft re-checks DNS; propagation detection can take several minutes or longer. On success, **Status** becomes `Valid` and **Rotate DKIM keys** becomes available.

**What the two records look like.** Microsoft changed the CNAME target format in May 2025, and **both formats are in the wild** — which format samkirk.com gets depends on when the domain was added to the tenant. The hostnames are identical either way:

| Hostname | Target format |
|---|---|
| `selector1._domainkey` | Legacy: `selector1-samkirk-com._domainkey.<InitialDomainPrefix>.onmicrosoft.com` |
| `selector2._domainkey` | Legacy: `selector2-samkirk-com._domainkey.<InitialDomainPrefix>.onmicrosoft.com` |
| `selector1._domainkey` | Post-May-2025: `selector1-samkirk-com._domainkey.<InitialDomainPrefix>.<x>-v1.dkim.mail.microsoft` |
| `selector2._domainkey` | Post-May-2025: `selector2-samkirk-com._domainkey.<InitialDomainPrefix>.<x>-v1.dkim.mail.microsoft` |

`<x>` is a single dynamically-assigned partition character (Microsoft's docs show `r` and `n` as examples). It is assigned by Microsoft, is not configurable, and **cannot be guessed** — which is why step 3 above is the authority, not this table. The two formats cannot coexist for the same selector.

If you prefer the command line, Exchange Online PowerShell returns the same values:

```powershell
Get-DkimSigningConfig -Identity samkirk.com | Format-List Name,Enabled,Status,Selector1CNAME,Selector2CNAME
```

**Where to create the records.** Because Microsoft hosts the samkirk.com zone, the records go in the same place the zone already lives: *Microsoft 365 admin center → Settings → Domains → samkirk.com → DNS records → Add record*, type **CNAME**. Microsoft's own DKIM article is written for the general case ("create the records at your domain registrar"), which does not apply here — there is no third-party DNS provider in the loop. **Worth confirming at the time:** for domains whose DNS Microsoft manages, the admin center will sometimes offer to create required service records automatically rather than making you type them. If that offer appears for the DKIM CNAMEs, take it; if not, add them manually as custom CNAME records. Either way the resulting records are identical, so this is convenience, not correctness.

**Key size — the 2048-bit consideration.** Microsoft's default for a newly-created DKIM signing config is **1024-bit**. 2048-bit is supported and is the better choice for a domain doing professional correspondence. Two ways to get there:

- Create the config at 2048 up front via PowerShell before enabling: `New-DkimSigningConfig -DomainName samkirk.com -Enabled $false -KeySize 2048`
- Or enable at the default and rotate later: `Rotate-DkimSigningConfig -Identity samkirk.com -KeySize 2048`

Note the rotation mechanics: a rotation takes **four days (96 hours)** to take effect, during which the old key keeps signing and no second rotation is possible. And a key-size change applies only to the *next* active selector on the first rotation — the other selector picks up 2048 on the rotation after that. So going from 1024 to 2048 across both selectors is two rotations, roughly eight days. Setting 2048 at creation avoids all of it. If the config already exists at 1024, this is not urgent enough to delay DKIM — enable it, then rotate.

### 3. Publish DMARC

The record is a **TXT** record at hostname `_dmarc` in the samkirk.com zone (fully qualified: `_dmarc.samkirk.com`).

Unlike DKIM, Microsoft provides **no admin portal or PowerShell cmdlet to manage DMARC for custom domains** — you add it as a plain custom TXT record. For samkirk.com that means: *Microsoft 365 admin center → Settings → Domains → samkirk.com → DNS records → Add record* → Type **TXT**, TXT name `_dmarc`, TTL 1 hour.

**Recommended starting value for samkirk.com:**

```
v=DMARC1; p=none; rua=mailto:<aggregate-report-address>
```

Notes on that choice:

- `pct=` is omitted deliberately. It defaults to `100`, and at `p=none` the percentage is irrelevant anyway (no action is being taken).
- `ruf=` is omitted deliberately. Forensic/failure reports are per-failure rather than daily, are inconsistently supported, may contain message content, and Microsoft 365 does not send them at all. Add it later only if debugging a specific problem.
- `adkim`/`aspf` are omitted, leaving both at the default **relaxed** alignment. Strict alignment buys nothing here and creates failure modes.
- `sp=` is omitted, so subdomains inherit the parent policy — correct for a domain with no mail-sending subdomains.

**Staged rollout.** Rough dwell times for a domain at Sam's volume — these are judgment calls, not published numbers, and the real gate is "do the reports look clean," not the calendar:

| Stage | Record value | Dwell | Gate to advance |
|---|---|---|---|
| 1. Monitor | `v=DMARC1; p=none; rua=mailto:…` | 4–6 weeks | Aggregate reports show all legitimate sending sources passing SPF **or** DKIM *with alignment*; no unexplained sources |
| 2. Quarantine | `v=DMARC1; p=quarantine; rua=mailto:…` | 4–6 weeks | No legitimate mail landing in Junk at the far end; report volume stable |
| 3. Enforce | `v=DMARC1; p=reject; rua=mailto:…` | permanent | — |

Low mail volume cuts both ways: it means little risk, but it also means **fewer reports and slower confidence**, which is why the dwell times here are longer than a high-volume domain would need. If stage 2 makes you nervous, `pct=` is the safety valve — `p=quarantine; pct=25` applies the policy to only a quarter of failing mail. For a domain this small it is probably unnecessary ceremony.

One thing to watch in the stage-1 reports: the important distinction is between *authentication* pass and *alignment* pass. A message can show SPF `pass` and still fail DMARC because the envelope sender domain doesn't match the `From:` domain. That combination — auth pass, alignment fail — is the classic finding, and it is what DKIM fixes.

### 4. Where to point `rua=`

This is the one genuinely discretionary decision. Aggregate reports arrive as **gzipped XML (Extensible Markup Language) attachments, one per reporting receiver per day**. They are machine-readable and essentially unreadable by a human.

| Option | Pro | Con |
|---|---|---|
| Real mailbox (e.g. `sak@samkirk.com`) | Nothing to sign up for; data stays entirely with you | Daily gzipped XML into the mailbox Sam actually reads; parsing by hand is impractical; you will stop looking within two weeks |
| Dedicated alias / shared mailbox on samkirk.com | Keeps the noise out of the primary inbox | Still raw XML; still needs a parser to be useful |
| Free third-party aggregator | Parses XML into a readable summary; the entire point of `rua` | A third party receives metadata about your mail flow (source IPs, volumes, pass/fail — not message content) |

**Recommendation for Sam: use a free aggregator, not a mailbox.** The volume is low enough that a weekly emailed digest is the right resolution, and raw XML into a personal inbox is a plan that fails by being ignored.

**Postmark's DMARC Digests free tier** (`https://dmarc.postmarkapp.com`) is the closest fit to how Sam works: email-only weekly summary, no dashboard to remember to log into, no Postmark account required, unlimited domains. It was free at the time of writing — **confirm the current terms at signup rather than trusting this line**; Postmark also sells a paid tier with a dashboard and retention, and the free/paid boundary is theirs to move. Microsoft additionally maintains a vendor list at `https://www.microsoft.com/misapartnercatalog` if a different provider is preferred.

Two mechanical details if you use any third-party aggregator:

- The service issues **its own `rua=` address**, e.g. `rua=mailto:<token>@dmarc.postmarkapp.com`. Use the address they give you, not a generic one.
- Because that address is in a **different domain** than samkirk.com, cross-domain reporting rules apply: the aggregator's domain must publish a TXT record at `samkirk.com._report._dmarc.<their-domain>` with value `v=DMARC1;` authorizing them to receive reports for you. Reputable services do this automatically as part of onboarding — but if reports never arrive, this is the first thing to check.

A reasonable hybrid: `rua=mailto:<aggregator-address>,mailto:sak@samkirk.com` sends to both. Doable, and it means Sam keeps the raw data. It also means the raw XML in his inbox. Not recommended unless he wants the archive.

### 5. Verification

**DNS records.** Run these after publishing. All four should return data; today the first three return nothing.

```bash
# DKIM — expect a CNAME target, not empty
dig +short CNAME selector1._domainkey.samkirk.com
dig +short CNAME selector2._domainkey.samkirk.com

# DMARC — expect the policy string
dig +short TXT _dmarc.samkirk.com

# SPF — already correct, confirm it wasn't disturbed
dig +short TXT samkirk.com | grep spf1
```

Expected output once everything is published (targets illustrative — the real ones come from the Defender portal):

```
$ dig +short CNAME selector1._domainkey.samkirk.com
selector1-samkirk-com._domainkey.<prefix>.<x>-v1.dkim.mail.microsoft.

$ dig +short CNAME selector2._domainkey.samkirk.com
selector2-samkirk-com._domainkey.<prefix>.<x>-v1.dkim.mail.microsoft.

$ dig +short TXT _dmarc.samkirk.com
"v=DMARC1; p=none; rua=mailto:<aggregate-report-address>"

$ dig +short TXT samkirk.com | grep spf1
"v=spf1 include:spf.protection.outlook.com -all"
```

Two things to check on the DMARC record specifically: there must be **exactly one** `_dmarc` TXT record (two produce `permerror` and DMARC is treated as absent), and it must begin with `v=DMARC1;` — that prefix is what identifies it.

The equivalent from Exchange Online PowerShell, which confirms Microsoft's own view rather than just DNS:

```powershell
Get-DkimSigningConfig -Identity samkirk.com | Format-List Name,Enabled,Status,Selector1CNAME,Selector2CNAME
```

`Status: Valid` and `Enabled: True` is the pair that means signing is live.

**End-to-end test with a real message.** DNS records being present is necessary but not sufficient — the proof is a message that a third-party receiver validated.

1. Send a message from `sak@samkirk.com` to a Gmail address (Gmail is the useful target because it stamps all three results and because its sender rules are the thing being satisfied).
2. In Gmail, open the message → three-dot menu → **Show original**.
3. Find the **Authentication-Results** header. It should read approximately:

```
Authentication-Results: mx.google.com;
  dkim=pass header.i=@samkirk.com header.s=selector1 header.b=NaHRSJOb;
  spf=pass (google.com: domain of sak@samkirk.com designates ... as permitted sender) smtp.mailfrom=sak@samkirk.com;
  dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=samkirk.com
```

What to read in it, in order:

| Field | Want to see | Meaning if wrong |
|---|---|---|
| `dkim=` | `pass` | `none (message not signed)` = DKIM isn't actually signing yet; the CNAMEs may be published but the Defender toggle isn't Enabled |
| `header.i=` / `header.d=` | `@samkirk.com` | If it shows the `*.onmicrosoft.com` domain, the message is signed by the tenant domain, not yours — that does **not** align, and DMARC will fail |
| `header.s=` | `selector1` or `selector2` | Tells you which key signed; useful during rotation |
| `spf=` | `pass` | Already working today |
| `dmarc=` | `pass` | `bestguesspass` means **no DMARC record was found** — the TXT record didn't publish or has a syntax error |
| `header.from=` | `samkirk.com` | Must match `header.d=` for DKIM alignment |

Also confirm a **`DKIM-Signature`** header exists on the message at all, with `d=samkirk.com`. If that header is missing entirely, nothing downstream matters — signing isn't happening.

Send the same test to a Yahoo or Outlook.com address as a second data point. Then wait for the first aggregate report (typically within 24–48 hours of publishing `rua`) and confirm it arrives.

### 6. Why this matters for samkirk.com specifically

Sam sends professional correspondence — replies to recruiters, hiring managers, and prospective clients — from `sak@samkirk.com`. That is the highest-consequence mail he sends: a message that lands in a hiring manager's Junk folder is functionally a message never sent, and he gets no signal that it happened.

The factual position as of 2026:

- **Google's baseline requirement for all senders** to personal Gmail accounts (in force since February 2024) is SPF **or** DKIM, plus valid forward and reverse DNS and TLS. samkirk.com meets this today on SPF alone.
- **Google's bulk-sender tier** (5,000+ messages/day) requires SPF, DKIM, **and** DMARC with alignment. Sam is nowhere near that threshold, so this is not a compliance obligation for him.
- The practical point is that **the bulk-sender rules moved the floor of normal**. Domains that authenticate fully are now the overwhelming majority of legitimate mail, which means an unauthenticated or partially-authenticated domain is increasingly an outlier — and outlier status is an input to spam scoring even where no published rule is being violated. Yahoo announced parallel requirements on the same timeline.
- Independently of any provider's rules, DKIM survives forwarding in a way SPF does not. A recruiter who auto-forwards Sam's message to a colleague breaks SPF alignment; with DKIM, the message still authenticates.
- And DMARC at `p=reject`, once earned, prevents anyone spoofing `samkirk.com` in Sam's name — a real concern for a domain that's on a public site, a résumé, and a LinkedIn profile.

This is a one-afternoon task with a permanent payoff and, done in the order above, essentially no risk.

---

## Vercel Analytics + Speed Insights (for later)

**Status: deferred.** Nothing here needs doing now. This section exists so the decision is documented and doesn't get re-researched from scratch in three months. The DKIM/DMARC work above is the item with an actual deadline-shaped reason behind it; this one does not have one.

### 1. What each product actually is

They are two separate, separately-priced products that are often spoken of as one thing:

| Product | Package | Measures | Answers |
|---|---|---|---|
| **Vercel Web Analytics** | `@vercel/analytics` | Page views, visitors, referrers, top pages, countries, devices; custom events on paid plans | "Who came, from where, to what page" — an audience/traffic product |
| **Vercel Speed Insights** | `@vercel/speed-insights` | Real-user CWV (Core Web Vitals) — LCP (Largest Contentful Paint), CLS (Cumulative Layout Shift), INP (Interaction to Next Paint), FCP (First Contentful Paint), TTFB (Time to First Byte) — collected from actual visitors' browsers, broken out per route | "How fast is the site *for real people*, on which pages, and did the last deploy make it worse" — a performance product |

The distinction that matters: Speed Insights is **field data (RUM — Real User Monitoring)**, measured on real visitors' devices and networks. This is categorically different from Lighthouse or PageSpeed Insights **lab data**, which is a single synthetic run on a simulated device. Lab data tells you the site *can* be fast; field data tells you whether it *is*, for Sam's actual audience, on their actual hardware.

### 2. What it adds over GA4 + Search Console — the honest version

Genuinely additive:

- **Real-user Core Web Vitals, per route.** GA4 does not collect CWV by default, and Search Console's Core Web Vitals report is CrUX (Chrome User Experience Report) data — Chrome-only, 28-day trailing, and only for URLs with enough traffic to clear its reporting threshold. A personal site's less-visited pages routinely fall below that threshold and simply never appear. Speed Insights measures every visit regardless of volume.
- **Per-route regressions attributable to a specific deploy.** This is the strongest single argument. Vercel knows which deployment served each measurement, so a CWV regression is traceable to the commit that caused it. Nothing in the GA4 + Search Console stack can do this.
- **A first-party collection path.** The Vercel script is served from Sam's own origin under `/_vercel/insights/*` rather than from `googletagmanager.com`. Common ad-blocker filter lists target the Google domains by name; the first-party path is not on them. On a technical audience — which is exactly who reads a genAI consulting site — that difference is not small.

**The correction to be honest about:** the earlier framing in [What Would Actually Add Signal](#what-would-actually-add-signal) said "server-side/edge counting." That overstates it. Vercel's own documentation is explicit that both Web Analytics and Speed Insights *"require scripts to do collection of data points"* and that *"these scripts are loaded on the client-side."* So:

- Visitors who run no JavaScript at all — text browsers, some crawlers, users with scripting disabled — are **still missed**, by Vercel exactly as by GA4.
- The gain over GA4 is that the collection endpoint is first-party and therefore much less likely to be blocked. That is a real and meaningful gain. It is not the categorical "sees everything at the edge" advantage Cloudflare's orange-cloud proxy offers, and this document previously implied otherwise.
- Bot and AI-crawler visibility likewise comes from Vercel's **request logs and firewall data**, not from the Web Analytics visitor counts, which filter bots out by design.

What it does **not** replace:

- **Search Console.** Queries, impressions, average position, index coverage, rich-result status. Vercel has no visibility into any of it. Keep the `check-search-console` skill.
- **The existing GA4 click instrumentation.** `web/src/lib/analytics.ts` and `web/src/components/TrackedLink.tsx` track named outbound clicks and conversion-shaped behavior. Vercel's equivalent — custom events — is **Pro-only** (not available on Hobby at all), and would be a reimplementation rather than an upgrade. Keep the `check-analytics` skill.

Correct mental model: Vercel Analytics is a **third** tool alongside the two already shipped, not a replacement for either. That is also the argument for deferring it — a third dashboard has a real ongoing attention cost, and the site's traffic is not currently large enough for performance regressions to be costing anything measurable.

### 3. Enablement steps, against the real `layout.tsx`

The file is `/Users/sam/Projects/ClaudeProjects/samkirk-v3/web/src/app/layout.tsx`. It is a standard App Router root layout: a server component exporting `RootLayout`, with `<Header />`, `<main>{children}</main>`, `<Footer />`, three JSON-LD `<script>` blocks, and the conditional GA4 `<Script>` pair — all inside `<body>`. Both Vercel components are client components that self-inject their script tag, so they drop in with no `"use client"` change to the layout itself.

**Step 1 — toggle in the Vercel dashboard.** Each product has its own toggle and each must be enabled separately:
- Web Analytics: dashboard → select the samkirk-v3 project → **Analytics** in the sidebar → **Enable**.
- Speed Insights: dashboard → select the project → **Speed Insights** in the sidebar → **Enable**.

Both add new routes (`/_vercel/insights/*` and `/_vercel/speed-insights/*`) on the next deployment.

**Step 2 — install:**

```bash
cd /Users/sam/Projects/ClaudeProjects/samkirk-v3/web
npm install @vercel/analytics @vercel/speed-insights
```

**Step 3 — edit `web/src/app/layout.tsx`.** Add the imports alongside the existing ones near the top:

```tsx
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
```

Then place both components inside `<body>`, at the very end — after the existing GA4 conditional block, immediately before `</body>`:

```tsx
        {/* Google Analytics 4 — only loads when a real measurement ID is configured */}
        {GA_MEASUREMENT_ID && !GA_MEASUREMENT_ID.includes("XXXXXXXXXX") && (
          <>
            {/* ...existing Script tags, unchanged... */}
          </>
        )}

        <Analytics />
        <SpeedInsights />
      </body>
```

Note the import subpaths: `@vercel/analytics/next` and `@vercel/speed-insights/next` — the framework-specific entry points, which add App Router route detection. The bare `@vercel/analytics` / `@vercel/speed-insights` imports are the generic ones and lack route support. Both packages are currently at major version 2; check `/docs/analytics/package` for v2 migration notes if an older version is already present (it isn't today — neither package is in `web/package.json`).

**Step 4 — deploy and verify.** After a deploy, a page visit should produce a Fetch/XHR request to `/_vercel/insights/view` in the browser Network tab, and a `script.js` under the Vercel-scoped path in `<head>`. Data appears in the dashboards after visitors accumulate; both take a few days to become interesting.

### 4. Pricing and free-tier limits, as of 2026

Checked against Vercel's own pricing pages (Web Analytics page last updated 2026-06-26, Speed Insights 2026-06-16). **Confirm which plan samkirk-v3 is on before enabling** — the Hobby/Pro difference is material, and this document does not know the answer.

**Web Analytics** — billed by *events*, where an event is one page view or one custom event, pooled across all projects on the account:

| | Hobby | Pro | Pro + Web Analytics Plus |
|---|---|---|---|
| Included events/month | 50,000 | none included | none included |
| Additional events | not purchasable | $0.03 per 1,000 | $0.03 per 1,000 |
| Reporting window | 1 month | 12 months | 24 months |
| Custom events | **not available** | included (2 properties) | included (8 properties) |
| UTM parameters | not available | not available | included |

On Hobby, exceeding 50,000 events/month starts a **3-day grace period**, after which collection pauses; it resumes 7 days later or on upgrade to Pro. Existing data stays viewable. Web Analytics Plus is a **$10/month per team** add-on.

**Speed Insights** — billed separately, by *data points*:

| | Hobby | Pro | Enterprise |
|---|---|---|---|
| Base fee | free, **one project only** | **$10/month per project** | custom |
| Included events/month | 10,000 | unlimited | unlimited |
| Overage | not purchasable | $0.65 per 10,000 | custom |
| Reporting window | **7 days** | 30 days | 90 days |

On Hobby, hitting 10,000 data points pauses recording until the next day. The **7-day** Hobby reporting window is the meaningful catch: it is enough to spot a regression you're actively looking for, and not enough to see a trend.

Two costs that are easy to miss on either plan: the collection scripts themselves consume **Data Transfer and Edge Requests** from the plan's allowances, and Speed Insights on Pro is charged **per project, prorated on enable, non-refundable, with no data export** if you later turn it off.

For samkirk.com's traffic, Hobby's 50,000 events/month is not a realistic constraint — that would be roughly 1,600 page views a day. The 10,000 Speed Insights data points is a tighter number but still comfortable, and the `samplingRate` option on `@vercel/speed-insights` exists if it ever isn't.

### 5. Is it worth it — verdict

**Speed Insights: worth enabling, eventually, and it's the better half of the pair.** It measures something nothing else in the stack measures, at a granularity Search Console's CrUX data structurally cannot reach for a low-traffic site. On Hobby it is free for one project. The honest caveat is that its value is proportional to how often the site changes — for a site that ships a deploy a month, a 7-day reporting window catches very little, and there's nothing to attribute a regression to most weeks. Its natural moment is *during* a period of active front-end work, not as a standing background service.

**Web Analytics: marginal, and the weakest link is the plan tier.** On Hobby it cannot do custom events at all, which means it cannot replicate what `TrackedLink.tsx` already does — so it would sit alongside GA4 reporting a strictly smaller set of facts, differing mainly in that its numbers would be somewhat higher because fewer visitors block it. That delta is interesting exactly once, as a calibration check on how much GA4 is undercounting. It is not worth a permanent third dashboard.

**If Sam does exactly one thing here:** enable Speed Insights on Hobby before the next round of front-end work, leave Web Analytics alone. If curiosity about the GA4 undercount is itching, turn Web Analytics on for a month, compare the two numbers, write the ratio down, and turn it off.

**Relative priority: well below the DKIM/DMARC work above.** That one has a failure mode — a message to a hiring manager silently junked. This one has no failure mode at all; the cost of not doing it is a dashboard Sam doesn't have.

---

## Recommendation

1. **Do not migrate DNS anywhere.** Keep Microsoft 365 DNS. Nothing found here justifies the Exchange-mail risk — this reinforces the Porkbun registrar decision rather than complicating it.
2. **Do not pursue Microsoft DNS analytics.** For the product samkirk.com actually runs, the feature does not exist. For Azure DNS it exists but is one aggregate counter, costs money, and would require the migration in point 1.
3. **Do not add Cloudflare Web Analytics as a standalone beacon.** Without Cloudflare DNS it's a weaker duplicate of GA4.
4. **Publish DKIM, then DMARC — this is the actionable item.** Full procedure, record values, staged rollout, and verification in [Publishing DKIM and DMARC for samkirk.com](#publishing-dkim-and-dmarc-for-samkirkcom). Order is load-bearing: DKIM signing confirmed first, then DMARC at `p=none`, then tighten. **Independent of the Porkbun transfer** — these are zone records at Microsoft and the zone doesn't move, so don't sequence them behind it.
5. **Defer Vercel Analytics + Speed Insights.** Analysis, enablement steps against the real `layout.tsx`, 2026 pricing, and the verdict are in [Vercel Analytics + Speed Insights (for later)](#vercel-analytics--speed-insights-for-later). Short version: Speed Insights is the worthwhile half and is free on Hobby for one project, best enabled during active front-end work; Web Analytics is marginal because Hobby can't do custom events. Confirm the plan tier first. Both rank below item 4.

---

## Sources

- [Cloudflare Registrar — transfer requirements](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/)
- [Cloudflare DNS — analytics and logs](https://developers.cloudflare.com/dns/additional-options/analytics/)
- [Monitor Azure DNS — metrics and alerts](https://learn.microsoft.com/en-us/azure/dns/dns-alerts-metrics)
- [Supported metrics — Microsoft.Network/dnszones](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/supported-metrics/microsoft-network-dnszones-metrics)
- [Azure Monitor DNS Analytics solution (on-prem Windows DNS Server)](https://learn.microsoft.com/en-us/azure/azure-monitor/insights/dns-analytics)
- [Change nameservers to set up Microsoft 365 with any registrar](https://learn.microsoft.com/en-us/microsoft-365/admin/get-help-with-domains/change-nameservers-at-any-domain-registrar?view=o365-worldwide)
- [Cloudflare Web Analytics vs Google Analytics comparison](https://swetrix.com/comparison/cloudflare-analytics/vs-google-analytics)
- [Set up DKIM to sign mail from your cloud domain — Microsoft Defender for Office 365](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-dkim-configure)
- [Set up DMARC to validate email in Microsoft 365 — Microsoft Defender for Office 365](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-dmarc-configure)
- [RFC 7489 — Domain-based Message Authentication, Reporting, and Conformance](https://datatracker.ietf.org/doc/html/rfc7489)
- [Google — Email sender guidelines](https://support.google.com/a/answer/81126?hl=en)
- [DMARC Weekly Digests by Postmark (free tier)](https://dmarc.postmarkapp.com/)
- [Microsoft Intelligent Security Association (MISA) partner catalog — DMARC reporting vendors](https://www.microsoft.com/misapartnercatalog)
- [Vercel Web Analytics — pricing and limits](https://vercel.com/docs/analytics/limits-and-pricing)
- [Vercel Web Analytics — quickstart](https://vercel.com/docs/analytics/quickstart)
- [Vercel Speed Insights — limits and pricing](https://vercel.com/docs/speed-insights/limits-and-pricing)
- [Vercel Speed Insights — quickstart](https://vercel.com/docs/speed-insights/quickstart)
