import { describe, it, expect, vi, beforeEach } from "vitest";
import { Timestamp } from "@google-cloud/firestore";

// Mock server-only to allow tests to run
vi.mock("server-only", () => ({}));

// Mock the firestore module
const mockSet = vi.fn();
const mockGet = vi.fn();
const mockRunTransaction = vi.fn();

vi.mock("./firestore", () => ({
  getSpendMonthlyRef: vi.fn(() => ({
    set: mockSet,
    get: mockGet,
    firestore: {
      runTransaction: mockRunTransaction,
    },
  })),
  getCurrentMonthKey: vi.fn(() => "2026-02"),
}));

// Import after mocks
import {
  SPEND_CAP_USD,
  SPEND_CAP_CONTACT_EMAIL,
  DEFAULT_MONTHLY_BUDGET_USD,
  COST_PER_1K_INPUT_TOKENS_USD,
  COST_PER_1K_OUTPUT_TOKENS_USD,
  MIN_COST_PER_CALL_USD,
  SpendCapError,
  getMonthKeyForDate,
  parseMonthKey,
  getNextMonthKey,
  estimateLlmCost,
  estimateTokensFromText,
  createSpendMonthlyDoc,
  isSpendCapExceeded,
  getRemainingBudget,
} from "./spend-cap";
import type { SpendMonthlyDoc } from "./firestore";

