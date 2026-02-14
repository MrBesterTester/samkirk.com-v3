"use client";

import { useState } from "react";
import type { ResumePreviewMessage } from "./ChatStream";

// ============================================================================
// Props
// ============================================================================

export interface ResumePreviewCardProps {
  message: ResumePreviewMessage;
}

// ============================================================================
// StatBox
// ============================================================================

function StatBox({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: "blue" | "green" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    green:
      "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    purple:
      "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div
      className={`rounded-lg p-3 text-center ${colorClasses[color]}`}
    >
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

// ============================================================================
// ResumePreviewCard
// ============================================================================

export function ResumePreviewCard({ message }: ResumePreviewCardProps) {
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
      a.download = `custom-resume-${message.submissionId}.zip`;
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

  const pageEstimate = message.wordCount > 400 ? 2 : 1;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800/50">
        {/* Header */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Custom Resume
          </h3>
        </div>

        {/* Candidate header card */}
        <div className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-700">
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {message.header.name}
          </p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {message.header.title}
          </p>
          {(message.header.email || message.header.location) && (
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {message.header.email && <span>{message.header.email}</span>}
              {message.header.location && (
                <span>{message.header.location}</span>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-700/40">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Summary
          </p>
          <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {message.summary}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox
            value={message.experienceCount}
            label="Experience"
            color="blue"
          />
          <StatBox value={message.skillsCount} label="Skills" color="green" />
          <StatBox
            value={`${pageEstimate} Page`}
            label="Resume"
            color="purple"
          />
        </div>

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
              Download Resume
            </>
          )}
        </button>
      </div>
    </div>
  );
}
