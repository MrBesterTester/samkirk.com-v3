import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Hire Me — AI-Powered Candidate Evaluation",
  description:
    "Evaluate Sam Kirk's fit for your role using AI-powered tools. Generate tailored resumes, analyze fitness reports, or chat about professional experience.",
  openGraph: {
    title: "Hire Me — AI-Powered Candidate Evaluation",
    description:
      "Evaluate Sam Kirk's fit for your role using AI-powered tools. Generate tailored resumes, analyze fitness reports, or chat about professional experience.",
    url: `${SITE_URL}/hire-me`,
    type: "website",
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  alternates: {
    canonical: `${SITE_URL}/hire-me`,
  },
};

export default function HireMeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
