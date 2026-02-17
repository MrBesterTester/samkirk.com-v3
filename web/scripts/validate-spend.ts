/**
 * Spend validation script — reads the current month's spend from Firestore
 * and prints a comparison report.
 *
 * Run with: cd web && npm run validate:spend
 *
 * This script:
 * 1. Reads the Firestore spendMonthly/{YYYY-MM} document
 * 2. Prints: estimated spend, budget, % used, pricing constants
 * 3. Prints: GCP Billing console URL for manual comparison
 * 4. Warns if LAST_PRICING_REVIEW is stale (>30 days)
 *
 * Prerequisites:
 * - GCP credentials set up (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
 * - web/.env.local file with GCP_PROJECT_ID
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from the web directory
config({ path: resolve(__dirname, "../.env.local") });

import { Firestore, Timestamp } from "@google-cloud/firestore";
import { z } from "zod";

// ============================================================================
// Duplicated Constants
// (server-only guard in source files prevents direct import in tsx scripts)
// ============================================================================

// Mirrored from src/lib/spend-cap.ts (server-only guard prevents direct import)
const SPEND_CAP_USD = 20;
const COST_PER_1K_INPUT_TOKENS_USD = 0.00125;
const COST_PER_1K_OUTPUT_TOKENS_USD = 0.00375;
const MIN_COST_PER_CALL_USD = 0.001;
const DEFAULT_MONTHLY_BUDGET_USD = SPEND_CAP_USD;

// Mirrored from src/lib/firestore.ts (server-only guard prevents direct import)
interface SpendMonthlyDoc {
  usdBudget: number;
  usdUsedEstimated: number;
  updatedAt: Timestamp;
}

/**
 * Date of last manual review of Vertex AI pricing against GCP console.
 * Update this whenever you verify the COST_PER_1K_*_TOKENS_USD constants
 * match actual GCP pricing.
 */
const LAST_PRICING_REVIEW = new Date("2026-02-16");

const STALE_THRESHOLD_DAYS = 30;

// ============================================================================
// Environment & Firestore Init
// ============================================================================

const envSchema = z.object({
  GCP_PROJECT_ID: z.string().min(1),
});

const env = envSchema.parse(process.env);
const firestore = new Firestore({ projectId: env.GCP_PROJECT_ID });

// ============================================================================
// Helpers
// ============================================================================

function getMonthKeyForDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function log(message: string, success?: boolean): void {
  const prefix =
    success === true ? "\u2713" : success === false ? "\u2717" : "\u2192";
  console.log(`${prefix} ${message}`);
}

function warn(message: string): void {
  console.log(`\u26A0 ${message}`);
}

function header(title: string): void {
  console.log();
  console.log(`${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const now = new Date();
  const monthKey = getMonthKeyForDate(now);

  header("Spend Validation Report");
  console.log();
  log(`Month:      ${monthKey}`);
  log(`Timestamp:  ${now.toISOString()}`);
  log(`Project:    ${env.GCP_PROJECT_ID}`);

  // ── Fetch spend document ────────────────────────────────────────────────
  header("Firestore Spend Data");
  console.log();

  const docRef = firestore.doc(`spendMonthly/${monthKey}`);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    log(`No spendMonthly/${monthKey} document found`, false);
    log("This means no LLM calls have been recorded this month.");
    console.log();
  } else {
    const doc = snapshot.data() as SpendMonthlyDoc;
    const percentUsed = (doc.usdUsedEstimated / doc.usdBudget) * 100;
    const remaining = Math.max(0, doc.usdBudget - doc.usdUsedEstimated);
    const isCapReached = doc.usdUsedEstimated >= doc.usdBudget;
    const updatedAt =
      doc.updatedAt instanceof Timestamp
        ? doc.updatedAt.toDate().toISOString()
        : String(doc.updatedAt);

    log(`Estimated spend:  $${doc.usdUsedEstimated.toFixed(4)}`, true);
    log(`Budget:           $${doc.usdBudget.toFixed(2)}`);
    log(`Remaining:        $${remaining.toFixed(4)}`);
    log(`Percent used:     ${percentUsed.toFixed(2)}%`);
    log(`Last updated:     ${updatedAt}`);

    if (isCapReached) {
      warn("SPEND CAP REACHED — tool requests will be blocked!");
    } else if (percentUsed >= 80) {
      warn(`Spend is at ${percentUsed.toFixed(1)}% of budget — approaching cap.`);
    } else {
      log("Spend is within budget.", true);
    }
    console.log();
  }

  // ── Pricing constants ───────────────────────────────────────────────────
  header("Pricing Constants (from spend-cap.ts)");
  console.log();

  log(`SPEND_CAP_USD:                  $${SPEND_CAP_USD}`);
  log(`DEFAULT_MONTHLY_BUDGET_USD:     $${DEFAULT_MONTHLY_BUDGET_USD}`);
  log(`COST_PER_1K_INPUT_TOKENS_USD:   $${COST_PER_1K_INPUT_TOKENS_USD}`);
  log(`COST_PER_1K_OUTPUT_TOKENS_USD:  $${COST_PER_1K_OUTPUT_TOKENS_USD}`);
  log(`MIN_COST_PER_CALL_USD:          $${MIN_COST_PER_CALL_USD}`);

  // ── Pricing review staleness check ──────────────────────────────────────
  console.log();
  const daysSinceReview = Math.floor(
    (now.getTime() - LAST_PRICING_REVIEW.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceReview > STALE_THRESHOLD_DAYS) {
    warn(
      `LAST_PRICING_REVIEW is ${daysSinceReview} days ago (${LAST_PRICING_REVIEW.toISOString().slice(0, 10)}). ` +
        "Review Vertex AI pricing and update the constants if needed."
    );
  } else {
    log(
      `LAST_PRICING_REVIEW: ${LAST_PRICING_REVIEW.toISOString().slice(0, 10)} (${daysSinceReview} days ago)`,
      true
    );
  }

  // ── GCP Billing link ────────────────────────────────────────────────────
  header("Manual Verification");
  console.log();
  log("Compare the estimated spend above with actual GCP billing:");
  console.log(
    `  https://console.cloud.google.com/billing?project=${env.GCP_PROJECT_ID}`
  );
  console.log();
  log("Vertex AI pricing page:");
  console.log("  https://cloud.google.com/vertex-ai/generative-ai/pricing");
  console.log();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error();
    console.error("\u2717 Spend validation failed:", err);
    process.exit(1);
  });
