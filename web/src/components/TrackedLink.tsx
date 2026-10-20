"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  trackArtifactDownload,
  trackContactClick,
  trackCtaClick,
  type ContactMethod,
} from "@/lib/analytics";

/**
 * Thin client-side wrappers that let server components keep their server-render
 * while still emitting a GA4 event on click. Without these, adding an onClick to
 * a link would force the whole page into a client component.
 *
 * Deliberately NOT used for plain outbound links (GitHub, photo-fun, etc.) —
 * GA4 Enhanced Measurement already tracks those, and duplicating them would
 * double-count.
 */

type BaseProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

/**
 * An internal call-to-action link. `ctaId` is a stable slug that should survive
 * copy changes so historical reports stay comparable.
 */
export function CtaLink({
  href,
  ctaId,
  label,
  className,
  children,
}: BaseProps & { ctaId: string; label?: string }) {
  return (
    <Link href={href} className={className} onClick={() => trackCtaClick(ctaId, label)}>
      {children}
    </Link>
  );
}

/**
 * An outbound contact link (calendar booking, LinkedIn, mailto). Renders a plain
 * anchor so external targets and mailto behave normally.
 */
export function ContactLink({
  href,
  method,
  className,
  children,
  newTab = true,
}: BaseProps & { method: ContactMethod; newTab?: boolean }) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackContactClick(method)}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

/**
 * A static artifact (an exploration write-up or brief). `artifactId` is stable
 * even if the underlying filename changes, which the automatic `file_download`
 * event cannot promise.
 *
 * Always opens the file in a new tab rather than downloading it directly.
 * Vercel's bot protection can answer a request with its "Security Checkpoint"
 * page; a direct download cannot run that challenge, so the browser saves the
 * checkpoint page under the file's name (seen in Safari, Oct 20, 2026). A page
 * navigation passes the challenge, then the browser shows the file, which the
 * reader can save from there.
 */
export function DownloadLink({
  href,
  artifactId,
  className,
  children,
}: BaseProps & { artifactId: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackArtifactDownload(artifactId)}
    >
      {children}
    </a>
  );
}
