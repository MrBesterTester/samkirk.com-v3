import type { Metadata } from "next";
import Link from "next/link";
import { StaticHtmlViewer } from "@/components";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "The Physics of LoRA — Sam Kirk",
  description:
    "A unified physics interpretation of LoRA fine-tuning: from thermodynamic perturbation theory at the macro level to normal-mode decomposition at the micro level.",
  openGraph: {
    title: "The Physics of LoRA — Sam Kirk",
    description:
      "A unified physics interpretation of LoRA fine-tuning: from thermodynamic perturbation theory at the macro level to normal-mode decomposition at the micro level.",
    url: `${SITE_URL}/computer-diagnostics/physics-of-lora`,
    type: "website",
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  alternates: {
    canonical: `${SITE_URL}/computer-diagnostics/physics-of-lora`,
  },
};

export default function PhysicsOfLoraPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/computer-diagnostics"
        className="text-sm font-medium text-accent hover:text-accent-hover"
      >
        &larr; Computer Diagnostics
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary">
        The Physics of LoRA
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        A unified physics interpretation of LoRA fine-tuning &mdash; from
        thermodynamic perturbation theory at the macro level to normal-mode
        decomposition at the micro level.
      </p>

      <div className="mt-12">
        <StaticHtmlViewer
          src="physics-of-lora.html"
          title="The Physics of LoRA"
          minHeight={800}
        />
      </div>
    </div>
  );
}
