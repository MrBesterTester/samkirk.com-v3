import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sam's Dance Menu — Weekly Curated Playlists",
  description:
    "View and download Sam Kirk's weekly dance menu with curated playlists for social dancing.",
  openGraph: {
    title: "Sam's Dance Menu — Weekly Curated Playlists",
    description:
      "View and download Sam Kirk's weekly dance menu with curated playlists for social dancing.",
    url: `${SITE_URL}/dance-menu`,
    type: "website",
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  alternates: {
    canonical: `${SITE_URL}/dance-menu`,
  },
};

export default function DanceMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
