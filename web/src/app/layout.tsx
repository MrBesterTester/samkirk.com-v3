import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Header, Footer } from "@/components";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  AUTHOR,
  KEYWORDS,
  OG_IMAGE,
  GA_MEASUREMENT_ID,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sam Kirk — GenAI Software Engineer | Cursor & Claude Code",
    template: "%s | Sam Kirk",
  },
  description: SITE_DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: "Sam Kirk — GenAI Software Engineer | Cursor & Claude Code",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: OG_IMAGE, alt: "Sam Kirk" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sam Kirk — GenAI Software Engineer | Cursor & Claude Code",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Sam Kirk",
  alternateName: ["Samuel Kirk", "Sam Kirk"],
  url: SITE_URL,
  email: AUTHOR.email,
  jobTitle: "GenAI Software Engineer",
  knowsAbout: [
    "Claude Code",
    "Cursor AI",
    "Generative AI",
    "TypeScript",
    "Next.js",
    "React",
    "Google Cloud Platform",
    "Full-Stack Development",
  ],
  sameAs: ["https://github.com/MrBesterTester", "https://www.linkedin.com/in/samuelkirk"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  author: {
    "@type": "Person",
    name: AUTHOR.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />

        {/* Google Analytics 4 — only loads when a real measurement ID is configured */}
        {GA_MEASUREMENT_ID && !GA_MEASUREMENT_ID.includes("XXXXXXXXXX") && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-config" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
