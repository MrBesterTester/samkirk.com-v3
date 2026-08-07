#!/usr/bin/env python3
"""
Google Analytics 4 reporting for samkirk.com.

Reads the GA4 Data API for on-site behavior: how people arrive, where they land,
and which of the custom events from web/src/lib/analytics.ts they fire.

GA4 cannot tell you what people SEARCHED for — Google stripped query terms from
the referrer in 2011. Use the check-search-console skill for that.

Auth impersonates a service account that has been granted Viewer on the GA4
property. Impersonation is used rather than user credentials because Google
blocks non-Cloud sensitive scopes (analytics, webmasters) on the shared Google
Cloud SDK OAuth client — `gcloud auth application-default login
--scopes=...analytics.readonly` fails with "This app is blocked". See SKILL.md.

Pure standard library — no pip install required.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

ADMIN_ROOT = "https://analyticsadmin.googleapis.com/v1beta"
DATA_ROOT = "https://analyticsdata.googleapis.com/v1beta"

SERVICE_ACCOUNT = os.environ.get(
    "SEO_SERVICE_ACCOUNT", "seo-reporting@samkirk-v3.iam.gserviceaccount.com"
)
SCOPE = "https://www.googleapis.com/auth/analytics.readonly"

_token_cache: str | None = None

# Cache the resolved numeric property ID so we do not hit the Admin API on
# every single report. Deleting this file is harmless.
PROPERTY_CACHE = os.path.join(os.path.dirname(__file__), ".property-id")

# Mirrors GA_EVENTS in web/src/lib/analytics.ts. Keep in sync when adding events.
CUSTOM_EVENTS = [
    "nav_click",
    "cta_click",
    "contact_click",
    "artifact_download",
    "tool_job_loaded",
    "tool_run_started",
    "tool_run_completed",
    "tool_run_failed",
    "tool_chat_message",
    "tool_download",
    "tool_reset",
]


# ---------------------------------------------------------------------------
# Auth + transport
# ---------------------------------------------------------------------------


def access_token() -> str:
    """
    Mint a scoped access token by impersonating the reporting service account.

    Cached for the life of the process — minting involves a gcloud subprocess
    plus an IAM Credentials round trip, and every report makes several API calls.
    """
    global _token_cache
    if _token_cache:
        return _token_cache

    try:
        proc = subprocess.run(
            [
                "gcloud",
                "auth",
                "print-access-token",
                f"--impersonate-service-account={SERVICE_ACCOUNT}",
                f"--scopes={SCOPE}",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        sys.exit("gcloud not found on PATH. Install the Google Cloud SDK.")

    if proc.returncode != 0:
        err = proc.stderr.strip()
        hint = (
            "Re-authenticate in a BARE TERMINAL (not from inside Claude Code):\n"
            "  gcloud auth application-default login\n"
            "  gcloud auth login"
        )
        if "iam.serviceAccounts.getAccessToken" in err or "Token Creator" in err:
            hint = (
                "Denied on iam.serviceAccounts.getAccessToken. Two possible causes —\n"
                "check them in this order:\n\n"
                "1. IAM PROPAGATION LAG. If the role binding was granted in the last\n"
                "   few minutes it may simply not be live yet; this resolves on its own,\n"
                "   typically within 1-2 minutes. Confirm the binding already exists:\n"
                f"     gcloud iam service-accounts get-iam-policy {SERVICE_ACCOUNT} \\\n"
                "       --project=samkirk-v3\n"
                "   If roles/iam.serviceAccountTokenCreator is listed, just wait and retry.\n\n"
                "2. The binding is genuinely missing. Grant it with:\n"
                f"     gcloud iam service-accounts add-iam-policy-binding {SERVICE_ACCOUNT} \\\n"
                "       --member=user:sam@samkirk.com \\\n"
                "       --role=roles/iam.serviceAccountTokenCreator --project=samkirk-v3"
            )
        elif "not found" in err.lower() or "does not exist" in err.lower():
            hint = (
                f"The service account {SERVICE_ACCOUNT} does not exist.\n"
                "See the one-time setup section in SKILL.md."
            )
        sys.exit(f"Could not mint an access token.\ngcloud said: {err}\n\n{hint}")

    _token_cache = proc.stdout.strip()
    return _token_cache


def api(url: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method="POST" if data else "GET",
        headers={
            "Authorization": f"Bearer {access_token()}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        if e.code == 403:
            sys.exit(
                f"403 from the Analytics API.\n{detail}\n\n"
                "Most likely: the service account has not been granted access to the\n"
                "GA4 property. In GA4, Admin -> Property access management -> '+' ->\n"
                "Add users, paste:\n"
                f"  {SERVICE_ACCOUNT}\n"
                "with the Viewer role. Also confirm the APIs are enabled:\n"
                "  gcloud services enable analyticsdata.googleapis.com "
                "analyticsadmin.googleapis.com --project=samkirk-v3"
            )
        sys.exit(f"HTTP {e.code} from {url}\n{detail}")


def resolve_property(explicit: str | None) -> str:
    """
    Find the numeric GA4 property ID.

    The measurement ID in web/src/lib/seo.ts (G-QPGLH8V5MM) is NOT the property
    ID the Data API wants, so discover it from the Admin API and cache it.
    """
    if explicit:
        return explicit.replace("properties/", "")

    if os.path.exists(PROPERTY_CACHE):
        with open(PROPERTY_CACHE) as f:
            cached = f.read().strip()
            if cached:
                return cached

    summaries = api(f"{ADMIN_ROOT}/accountSummaries").get("accountSummaries", [])
    props = [
        (p["property"].replace("properties/", ""), p.get("displayName", "?"))
        for acct in summaries
        for p in acct.get("propertySummaries", [])
    ]

    if not props:
        sys.exit(
            "No GA4 properties visible to the service account.\n"
            "Grant it Viewer in GA4: Admin -> Property access management -> '+' ->\n"
            f"Add users -> {SERVICE_ACCOUNT}"
        )
    if len(props) > 1:
        print("Multiple GA4 properties found — pass --property to pick one:\n", file=sys.stderr)
        for pid, name in props:
            print(f"  {pid}  {name}", file=sys.stderr)
        sys.exit(1)

    pid = props[0][0]
    try:
        with open(PROPERTY_CACHE, "w") as f:
            f.write(pid)
    except OSError:
        pass  # cache is an optimization, not a requirement
    return pid


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def run_report(
    prop: str,
    dimensions: list[str],
    metrics: list[str],
    days: int,
    limit: int = 50,
    dimension_filter: dict | None = None,
    order_by_metric: str | None = None,
) -> list[list[str]]:
    body = {
        "dateRanges": [{"startDate": f"{days}daysAgo", "endDate": "today"}],
        "dimensions": [{"name": d} for d in dimensions],
        "metrics": [{"name": m} for m in metrics],
        "limit": limit,
    }
    if dimension_filter:
        body["dimensionFilter"] = dimension_filter
    if order_by_metric:
        body["orderBys"] = [{"metric": {"metricName": order_by_metric}, "desc": True}]

    resp = api(f"{DATA_ROOT}/properties/{prop}:runReport", body)
    rows = resp.get("rows", [])
    return [
        [d["value"] for d in r.get("dimensionValues", [])]
        + [m["value"] for m in r.get("metricValues", [])]
        for r in rows
    ]


def table(headers: list[str], rows: list[list[str]], numeric_from: int) -> None:
    if not rows:
        print("  (no data in this window)")
        return

    widths = [len(h) for h in headers]
    for r in rows:
        for i, cell in enumerate(r):
            widths[i] = max(widths[i], len(str(cell)))
    widths = [min(w, 55) for w in widths]

    def fmt(cells, pad_char=" "):
        out = []
        for i, c in enumerate(cells):
            c = str(c)
            if len(c) > widths[i]:
                c = c[: widths[i] - 1] + "…"
            out.append(c.rjust(widths[i]) if i >= numeric_from else c.ljust(widths[i]))
        return "  " + "  ".join(out)

    print(fmt(headers))
    print("  " + "  ".join("-" * w for w in widths))
    for r in rows:
        print(fmt(r))


def window_note(days: int) -> str:
    end = dt.date.today()
    start = end - dt.timedelta(days=days)
    return f"{start.isoformat()} to {end.isoformat()}"


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------


def cmd_properties(_args) -> None:
    summaries = api(f"{ADMIN_ROOT}/accountSummaries").get("accountSummaries", [])
    if not summaries:
        print(
            "No GA4 properties visible to the service account.\n\n"
            "Auth is working — the API answered, it just has access to nothing.\n"
            "Grant it in GA4: Admin -> Property access management -> '+' -> Add users:\n"
            f"  {SERVICE_ACCOUNT}\n"
            "with the Viewer role (uncheck 'Notify new users by email')."
        )
        return
    print("GA4 properties:\n")
    for acct in summaries:
        print(f"  Account: {acct.get('displayName', '?')}")
        for p in acct.get("propertySummaries", []):
            pid = p["property"].replace("properties/", "")
            print(f"    {pid:<14}  {p.get('displayName', '?')}")


def cmd_overview(args) -> None:
    prop = resolve_property(args.property)
    print(f"Overview — property {prop}  ({window_note(args.days)})\n")

    rows = run_report(
        prop,
        [],
        ["activeUsers", "sessions", "screenPageViews", "engagementRate", "averageSessionDuration"],
        args.days,
    )
    if not rows:
        print("  (no data in this window)")
        return

    users, sessions, views, engagement, duration = rows[0]
    print(f"  Active users            {users}")
    print(f"  Sessions                {sessions}")
    print(f"  Page views              {views}")
    print(f"  Engagement rate         {float(engagement) * 100:.1f}%")
    print(f"  Avg session duration    {float(duration):.0f}s")


def cmd_sources(args) -> None:
    """Where traffic comes from. `google / organic` is the SEO line item."""
    prop = resolve_property(args.property)
    print(f"Traffic sources — property {prop}  ({window_note(args.days)})\n")
    rows = run_report(
        prop,
        ["sessionSource", "sessionMedium"],
        ["sessions", "activeUsers", "engagementRate"],
        args.days,
        limit=args.limit,
        order_by_metric="sessions",
    )
    rows = [[s, m, se, u, f"{float(e) * 100:.1f}%"] for s, m, se, u, e in rows]
    table(["Source", "Medium", "Sessions", "Users", "Engaged"], rows, numeric_from=2)


def cmd_pages(args) -> None:
    prop = resolve_property(args.property)
    print(f"Top pages — property {prop}  ({window_note(args.days)})\n")
    rows = run_report(
        prop,
        ["pagePath"],
        ["screenPageViews", "activeUsers", "averageSessionDuration"],
        args.days,
        limit=args.limit,
        order_by_metric="screenPageViews",
    )
    rows = [[p, v, u, f"{float(d):.0f}s"] for p, v, u, d in rows]
    table(["Page", "Views", "Users", "Avg time"], rows, numeric_from=1)


def cmd_events(args) -> None:
    """All events, with the custom ones from analytics.ts flagged."""
    prop = resolve_property(args.property)
    print(f"Events — property {prop}  ({window_note(args.days)})\n")
    rows = run_report(
        prop,
        ["eventName"],
        ["eventCount", "activeUsers"],
        args.days,
        limit=args.limit,
        order_by_metric="eventCount",
    )
    marked = [
        [f"{name}  *" if name in CUSTOM_EVENTS else name, count, users]
        for name, count, users in rows
    ]
    table(["Event", "Count", "Users"], marked, numeric_from=1)
    print("\n  * = custom event defined in web/src/lib/analytics.ts")


def cmd_clicks(args) -> None:
    """Which nav links and CTAs actually get clicked."""
    prop = resolve_property(args.property)
    print(f"Click detail — property {prop}  ({window_note(args.days)})\n")

    for event, param in (("nav_click", "link_text"), ("cta_click", "cta_id")):
        print(f"  {event}:")
        rows = run_report(
            prop,
            [f"customEvent:{param}"],
            ["eventCount"],
            args.days,
            limit=args.limit,
            dimension_filter={
                "filter": {
                    "fieldName": "eventName",
                    "stringFilter": {"value": event},
                }
            },
            order_by_metric="eventCount",
        )
        if not rows:
            print("    (no data — see the custom dimension note in SKILL.md)\n")
            continue
        table(["Value", "Clicks"], rows, numeric_from=1)
        print()


def cmd_funnel(args) -> None:
    """The /hire-me tool funnel — where recruiters drop off."""
    prop = resolve_property(args.property)
    print(f"Hire-me funnel — property {prop}  ({window_note(args.days)})\n")

    stages = [
        ("Visited /hire-me", "page_view"),
        ("Loaded a job description", "tool_job_loaded"),
        ("Started a generation run", "tool_run_started"),
        ("Run completed", "tool_run_completed"),
        ("Downloaded the .zip", "tool_download"),
    ]

    counts: list[tuple[str, int]] = []
    for label, event in stages:
        dim_filter = {
            "filter": {"fieldName": "eventName", "stringFilter": {"value": event}}
        }
        if event == "page_view":
            dim_filter = {
                "andGroup": {
                    "expressions": [
                        dim_filter,
                        {
                            "filter": {
                                "fieldName": "pagePath",
                                "stringFilter": {"value": "/hire-me"},
                            }
                        },
                    ]
                }
            }
        rows = run_report(prop, [], ["activeUsers"], args.days, dimension_filter=dim_filter)
        counts.append((label, int(rows[0][0]) if rows else 0))

    top = counts[0][1] or 1
    for i, (label, n) in enumerate(counts):
        pct = n / top * 100
        drop = ""
        if i > 0 and counts[i - 1][1] > 0:
            drop = f"   (-{(1 - n / counts[i - 1][1]) * 100:.0f}% from previous)"
        bar = "#" * int(pct / 3)
        print(f"  {label:<28} {n:>5}  {pct:>5.1f}%  {bar}{drop}")

    print("\n  Users, not events — one person doing two runs counts once per stage.")


def cmd_failures(args) -> None:
    """Failed generation runs, by reason."""
    prop = resolve_property(args.property)
    print(f"Tool failures — property {prop}  ({window_note(args.days)})\n")
    rows = run_report(
        prop,
        ["customEvent:reason", "customEvent:run_type"],
        ["eventCount"],
        args.days,
        limit=args.limit,
        dimension_filter={
            "filter": {
                "fieldName": "eventName",
                "stringFilter": {"value": "tool_run_failed"},
            }
        },
        order_by_metric="eventCount",
    )
    if not rows:
        print("  No failures recorded (or the custom dimensions are not registered yet).")
        return
    table(["Reason", "Run type", "Count"], rows, numeric_from=2)


def add_common_flags(parser: argparse.ArgumentParser, suppress: bool) -> None:
    """
    Shared flags, attached to BOTH the top-level parser and every subparser so
    they work on either side of the subcommand — `--days 7 pages` and
    `pages --days 7` are equivalent.

    On subparsers the defaults are SUPPRESSed, so an unspecified flag leaves the
    top-level value intact instead of clobbering it with a default.
    """
    kw = {"default": argparse.SUPPRESS} if suppress else {}
    parser.add_argument(
        "--property", help="numeric GA4 property ID (auto-detected if omitted)", **kw
    )
    parser.add_argument(
        "--days", type=int, help="lookback window (default: 28)",
        **(kw or {"default": 28}),
    )
    parser.add_argument(
        "--limit", type=int, help="rows to show (default: 25)",
        **(kw or {"default": 25}),
    )


def main() -> None:
    p = argparse.ArgumentParser(description="GA4 reports for samkirk.com")
    add_common_flags(p, suppress=False)
    sub = p.add_subparsers(dest="cmd", required=True)

    commands = [
        ("properties", "list GA4 properties", cmd_properties),
        ("overview", "users, sessions, engagement", cmd_overview),
        ("sources", "traffic by source/medium", cmd_sources),
        ("pages", "top pages by views", cmd_pages),
        ("events", "all events by count", cmd_events),
        ("clicks", "nav and CTA click detail", cmd_clicks),
        ("funnel", "the /hire-me tool funnel", cmd_funnel),
        ("failures", "failed generation runs", cmd_failures),
    ]
    for name, help_text, fn in commands:
        sp = sub.add_parser(name, help=help_text)
        add_common_flags(sp, suppress=True)
        sp.set_defaults(fn=fn)

    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
