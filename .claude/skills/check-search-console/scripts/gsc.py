#!/usr/bin/env python3
"""
Google Search Console reporting for samkirk.com.

Answers the question GA4 structurally cannot: what did people actually type into
Google before they saw or clicked the site? Search Console is Google's own
server-side log of impressions, clicks, CTR, and average position per query.

Auth impersonates a service account that has been granted read access to the
Search Console property. Impersonation is used rather than user credentials
because Google blocks non-Cloud sensitive scopes (webmasters, analytics) on the
shared Google Cloud SDK OAuth client — `gcloud auth application-default login
--scopes=...webmasters.readonly` fails with "This app is blocked". See SKILL.md.

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
import urllib.parse
import urllib.request

API_ROOT = "https://searchconsole.googleapis.com/webmasters/v3"
DEFAULT_SITE = "sc-domain:samkirk.com"

SERVICE_ACCOUNT = os.environ.get(
    "SEO_SERVICE_ACCOUNT", "seo-reporting@samkirk-v3.iam.gserviceaccount.com"
)
SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"

_token_cache: str | None = None


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


def api(path: str, body: dict | None = None) -> dict:
    """Call the Search Console API. GET when body is None, else POST."""
    url = f"{API_ROOT}{path}"
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
                f"403 from Search Console API.\n{detail}\n\n"
                "Most likely: the service account has not been added as a user on the\n"
                "Search Console property. In the GSC UI, Settings -> Users and\n"
                "permissions -> Add user, paste:\n"
                f"  {SERVICE_ACCOUNT}\n"
                "with Full permission. Also confirm the API is enabled:\n"
                "  gcloud services enable searchconsole.googleapis.com --project=samkirk-v3"
            )
        sys.exit(f"HTTP {e.code} from {url}\n{detail}")


# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------


def date_range(days: int, lag: int = 2) -> tuple[str, str]:
    """
    Search Console data lags ~2 days. Ending the window at today would show a
    misleading drop-off, so shift the whole window back by `lag` days.
    """
    end = dt.date.today() - dt.timedelta(days=lag)
    start = end - dt.timedelta(days=days - 1)
    return start.isoformat(), end.isoformat()


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------


def render(rows: list[dict], key_label: str, limit: int) -> None:
    if not rows:
        print("  (no data in this window)")
        return

    key_w = max(len(key_label), *(len(str(r["keys"][0])) for r in rows[:limit]))
    key_w = min(key_w, 68)

    print(f"  {key_label:<{key_w}}  {'Clicks':>7}  {'Impr':>8}  {'CTR':>7}  {'Pos':>6}")
    print(f"  {'-' * key_w}  {'-' * 7}  {'-' * 8}  {'-' * 7}  {'-' * 6}")
    for r in rows[:limit]:
        key = str(r["keys"][0])
        if len(key) > key_w:
            key = key[: key_w - 1] + "…"
        print(
            f"  {key:<{key_w}}  {int(r['clicks']):>7}  {int(r['impressions']):>8}  "
            f"{r['ctr'] * 100:>6.1f}%  {r['position']:>6.1f}"
        )


def query_sc(site: str, days: int, dimension: str, limit: int, filters=None) -> list[dict]:
    start, end = date_range(days)
    body = {
        "startDate": start,
        "endDate": end,
        "dimensions": [dimension],
        "rowLimit": max(limit, 100),
    }
    if filters:
        body["dimensionFilterGroups"] = [{"filters": filters}]
    return api(f"/sites/{urllib.parse.quote(site, safe='')}/searchAnalytics/query", body).get(
        "rows", []
    )


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------


def cmd_sites(_args) -> None:
    """List every property this Google account can read."""
    entries = api("/sites").get("siteEntry", [])
    if not entries:
        print(
            "No Search Console properties visible to the service account.\n\n"
            "Auth is working — the API answered, it just has access to nothing.\n"
            "Grant it in the Search Console UI: pick the samkirk.com domain property,\n"
            "then Settings -> Users and permissions -> Add user:\n"
            f"  {SERVICE_ACCOUNT}\n"
            "with Full permission."
        )
        return
    print("Search Console properties:\n")
    for e in entries:
        print(f"  {e['siteUrl']:<45}  {e.get('permissionLevel', '?')}")


def cmd_queries(args) -> None:
    start, end = date_range(args.days)
    print(f"Top search queries — {args.site}  ({start} to {end})\n")
    rows = query_sc(args.site, args.days, "query", args.limit)
    render(rows, "Query", args.limit)

    total_c = sum(r["clicks"] for r in rows)
    total_i = sum(r["impressions"] for r in rows)
    print(f"\n  Totals across {len(rows)} queries: {int(total_c)} clicks, {int(total_i)} impressions")


def cmd_pages(args) -> None:
    start, end = date_range(args.days)
    print(f"Top landing pages — {args.site}  ({start} to {end})\n")
    rows = query_sc(args.site, args.days, "page", args.limit)
    render(rows, "Page", args.limit)


def cmd_countries(args) -> None:
    start, end = date_range(args.days)
    print(f"Traffic by country — {args.site}  ({start} to {end})\n")
    rows = query_sc(args.site, args.days, "country", args.limit)
    render(rows, "Country", args.limit)


def cmd_devices(args) -> None:
    start, end = date_range(args.days)
    print(f"Traffic by device — {args.site}  ({start} to {end})\n")
    rows = query_sc(args.site, args.days, "device", args.limit)
    render(rows, "Device", args.limit)


def cmd_opportunities(args) -> None:
    """
    Queries ranking just off page 1 with real impression volume.

    These are the highest-leverage SEO targets: Google already considers the page
    relevant, but position 8-20 gets a small fraction of the clicks position 1-5
    does. Moving one of these up is far cheaper than ranking a brand-new term.
    """
    start, end = date_range(args.days)
    rows = query_sc(args.site, args.days, "query", 500)

    picks = [
        r
        for r in rows
        if args.min_position <= r["position"] <= args.max_position
        and r["impressions"] >= args.min_impressions
    ]
    picks.sort(key=lambda r: r["impressions"], reverse=True)

    print(f"Striking-distance queries — {args.site}  ({start} to {end})")
    print(
        f"  position {args.min_position}-{args.max_position}, "
        f">= {args.min_impressions} impressions\n"
    )
    if not picks:
        print("  Nothing in range. Widen with --max-position or lower --min-impressions.")
        return
    render(picks, "Query", args.limit)
    print(
        "\n  These already rank. Strengthening the matching page's title, H1, and\n"
        "  body coverage for these exact terms is usually the cheapest win."
    )


def cmd_zero_click(args) -> None:
    """Queries with impressions but no clicks — a title/description problem."""
    start, end = date_range(args.days)
    rows = query_sc(args.site, args.days, "query", 500)

    picks = [
        r for r in rows if r["clicks"] == 0 and r["impressions"] >= args.min_impressions
    ]
    picks.sort(key=lambda r: r["impressions"], reverse=True)

    print(f"Zero-click queries — {args.site}  ({start} to {end})")
    print(f"  >= {args.min_impressions} impressions, 0 clicks\n")
    if not picks:
        print("  None found.")
        return
    render(picks, "Query", args.limit)
    print(
        "\n  Google shows the site for these but nobody clicks. If position is good\n"
        "  (< 10), the title/meta description is the problem, not the ranking."
    )


def add_common_flags(parser: argparse.ArgumentParser, suppress: bool) -> None:
    """
    Shared flags, attached to BOTH the top-level parser and every subparser so
    they work on either side of the subcommand — `--days 90 queries` and
    `queries --days 90` are equivalent.

    On subparsers the defaults are SUPPRESSed, so an unspecified flag leaves the
    top-level value intact instead of clobbering it with a default.
    """
    kw = {"default": argparse.SUPPRESS} if suppress else {}
    parser.add_argument(
        "--site", help=f"property (default: {DEFAULT_SITE})",
        **(kw or {"default": DEFAULT_SITE}),
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
    p = argparse.ArgumentParser(description="Search Console reports for samkirk.com")
    add_common_flags(p, suppress=False)
    sub = p.add_subparsers(dest="cmd", required=True)

    for name, help_text, fn in [
        ("sites", "list accessible properties", cmd_sites),
        ("queries", "top search queries", cmd_queries),
        ("pages", "top landing pages", cmd_pages),
        ("countries", "traffic by country", cmd_countries),
        ("devices", "traffic by device", cmd_devices),
    ]:
        sp = sub.add_parser(name, help=help_text)
        add_common_flags(sp, suppress=True)
        sp.set_defaults(fn=fn)

    opp = sub.add_parser("opportunities", help="queries just off page 1")
    add_common_flags(opp, suppress=True)
    opp.add_argument("--min-position", type=float, default=5.0)
    opp.add_argument("--max-position", type=float, default=20.0)
    opp.add_argument("--min-impressions", type=int, default=10)
    opp.set_defaults(fn=cmd_opportunities)

    zc = sub.add_parser("zero-click", help="impressions but no clicks")
    add_common_flags(zc, suppress=True)
    zc.add_argument("--min-impressions", type=int, default=10)
    zc.set_defaults(fn=cmd_zero_click)

    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
