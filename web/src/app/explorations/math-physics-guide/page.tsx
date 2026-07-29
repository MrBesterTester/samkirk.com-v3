import type { Metadata } from "next";
import { StaticHtmlContent } from "@/components";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

const DESCRIPTION =
  "A guided tour of the principal differential equations of mathematical physics — organized by topic, with the ancestral and sibling relationships between the equations drawn out, and each equation's physical meaning stated plainly.";

export const metadata: Metadata = {
  title: "The Principal Equations of Mathematical Physics — Sam Kirk",
  description: DESCRIPTION,
  openGraph: {
    title: "The Principal Equations of Mathematical Physics",
    description: DESCRIPTION,
    url: `${SITE_URL}/explorations/math-physics-guide`,
    type: "website",
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  alternates: {
    canonical: `${SITE_URL}/explorations/math-physics-guide`,
  },
};

export default function MathPhysicsGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">
        The Principal Equations of Mathematical Physics
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        A guided tour of the differential equations physics actually runs on — organized by topic,
        with the ancestral and sibling relationships drawn out, and each equation&apos;s meaning
        stated plainly rather than left implicit in the notation.
      </p>
      <p className="mt-4 text-text-secondary">
        The value is in the <em>relationships</em>: which equation is a special case of which, which
        two are the same idea in different clothes, and where the family resemblances run. Seeing
        them laid out together is a different thing from meeting them one at a time in separate
        courses.
      </p>

      <div className="mt-12">
        <StaticHtmlContent
          src="math-physics-guide.html"
          pageHeading="The Principal Equations of Mathematical Physics"
          title="The Principal Equations of Mathematical Physics — reconstructed guide"
        />
      </div>
    </div>
  );
}
