import "server-only";

import { Timestamp } from "@google-cloud/firestore";
import {
  getSpendMonthlyRef,
  getCurrentMonthKey,
  type SpendMonthlyDoc,
} from "./firestore";

// ============================================================================
// Constants
// ============================================================================

/** Monthly spend cap in USD */
export const SPEND_CAP_USD = 20;

/** Contact email for spend cap exceeded message */
export const SPEND_CAP_CONTACT_EMAIL = "sam@samkirk.com";

/** Default budget to initialize new monthly spend docs */
export const DEFAULT_MONTHLY_BUDGET_USD = SPEND_CAP_USD;

// ============================================================================
// Cost Estimation Constants (for Vertex AI Gemini)
// ============================================================================

/**
 * Estimated cost per 1000 input tokens in USD.
 * Based on Gemini Pro pricing (conservative estimate).
 * Actual pricing varies by model; this is a safe upper bound.
 */
export const COST_PER_1K_INPUT_TOKENS_USD = 0.00125;

/**
 * Estimated cost per 1000 output tokens in USD.
 * Based on Gemini Pro pricing (conservative estimate).
 */
export const COST_PER_1K_OUTPUT_TOKENS_USD = 0.00375;

/**
 * Minimum cost to record per LLM call (floor to avoid rounding to zero).
 * This ensures even small requests count toward the budget.
 */
export const MIN_COST_PER_CALL_USD = 0.001;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error thrown when the monthly spend cap is exceeded.
 */
export class SpendCapError extends Error {
  readonly code = "SPEND_CAP_EXCEEDED";
  readonly statusCode = 503;
  readonly contactEmail: string;
  readonly currentSpendUsd: number;
  readonly budgetUsd: number;

  constructor(currentSpendUsd: number, budgetUsd: number = SPEND_CAP_USD) {
    super(
      `Monthly spend cap reached. Tool temporarily unavailable. Please contact ${SPEND_CAP_CONTACT_EMAIL} for assistance.`
    );
    this.name = "SpendCapError";
    this.contactEmail = SPEND_CAP_CONTACT_EMAIL;
    this.currentSpendUsd = currentSpendUsd;
    this.budgetUsd = budgetUsd;
  }

  /**
   * Get the error as a JSON response payload.
   */
  toJSON() {
    return {
      error: "spend_cap_exceeded",
      message: this.message,
      contactEmail: this.contactEmail,
    };
  }
}

// ============================================================================
// Month Key Helpers
// ============================================================================

/**
 * Get the month key for a given date in YYYY-MM format.
 * Uses UTC to ensure consistent behavior across timezones.
 *
 * @param date - The date to get the month key for
 * @returns The month key in YYYY-MM format
 */
export function getMonthKeyForDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Parse a month key back into a Date (first day of the month).
 *
 * @param monthKey - The month key in YYYY-MM format
 * @returns A Date object for the first day of that month (UTC)
 */
