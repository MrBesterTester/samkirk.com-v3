/** Shared SEO constants — single source of truth for all page metadata. */

export const SITE_URL = "https://samkirk.com";
export const SITE_NAME = "Sam Kirk";

export const SITE_DESCRIPTION =
  "Sam Kirk — genAI consultant. AI-augmented software and firmware test development. Claude Code, Cursor AI, and 45+ years in Silicon Valley.";

export const AUTHOR = {
  name: "Sam Kirk",
  url: SITE_URL,
  email: "sam@samkirk.com",
};

export const KEYWORDS = [
  "Sam Kirk",
  "Samuel Kirk",
  "sam@samkirk.com",
  "samkirk.com",
  "GenAI software engineer",
  "generative AI developer",
  "Claude Code",
  "Cursor AI",
  "full-stack TypeScript",
  "Next.js developer",
  "AI-powered tools",
  "hire me AI",
  "software engineer portfolio",
  "machine learning engineer",
  "robotics software engineer",
  // Geographic terms, narrowest to broadest. Fremont is exact (and matches the site header and
  // resume output); Bay Area and Silicon Valley are what recruiters actually search.
  "Fremont CA developer",
  "Bay Area software engineer",
  "Silicon Valley developer",
];

export const OG_IMAGE = `${SITE_URL}/og-card.png`;

/**
 * Google Analytics 4 Measurement ID.
 * Replace with your actual ID after creating the GA4 property.
 * See docs/GCP-DEPLOY.md Step 12 for setup instructions.
 */
export const GA_MEASUREMENT_ID = "G-QPGLH8V5MM";
