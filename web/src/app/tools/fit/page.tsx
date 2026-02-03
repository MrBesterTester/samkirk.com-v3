"use client";

import { ToolGate } from "@/components";

function FitToolContent() {
  return (
    <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        Tool implementation coming soon. This page will include job input
        (paste/URL/file), follow-up questions, and a detailed fit report.
      </p>
    </div>
  );
}

export default function FitToolPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        How Do I Fit?
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Submit a job posting and get a detailed analysis of how well Sam Kirk
        fits the role.
      </p>

      <div className="mt-8">
        <ToolGate toolName="How Do I Fit?">
          <FitToolContent />
        </ToolGate>
      </div>
    </div>
  );
}