export function parseMonthKey(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

/**
 * Get the month key for the next month.
 *
 * @param monthKey - The current month key in YYYY-MM format
 * @returns The next month's key in YYYY-MM format
 */
export function getNextMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  // Handle year rollover: month 12 -> next year month 01
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// ============================================================================
// Cost Estimation
// ============================================================================

/**
 * Estimate the cost of an LLM call based on token counts.
 *
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Estimated cost in USD
 */
export function estimateLlmCost(
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1000) * COST_PER_1K_INPUT_TOKENS_USD;
  const outputCost = (outputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS_USD;
  const totalCost = inputCost + outputCost;

  // Apply minimum cost floor
  return Math.max(totalCost, MIN_COST_PER_CALL_USD);
}

/**
 * Estimate tokens from text length (rough approximation).
 * Uses a conservative estimate of ~4 characters per token.
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokensFromText(text: string): number {
  // Conservative estimate: ~4 characters per token on average
  // This may overestimate for English text but provides a safety margin
  return Math.ceil(text.length / 4);
}

// ============================================================================
// Spend Tracking
// ============================================================================

/**
 * Create a new monthly spend document with default values.
 *
 * @param budgetUsd - The budget for this month (defaults to SPEND_CAP_USD)
 * @returns A new SpendMonthlyDoc
 */
export function createSpendMonthlyDoc(
  budgetUsd: number = DEFAULT_MONTHLY_BUDGET_USD
): SpendMonthlyDoc {
  return {
    usdBudget: budgetUsd,
    usdUsedEstimated: 0,
    updatedAt: Timestamp.now(),
  };
}

/**
 * Check if the spend cap has been exceeded.
 *
 * @param doc - The current spend document
 * @returns true if the budget has been exceeded
 */
export function isSpendCapExceeded(doc: SpendMonthlyDoc): boolean {
  return doc.usdUsedEstimated >= doc.usdBudget;
}

/**
 * Calculate the remaining budget.
 *
 * @param doc - The current spend document
 * @returns Remaining budget in USD (0 if exceeded)
 */
export function getRemainingBudget(doc: SpendMonthlyDoc): number {
  return Math.max(0, doc.usdBudget - doc.usdUsedEstimated);
}

// ============================================================================
// Spend Cap Enforcement
// ============================================================================

/**
 * Get or create the current month's spend document.
 *
 * @param monthKey - Optional month key (defaults to current month)
 * @returns The spend document for the month
 */
export async function getOrCreateSpendDoc(
  monthKey?: string
): Promise<SpendMonthlyDoc> {
  const key = monthKey ?? getCurrentMonthKey();
  const spendRef = getSpendMonthlyRef(key);

  const snapshot = await spendRef.get();

  if (snapshot.exists) {
    return snapshot.data() as SpendMonthlyDoc;
  }

  // Create a new document for this month
  const newDoc = createSpendMonthlyDoc();
  await spendRef.set(newDoc);
  return newDoc;
}

/**
 * Enforce the monthly spend cap.
 *
 * Call this before making any LLM request. It will throw a SpendCapError
 * if the monthly budget has been exhausted.
 *
 * @throws SpendCapError if the spend cap has been exceeded
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   try {
 *     await enforceSpendCap();
 *     // ... make LLM call
 *     await recordSpend(estimatedCost);
 *   } catch (error) {
 *     if (error instanceof SpendCapError) {
 *       return NextResponse.json(error.toJSON(), { status: error.statusCode });
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */
export async function enforceSpendCap(): Promise<void> {
  const doc = await getOrCreateSpendDoc();

  if (isSpendCapExceeded(doc)) {
    throw new SpendCapError(doc.usdUsedEstimated, doc.usdBudget);
  }
}

/**
 * Record spend after an LLM call.
 *
 * This atomically increments the spend counter using a Firestore transaction
 * to ensure accuracy under concurrent requests.
 *
 * @param deltaUsd - The amount to add to the spend counter (in USD)
 * @param monthKey - Optional month key (defaults to current month)
 * @returns The updated spend document
 */
export async function recordSpend(
  deltaUsd: number,
  monthKey?: string
): Promise<SpendMonthlyDoc> {
  const key = monthKey ?? getCurrentMonthKey();
  const spendRef = getSpendMonthlyRef(key);
  const firestore = spendRef.firestore;

  const result = await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(spendRef);

    let doc: SpendMonthlyDoc;

    if (snapshot.exists) {
      const existingDoc = snapshot.data() as SpendMonthlyDoc;
      doc = {
        usdBudget: existingDoc.usdBudget,
        usdUsedEstimated: existingDoc.usdUsedEstimated + deltaUsd,
        updatedAt: Timestamp.now(),
      };
    } else {
      // Create new doc with the delta already applied
      doc = {
        usdBudget: DEFAULT_MONTHLY_BUDGET_USD,
        usdUsedEstimated: deltaUsd,
        updatedAt: Timestamp.now(),
      };
    }

    transaction.set(spendRef, doc);
    return doc;
  });

  return result;
}

/**
 * Record spend based on token counts.
 *
 * Convenience wrapper that estimates cost from tokens and records it.
 *
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens generated
 * @param monthKey - Optional month key (defaults to current month)
 * @returns The updated spend document
 */
export async function recordSpendFromTokens(
  inputTokens: number,
  outputTokens: number,
  monthKey?: string
): Promise<SpendMonthlyDoc> {
  const cost = estimateLlmCost(inputTokens, outputTokens);
  return recordSpend(cost, monthKey);
}

/**
 * Get the current spend status for display purposes.
 *
 * @param monthKey - Optional month key (defaults to current month)
 * @returns Current spend status or null if no spend doc exists
 */
export async function getSpendStatus(monthKey?: string): Promise<{
  usedUsd: number;
  budgetUsd: number;
  remainingUsd: number;
  percentUsed: number;
  isCapReached: boolean;
} | null> {
  const key = monthKey ?? getCurrentMonthKey();
  const spendRef = getSpendMonthlyRef(key);

  const snapshot = await spendRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const doc = snapshot.data() as SpendMonthlyDoc;

  return {
    usedUsd: doc.usdUsedEstimated,
    budgetUsd: doc.usdBudget,
    remainingUsd: getRemainingBudget(doc),
    percentUsed: (doc.usdUsedEstimated / doc.usdBudget) * 100,
    isCapReached: isSpendCapExceeded(doc),
  };
}
