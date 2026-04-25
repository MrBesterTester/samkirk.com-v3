import type { Metadata } from "next";
import { StaticHtmlViewer } from "@/components";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Safer AI — Anthropic Fellows Program 2026 Essays",
  description:
    "Essay drafts for the Anthropic Fellows Program 2026, exploring how Nancy Leveson's STAMP/STPA systems-safety methodology can be applied to AI safety — drawing on four decades of test and diagnostic engineering.",
  openGraph: {
    title: "Safer AI — Anthropic Fellows Program 2026 Essays",
    description:
      "Essay drafts for the Anthropic Fellows Program 2026, exploring how Nancy Leveson's STAMP/STPA systems-safety methodology can be applied to AI safety — drawing on four decades of test and diagnostic engineering.",
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
      <p className="mt-4 text-lg text-text-secondary">
        Essay drafts for the Anthropic Fellows Program 2026 — exploring how
        Nancy Leveson&apos;s STAMP/STPA systems-safety methodology can be
        applied to AI safety, drawing on four decades of test and diagnostic
        engineering as the bridge between traditional safety engineering and
        modern red-teaming, evaluation, and reliability research.
      </p>

      <div className="mt-6">
        <a
          href="/static/safer-ai.html"
          download="SamuelKirk_Essays_Anthropic_Fellows_2026-04-23.html"
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
          title="Anthropic Fellows Program 2026 — Essay Drafts"
          minHeight={800}
        />
      </div>
    </div>
  );
}
