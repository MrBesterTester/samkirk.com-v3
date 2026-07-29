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
 * A static artifact download (an exploration write-up). `artifactId` is stable
 * even if the underlying filename changes, which the automatic `file_download`
 * event cannot promise.
 */
export function DownloadLink({
  href,
  artifactId,
  downloadName,
  className,
  children,
}: BaseProps & { artifactId: string; downloadName: string }) {
  return (
    <a
      href={href}
      download={downloadName}
      className={className}
      onClick={() => trackArtifactDownload(artifactId)}
    >
      {children}
    </a>
  );
}
