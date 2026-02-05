"use client";

import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

export interface ToolPreviewProps {
  /** Card title */
  title: string;
  /** Short description of the tool */
  description: string;
  /** Optional rich preview content rendered between description and CTA */
  previewContent?: React.ReactNode;
  /** Label for the call-to-action link */
  ctaText: string;
  /** Destination URL for the CTA */
  ctaLink: string;
  /** Optional icon rendered beside the title */
  icon?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Reusable card component for previewing a tool or feature.
 * Matches the card styling from the homepage hiring-manager section.
 */
export function ToolPreview({
  title,
  description,
  previewContent,
  ctaText,
  ctaLink,
  icon,
}: ToolPreviewProps) {
  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700">
      {/* Header row: optional icon + title */}
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex-shrink-0 text-accent" aria-hidden="true">
            {icon}
          </span>
        )}
        <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
          {title}
        </h3>
      </div>

      {/* Description */}
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>

      {/* Optional preview content */}
      {previewContent && (
        <div className="mt-4 rounded-lg border border-border bg-secondary p-4">
          {previewContent}
        </div>
      )}

      {/* CTA link */}
      <Link
        href={ctaLink}
        className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-hover transition-colors"
      >
        {ctaText} &rarr;
      </Link>
    </div>
  );
}
