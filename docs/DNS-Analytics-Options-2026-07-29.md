# DNS-Level Analytics for samkirk.com — Does Microsoft Offer Anything?

**Created:** July 29, 2026 10:45 PST | **Domain:** samkirk.com | **Authoritative DNS:** Microsoft 365 (`ns1–ns4.bdm.microsoftonline.com`) | **Hosting:** Vercel

**Short answer: No.** Microsoft's DNS for samkirk.com has no analytics surface at all, and even the Microsoft product that *does* have DNS metrics offers far less than Cloudflare — and nothing that GA4 and Search Console aren't already covering better. There is, however, a genuinely useful gap-filler that isn't Microsoft or Cloudflare: **Vercel Analytics**. See [What Would Actually Add Signal](#what-would-actually-add-signal).

---

## Table of Contents

1. [Originating Request (verbatim)](#originating-request-verbatim)
2. [Why This Question Came Up](#why-this-question-came-up)
3. [What DNS You Are Actually Running](#what-dns-you-are-actually-running)
4. [Microsoft's Three DNS Products — What Each Reports](#microsofts-three-dns-products--what-each-reports)
5. [What Cloudflare Would Give You (and the Catch)](#what-cloudflare-would-give-you-and-the-catch)
6. [Why DNS Analytics Are Weak Analytics Anyway](#why-dns-analytics-are-weak-analytics-anyway)
7. [What Would Actually Add Signal](#what-would-actually-add-signal)
8. [Recommendation](#recommendation)
9. [Sources](#sources)

---

## Originating Request (verbatim)

> Please also research if MS does an analysis via DNS similar to Cloudflare which would add something above and beyond the work we did yesterday with Google Analytics and Google Console Search in samkirk-v3. Hmmm... really should have this conversation in samkirk-v3.

*(Recorded here per the second half of that request — this is the samkirk-v3 side of a conversation that started in MyFinancialAdvisor over the Network Solutions → Porkbun registrar migration. The registrar/fee half stays there; see `~/Projects/ClaudeProjects/MyFinancialAdvisor/Porkbun-Migration-Guide-2026-07-29.md`.)*

---

## Why This Question Came Up

While evaluating registrars for the samkirk.com transfer, Cloudflare Registrar came up and was **rejected** — it mandates Cloudflare authoritative DNS, which would force samkirk.com off Microsoft DNS and put Exchange mail at risk. Porkbun was selected instead precisely because it preserves the Microsoft nameservers.

That raised a fair follow-up: Cloudflare is known for free DNS analytics. If we're declining Cloudflare, are we leaving analytics on the table — and does Microsoft offer an equivalent that would add something on top of the GA4 click instrumentation and Search Console reporting shipped in this repo today (`bf3c93d`, `bbb51ad`)?

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

**2. Web Analytics** — the GA4-competitor. Cookieless, no consent banner, and counts requests **at the edge**, which means it sees traffic GA4 structurally cannot: ad-blocked visitors, bots, AI crawlers, API calls, and anyone whose browser doesn't run the JS beacon. Also reports Core Web Vitals.

The edge-counting advantage in #2 is the genuinely interesting one — GA4 only ever sees users who execute JavaScript and aren't blocking it, which on a technical audience can undercount substantially. But that advantage **only exists when traffic is proxied through Cloudflare's network** (orange-cloud), which again means Cloudflare DNS, and for a Vercel-hosted site means stacking Cloudflare in front of Vercel — added latency, added failure surface, and a second CDN to reason about.

Cloudflare Web Analytics can be deployed standalone as a JS beacon without Cloudflare DNS — but stripped of the edge advantage it becomes just another client-side tracker, duplicating GA4 while lacking Custom Events, UTM tracking, funnels, live visitors, and any Search Console / Ads / Tag Manager integration. Not worth the tag.

---

## Why DNS Analytics Are Weak Analytics Anyway

Worth stating plainly, because it reframes the question: **DNS query data is a poor proxy for human visitors**, regardless of vendor.

- **Resolver caching hides most traffic.** Once a recursive resolver caches your A record for the TTL, thousands of visitors behind it generate *zero* additional queries at your authoritative nameserver.
- **One query ≠ one visit.** A single page load fires lookups for the apex, `www`, and any third-party domains. A returning visitor within the TTL fires none.
- **No page-level anything.** DNS sees `samkirk.com`, never `/hire-me` or `/dance-menu`. Every page-level insight in the GA4 work — which links get clicked, which pages convert — is invisible at the DNS layer.
- **Mail and machines dominate.** MX and autodiscover lookups from Exchange, SPF checks by receiving mail servers, and uptime monitors all count as queries. For a personal site with an active mail domain, a large share of DNS traffic isn't people at all.

DNS analytics are an infrastructure-health signal — "are we being queried, is the zone being hammered" — not an audience measurement tool. GA4 plus Search Console is answering a different and more useful question.

---

## What Would Actually Add Signal

If the real goal is *"what sees traffic that GA4 and Search Console miss?"*, the answer isn't DNS and it isn't Microsoft. It's the platform already serving the site:

**Vercel Analytics + Speed Insights.** samkirk.com is already on Vercel, so this is a project-setting toggle plus a small package — no DNS change, no new vendor, no risk to mail.

| Gap in GA4 + Search Console | Does Vercel Analytics close it? |
|---|---|
| Ad-blocked / no-JS visitors undercounted | **Partly** — server-side request counting at the edge |
| Bot and AI-crawler traffic invisible | **Yes** — visible in Vercel's request data |
| Real-user Core Web Vitals (field data, not Lighthouse lab data) | **Yes** — Speed Insights |
| Per-route performance regressions after a deploy | **Yes** — and correlated to the deploy that caused them |
| Search queries and impressions | No — that's Search Console's job, already covered |
| Click/conversion behavior | No — that's the GA4 instrumentation, already covered |

That is a real complement to what shipped today rather than a duplicate of it. The one caveat: Vercel Analytics is free only at a modest monthly event allowance on Hobby, and samkirk.com's traffic should sit well inside it — worth confirming the current plan limits before enabling.

**The other genuine gap, unrelated to analytics:** `dig` shows samkirk.com publishes **no DMARC record** and **no DKIM selectors** — only SPF. For a domain sending professional correspondence to recruiters and clients through Exchange, that's a deliverability risk worth closing, and it's configured in the same Microsoft 365 admin center. Separate task, flagged here so it isn't lost.

---

## Recommendation

1. **Do not migrate DNS anywhere.** Keep Microsoft 365 DNS. Nothing found here justifies the Exchange-mail risk — this reinforces the Porkbun registrar decision rather than complicating it.
2. **Do not pursue Microsoft DNS analytics.** For the product samkirk.com actually runs, the feature does not exist. For Azure DNS it exists but is one aggregate counter, costs money, and would require the migration in point 1.
3. **Do not add Cloudflare Web Analytics as a standalone beacon.** Without Cloudflare DNS it's a weaker duplicate of GA4.
4. **Consider Vercel Analytics + Speed Insights** as the actual complement to today's GA4 and Search Console work — zero DNS risk, real field data, catches the traffic GA4 structurally misses.
5. **Separately: publish DMARC and DKIM** for samkirk.com in the Microsoft 365 admin center.

---

## Sources

- [Cloudflare Registrar — transfer requirements](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/)
- [Cloudflare DNS — analytics and logs](https://developers.cloudflare.com/dns/additional-options/analytics/)
- [Monitor Azure DNS — metrics and alerts](https://learn.microsoft.com/en-us/azure/dns/dns-alerts-metrics)
- [Supported metrics — Microsoft.Network/dnszones](https://learn.microsoft.com/en-us/azure/azure-monitor/reference/supported-metrics/microsoft-network-dnszones-metrics)
- [Azure Monitor DNS Analytics solution (on-prem Windows DNS Server)](https://learn.microsoft.com/en-us/azure/azure-monitor/insights/dns-analytics)
- [Change nameservers to set up Microsoft 365 with any registrar](https://learn.microsoft.com/en-us/microsoft-365/admin/get-help-with-domains/change-nameservers-at-any-domain-registrar?view=o365-worldwide)
- [Cloudflare Web Analytics vs Google Analytics comparison](https://swetrix.com/comparison/cloudflare-analytics/vs-google-analytics)
