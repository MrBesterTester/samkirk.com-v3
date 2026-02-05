"use client";

import Link from "next/link";

function getBuildDate(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `v${get("month")}-${get("day")}-${get("year")}_${get("hour")}:${get("minute")}`;
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const buildDate = getBuildDate();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              &copy; {currentYear} Sam Kirk. All rights reserved.
            </p>
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500">
              {buildDate}
            </p>
          </div>
          <div className="flex gap-6">
            <Link
              href="mailto:sam@samkirk.com"
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              sam@samkirk.com
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
