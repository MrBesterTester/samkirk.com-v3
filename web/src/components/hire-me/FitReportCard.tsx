"use client";

import { useState } from "react";
import type { FitReportMessage } from "./ChatStream";

// ============================================================================
// Props
// ============================================================================

export interface FitReportCardProps {
  message: FitReportMessage;
}

// ============================================================================
// ScoreBadge
// ============================================================================

function ScoreBadge({
  score,
  size = "sm",
}: {
  score: "Well" | "Average" | "Poorly";
  size?: "sm" | "lg";
}) {
  const colors =
    score === "Well"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : score === "Average"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

  const icon = score === "Well" ? "\u2713" : score === "Average" ? "~" : "\u2717";

  const sizeClasses =
    size === "lg"
      ? "rounded-full px-4 py-1.5 text-base font-semibold"
      : "rounded-full px-3 py-1 text-sm font-medium";

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses} ${colors}`}>
      <span>{icon}</span>
      {score}
    </span>
  );
}

// ============================================================================
// FitReportCard
// ============================================================================

export function FitReportCard({ message }: FitReportCardProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/submissions/${message.submissionId}/download`
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fit-report-${message.submissionId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail — user sees the button reset
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800/50">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Fit Report
          </h3>
          <ScoreBadge score={message.overallScore} size="lg" />
        </div>

        {/* Extracted context */}
        {message.extracted &&
          (message.extracted.title || message.extracted.company) && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {[message.extracted.title, message.extracted.company]
                .filter(Boolean)
                .join(" at ")}
            </p>
          )}

        {/* Recommendation */}
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-700/40">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Recommendation
          </p>
          <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {message.recommendation}
          </p>
        </div>

        {/* Category Breakdown */}
        {message.categories.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Category Breakdown
            </p>
            <div className="space-y-2">
              {message.categories.map((cat) => (
                <div
                  key={cat.name}
                  className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-700"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {cat.name}
                    </span>
                    <ScoreBadge
                      score={cat.score as "Well" | "Average" | "Poorly"}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {cat.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unknowns */}
        {message.unknowns.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/20">
            <p className="mb-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              Could Not Determine
            </p>
            <ul className="space-y-1">
              {message.unknowns.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300"
                >
                  <span className="mt-0.5 shrink-0">?</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {downloading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}
