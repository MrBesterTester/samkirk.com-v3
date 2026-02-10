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
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p className="text-sm text-text-secondary">
              &copy; {currentYear} Sam Kirk. All rights reserved.
            </p>
            <p className="text-xs font-mono text-text-muted">
              {buildDate}
            </p>
          </div>
          <a
            href="https://www.linkedin.com/in/samuelkirk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            LinkedIn
          </a>
          <div className="flex gap-6">
            <Link
              href="mailto:sam@samkirk.com"
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              sam@samkirk.com
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
