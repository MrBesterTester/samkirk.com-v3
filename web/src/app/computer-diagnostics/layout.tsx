import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Computer Diagnostics via LLM Fine-Tuning — Sam Kirk",
  description:
    "LoRA fine-tuned Llama 3.2 3B for hardware diagnostics on consumer hardware. 252 physics-grounded Q&A pairs from 40 years of expertise.",
  openGraph: {
    title: "Computer Diagnostics via LLM Fine-Tuning — Sam Kirk",
    description:
      "LoRA fine-tuned Llama 3.2 3B for hardware diagnostics on consumer hardware. 252 physics-grounded Q&A pairs from 40 years of expertise.",
    url: `${SITE_URL}/computer-diagnostics`,
    type: "website",
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  alternates: {
    canonical: `${SITE_URL}/computer-diagnostics`,
  },
};

export default function ComputerDiagnosticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
