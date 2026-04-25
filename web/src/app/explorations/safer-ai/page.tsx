import type { Metadata } from "next";
import { StaticHtmlViewer } from "@/components";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Safer AI — Leveson's System-Safety Framework Applied to Claude Models",
  description:
    "A four-month research project proposal for the Anthropic Fellows Program 2026, adapting Nancy G. Leveson's STAMP/STPA/CAST system-safety framework to the deployed-LLM context at Anthropic, with Claude's safety evaluation and red-teaming pipeline as the case study.",
  openGraph: {
    title: "Safer AI — Leveson's System-Safety Framework Applied to Claude Models",
    description:
      "A four-month research project proposal for the Anthropic Fellows Program 2026, adapting Nancy G. Leveson's STAMP/STPA/CAST system-safety framework to the deployed-LLM context at Anthropic, with Claude's safety evaluation and red-teaming pipeline as the case study.",
    url: `${SITE_URL}/explorations/safer-ai`,
    type: "website",
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  alternates: {
    canonical: `${SITE_URL}/explorations/safer-ai`,
  },
};

export default function SaferAIPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Safer AI
      </h1>
      <p className="mt-2 text-base text-text-secondary">
        Leveson&apos;s System-Safety Framework Applied to Claude Models — a
        research project proposal for the Anthropic Fellows Program (cohort
        July 2026).
      </p>
      <p className="mt-4 text-lg text-text-secondary">
        A four-month proposal adapting Nancy G. Leveson&apos;s system-safety
        engineering framework — STAMP, STPA, and CAST — to the deployed-LLM
        context at Anthropic. Anchored on four canonical Leveson texts and
        applied to Claude&apos;s safety evaluation and red-teaming pipeline as
        a case study, with a weekly working seminar that ships a concrete
        artifact each session. The deliverable is a written report and a
        minimum-viable prototype that translate Leveson&apos;s control-structure
        hazard analysis into a structured complement to Anthropic&apos;s existing
        empirical safety practice.
      </p>

      <div className="mt-6">
        <a
          href="/static/safer-ai.html"
          download="Leveson_Research_Project_Proposal_2026-04-24.html"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-primary px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:border-accent hover:bg-secondary"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download HTML
        </a>
      </div>

      <div className="mt-12">
        <StaticHtmlViewer
          src="safer-ai.html"
          title="Leveson's System-Safety Framework Applied to Claude Models — Research Project Proposal"
          minHeight={800}
        />
      </div>
    </div>
  );
}