describe("spend-cap module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constants", () => {
    it("defines SPEND_CAP_USD as $20", () => {
      expect(SPEND_CAP_USD).toBe(20);
    });

    it("defines SPEND_CAP_CONTACT_EMAIL as 'sam@samkirk.com'", () => {
      expect(SPEND_CAP_CONTACT_EMAIL).toBe("sam@samkirk.com");
    });

    it("defines DEFAULT_MONTHLY_BUDGET_USD equal to SPEND_CAP_USD", () => {
      expect(DEFAULT_MONTHLY_BUDGET_USD).toBe(SPEND_CAP_USD);
    });

    it("defines positive cost per 1K input tokens", () => {
      expect(COST_PER_1K_INPUT_TOKENS_USD).toBeGreaterThan(0);
    });

    it("defines positive cost per 1K output tokens", () => {
      expect(COST_PER_1K_OUTPUT_TOKENS_USD).toBeGreaterThan(0);
    });

    it("defines output tokens as more expensive than input tokens", () => {
      expect(COST_PER_1K_OUTPUT_TOKENS_USD).toBeGreaterThan(
        COST_PER_1K_INPUT_TOKENS_USD
      );
    });

    it("defines a minimum cost per call", () => {
      expect(MIN_COST_PER_CALL_USD).toBeGreaterThan(0);
      expect(MIN_COST_PER_CALL_USD).toBeLessThan(0.01);
    });
  });

  describe("SpendCapError", () => {
    it("creates an error with correct properties", () => {
      const error = new SpendCapError(15.5, 20);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("SpendCapError");
      expect(error.code).toBe("SPEND_CAP_EXCEEDED");
      expect(error.statusCode).toBe(503);
      expect(error.currentSpendUsd).toBe(15.5);
      expect(error.budgetUsd).toBe(20);
      expect(error.contactEmail).toBe("sam@samkirk.com");
    });

    it("has a message with contact email", () => {
      const error = new SpendCapError(20, 20);
      expect(error.message).toContain("sam@samkirk.com");
      expect(error.message).toContain("temporarily unavailable");
    });

    it("uses default budget if not provided", () => {
      const error = new SpendCapError(25);
      expect(error.budgetUsd).toBe(SPEND_CAP_USD);
    });

    it("can be serialized to JSON", () => {
      const error = new SpendCapError(20, 20);
      const json = error.toJSON();

      expect(json).toEqual({
        error: "spend_cap_exceeded",
        message: expect.stringContaining("temporarily unavailable"),
        contactEmail: "sam@samkirk.com",
      });
    });

    it("JSON does not expose internal spend details", () => {
      const error = new SpendCapError(19.99, 20);
      const json = error.toJSON();

      // Should not expose current spend or budget in JSON (for privacy)
      expect(json).not.toHaveProperty("currentSpendUsd");
      expect(json).not.toHaveProperty("budgetUsd");
    });
  });

  describe("getMonthKeyForDate", () => {
    it("returns YYYY-MM format for a date", () => {
      const date = new Date("2026-02-15T12:00:00Z");
      expect(getMonthKeyForDate(date)).toBe("2026-02");
    });

    it("pads single-digit months with leading zero", () => {
      const january = new Date("2026-01-15T12:00:00Z");
      const september = new Date("2026-09-15T12:00:00Z");

      expect(getMonthKeyForDate(january)).toBe("2026-01");
      expect(getMonthKeyForDate(september)).toBe("2026-09");
    });

    it("handles December correctly", () => {
      const december = new Date("2026-12-31T23:59:59Z");
      expect(getMonthKeyForDate(december)).toBe("2026-12");
    });

    it("handles January 1st correctly", () => {
      const newYear = new Date("2027-01-01T00:00:00Z");
      expect(getMonthKeyForDate(newYear)).toBe("2027-01");
    });

    it("handles year boundaries", () => {
      const dec2025 = new Date("2025-12-15T12:00:00Z");
      const jan2026 = new Date("2026-01-15T12:00:00Z");

      expect(getMonthKeyForDate(dec2025)).toBe("2025-12");
      expect(getMonthKeyForDate(jan2026)).toBe("2026-01");
    });
  });

  describe("parseMonthKey", () => {
    it("parses YYYY-MM format to first day of month", () => {
      const date = parseMonthKey("2026-02");

      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(1); // 0-indexed
      expect(date.getUTCDate()).toBe(1);
    });

    it("parses January correctly", () => {
      const date = parseMonthKey("2026-01");

      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(0);
    });

    it("parses December correctly", () => {
      const date = parseMonthKey("2026-12");

      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(11);
    });

    it("round-trips with getMonthKeyForDate", () => {
      const original = "2026-07";
      const parsed = parseMonthKey(original);
      const roundTripped = getMonthKeyForDate(parsed);

      expect(roundTripped).toBe(original);
    });
  });

  describe("getNextMonthKey", () => {
    it("returns next month within the same year", () => {
      expect(getNextMonthKey("2026-02")).toBe("2026-03");
      expect(getNextMonthKey("2026-06")).toBe("2026-07");
    });

    it("handles year rollover from December", () => {
      expect(getNextMonthKey("2026-12")).toBe("2027-01");
    });

    it("handles January correctly", () => {
      expect(getNextMonthKey("2026-01")).toBe("2026-02");
    });

    it("handles November to December correctly", () => {
      expect(getNextMonthKey("2026-11")).toBe("2026-12");
    });
  });

  describe("estimateLlmCost", () => {
    it("calculates cost based on token counts", () => {
      // 1000 input + 1000 output
      const cost = estimateLlmCost(1000, 1000);
      const expectedCost =
        COST_PER_1K_INPUT_TOKENS_USD + COST_PER_1K_OUTPUT_TOKENS_USD;

      expect(cost).toBe(expectedCost);
    });

    it("scales linearly with input tokens", () => {
      const cost1k = estimateLlmCost(1000, 0);
      const cost2k = estimateLlmCost(2000, 0);

      expect(cost2k).toBeCloseTo(cost1k * 2, 10);
    });

    it("scales linearly with output tokens", () => {
      const cost1k = estimateLlmCost(0, 1000);
      const cost2k = estimateLlmCost(0, 2000);

      // Account for minimum cost floor
      if (cost1k > MIN_COST_PER_CALL_USD) {
        expect(cost2k).toBeCloseTo(cost1k * 2, 10);
      }
    });

    it("applies minimum cost floor for very small requests", () => {
      // 1 input token, 1 output token should hit the minimum
      const cost = estimateLlmCost(1, 1);

      expect(cost).toBe(MIN_COST_PER_CALL_USD);
    });

    it("handles zero tokens by returning minimum cost", () => {
      const cost = estimateLlmCost(0, 0);

      expect(cost).toBe(MIN_COST_PER_CALL_USD);
    });

    it("calculates realistic costs for typical requests", () => {
      // Typical chat: 500 input, 1000 output
      const cost = estimateLlmCost(500, 1000);

      // Should be a few cents at most
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.01);
    });

    it("calculates costs for large requests", () => {
      // Large context: 10000 input, 5000 output
      const cost = estimateLlmCost(10000, 5000);

      // Should be measurable but still under a dollar
      expect(cost).toBeGreaterThan(0.01);
      expect(cost).toBeLessThan(1);
    });
  });

  describe("estimateTokensFromText", () => {
    it("estimates ~4 characters per token", () => {
      const text = "This is a test string with exactly forty characters.";
      const tokens = estimateTokensFromText(text);

      // ~52 characters / 4 = ~13 tokens
      expect(tokens).toBeGreaterThanOrEqual(10);
      expect(tokens).toBeLessThanOrEqual(20);
    });

    it("returns at least 1 token for non-empty text", () => {
      expect(estimateTokensFromText("Hi")).toBeGreaterThanOrEqual(1);
    });

    it("returns 0 for empty string", () => {
      expect(estimateTokensFromText("")).toBe(0);
    });

    it("handles long text", () => {
      const longText = "a".repeat(10000);
      const tokens = estimateTokensFromText(longText);

      // Should be approximately 2500 tokens (10000 / 4)
      expect(tokens).toBe(2500);
    });

    it("rounds up to ensure conservative estimate", () => {
      // 5 characters -> should round up to 2 tokens, not 1
      const text = "hello";
      const tokens = estimateTokensFromText(text);

      expect(tokens).toBe(2);
    });
  });

  describe("createSpendMonthlyDoc", () => {
    it("creates a doc with default budget", () => {
      const doc = createSpendMonthlyDoc();

      expect(doc.usdBudget).toBe(DEFAULT_MONTHLY_BUDGET_USD);
      expect(doc.usdUsedEstimated).toBe(0);
      expect(doc.updatedAt).toBeInstanceOf(Timestamp);
    });

    it("allows custom budget", () => {
      const doc = createSpendMonthlyDoc(50);

      expect(doc.usdBudget).toBe(50);
    });

    it("initializes with zero spend", () => {
      const doc = createSpendMonthlyDoc();

      expect(doc.usdUsedEstimated).toBe(0);
    });

    it("sets updatedAt to current time", () => {
      const before = Date.now();
      const doc = createSpendMonthlyDoc();
      const after = Date.now();

      const updatedAtMs = doc.updatedAt.toMillis();
      expect(updatedAtMs).toBeGreaterThanOrEqual(before);
      expect(updatedAtMs).toBeLessThanOrEqual(after);
    });
  });

  describe("isSpendCapExceeded", () => {
    it("returns false when under budget", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 15,
        updatedAt: Timestamp.now(),
      };

      expect(isSpendCapExceeded(doc)).toBe(false);
    });

    it("returns true when at exactly the budget", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 20,
        updatedAt: Timestamp.now(),
      };

      expect(isSpendCapExceeded(doc)).toBe(true);
    });

    it("returns true when over budget", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 25,
        updatedAt: Timestamp.now(),
      };

      expect(isSpendCapExceeded(doc)).toBe(true);
    });

    it("returns false when at zero spend", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 0,
        updatedAt: Timestamp.now(),
      };

      expect(isSpendCapExceeded(doc)).toBe(false);
    });

    it("handles floating point precision near boundary", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 19.999999,
        updatedAt: Timestamp.now(),
      };

      expect(isSpendCapExceeded(doc)).toBe(false);
    });

    it("returns true for even tiny overage", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 20.000001,
        updatedAt: Timestamp.now(),
      };

      expect(isSpendCapExceeded(doc)).toBe(true);
    });
  });

  describe("getRemainingBudget", () => {
    it("returns remaining amount when under budget", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 15,
        updatedAt: Timestamp.now(),
      };

      expect(getRemainingBudget(doc)).toBe(5);
    });

    it("returns 0 when at exactly the budget", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 20,
        updatedAt: Timestamp.now(),
      };

      expect(getRemainingBudget(doc)).toBe(0);
    });

    it("returns 0 when over budget (no negative values)", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 25,
        updatedAt: Timestamp.now(),
      };

      expect(getRemainingBudget(doc)).toBe(0);
    });

    it("returns full budget when at zero spend", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 0,
        updatedAt: Timestamp.now(),
      };

      expect(getRemainingBudget(doc)).toBe(20);
    });

    it("handles floating point correctly", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 15.75,
        updatedAt: Timestamp.now(),
      };

      expect(getRemainingBudget(doc)).toBeCloseTo(4.25, 10);
    });
  });

  describe("month boundary scenarios", () => {
    it("correctly identifies month rollover", () => {
      const dec31 = new Date("2026-12-31T23:59:59Z");
      const jan1 = new Date("2027-01-01T00:00:00Z");

      expect(getMonthKeyForDate(dec31)).toBe("2026-12");
      expect(getMonthKeyForDate(jan1)).toBe("2027-01");
    });

    it("each month gets a fresh budget (conceptually)", () => {
      // Two different months should have different keys
      const dec = getMonthKeyForDate(new Date("2026-12-15"));
      const jan = getMonthKeyForDate(new Date("2027-01-15"));

      expect(dec).not.toBe(jan);
    });
  });

  describe("cost estimation scenarios", () => {
    it("estimates reasonable cost for a fit analysis", () => {
      // Fit tool: ~2000 input (job posting + resume context), ~1000 output (report)
      const cost = estimateLlmCost(2000, 1000);

      // Should be a few cents
      expect(cost).toBeGreaterThan(0.001);
      expect(cost).toBeLessThan(0.05);
    });

    it("estimates reasonable cost for resume generation", () => {
      // Resume tool: ~3000 input (job + full resume context), ~2000 output (custom resume)
      const cost = estimateLlmCost(3000, 2000);

      // Should be under 10 cents
      expect(cost).toBeLessThan(0.1);
    });

    it("estimates reasonable cost for interview chat turn", () => {
      // Interview: ~1000 input (context + history), ~500 output (response)
      const cost = estimateLlmCost(1000, 500);

      // Should be a few cents
      expect(cost).toBeLessThan(0.01);
    });

    it("$20 budget allows many requests", () => {
      // Calculate how many typical fit analyses fit in $20
      const costPerFit = estimateLlmCost(2000, 1000);
      const requestsInBudget = Math.floor(SPEND_CAP_USD / costPerFit);

      // Should allow at least 100 requests
      expect(requestsInBudget).toBeGreaterThan(100);
    });
  });

  describe("integration scenarios", () => {
    it("simulates a month of normal usage", () => {
      // Start fresh
      let doc = createSpendMonthlyDoc();

      // Simulate 50 fit analyses
      for (let i = 0; i < 50; i++) {
        const cost = estimateLlmCost(2000, 1000);
        doc = {
          ...doc,
          usdUsedEstimated: doc.usdUsedEstimated + cost,
          updatedAt: Timestamp.now(),
        };
      }

      // Should still be well under budget
      expect(isSpendCapExceeded(doc)).toBe(false);
      expect(getRemainingBudget(doc)).toBeGreaterThan(15);
    });

    it("detects when budget is exhausted", () => {
      const doc: SpendMonthlyDoc = {
        usdBudget: 20,
        usdUsedEstimated: 19.999,
        updatedAt: Timestamp.now(),
      };

      // One more request should push over (minimum cost = 0.001)
      const newSpend = doc.usdUsedEstimated + estimateLlmCost(100, 100);
      const updatedDoc: SpendMonthlyDoc = {
        ...doc,
        usdUsedEstimated: newSpend,
      };

      // 19.999 + 0.001 (minimum cost) = 20.0
      expect(isSpendCapExceeded(updatedDoc)).toBe(true);
    });
  });
});
