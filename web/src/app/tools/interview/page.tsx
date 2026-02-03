"use client";

import { ToolGate } from "@/components";

function InterviewToolContent() {
  return (
    <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        Tool implementation coming soon. This page will provide an interactive
        chat interface for career-related questions.
      </p>
    </div>
  );
}

export default function InterviewToolPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Interview Me Now
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Have an interactive conversation to learn about Sam Kirk&apos;s career,
        skills, and experience.
      </p>

      <div className="mt-8">
        <ToolGate toolName="Interview Me Now">
          <InterviewToolContent />
        </ToolGate>
      </div>
    </div>
  );
}
