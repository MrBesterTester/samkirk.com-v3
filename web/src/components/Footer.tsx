"use client";

import Link from "next/link";
import { trackContactClick } from "@/lib/analytics";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE ?? "dev";

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
            onClick={() => trackContactClick("linkedin")}
          >
            LinkedIn
          </a>
          <div className="flex gap-6">
            {/* mailto: is not covered by GA4 Enhanced Measurement's outbound-click
                tracking, so it needs an explicit event. */}
            <Link
              href="mailto:sam@samkirk.com"
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              onClick={() => trackContactClick("email")}
            >
              sam@samkirk.com
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
