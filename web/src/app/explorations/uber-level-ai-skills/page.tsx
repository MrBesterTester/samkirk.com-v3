import type { Metadata } from "next";
import { StaticHtmlViewer } from "@/components";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Uber Level AI Skills — Advanced AI Techniques",
  description:
    "Advanced techniques for getting the most out of AI tools, taken from Nate B. Jones.",
  openGraph: {
    title: "Uber Level AI Skills — Advanced AI Techniques",
    description:
      "Advanced techniques for getting the most out of AI tools, taken from Nate B. Jones.",
    url: `${SITE_URL}/explorations/uber-level-ai-skills`,
    type: "website",
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  alternates: {
    canonical: `${SITE_URL}/explorations/uber-level-ai-skills`,
  },
};

export default function UberLevelAiSkillsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        Uber Level AI Skills
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        Advanced techniques for getting the most out of AI tools, taken from
        Nate B. Jones.
      </p>

      <div className="mt-6">
        <a
          href="/static/uber-level-ai-skills.html"
          download="uber-level-ai-skills.html"
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
          src="uber-level-ai-skills.html"
          title="Uber Level AI Skills content"
          minHeight={700}
        />
      </div>
    </div>
  );
}
