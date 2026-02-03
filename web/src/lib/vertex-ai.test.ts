import { describe, it, expect, vi } from "vitest";

// Mock server-only before importing the module
vi.mock("server-only", () => ({}));

// Mock the environment
vi.mock("./env", () => ({
  getEnv: vi.fn(() => ({
    GCP_PROJECT_ID: "test-project",
    VERTEX_AI_LOCATION: "us-central1",
    VERTEX_AI_MODEL: "gemini-pro",
  })),
}));

// Mock spend cap
vi.mock("./spend-cap", () => ({
  enforceSpendCap: vi.fn(),
  recordSpendFromTokens: vi.fn(),
  estimateTokensFromText: vi.fn((text: string) => Math.ceil(text.length / 4)),
  estimateLlmCost: vi.fn((input: number, output: number) =>
    (input / 1000) * 0.00125 + (output / 1000) * 0.00375
  ),
}));

// Import after mocking
import {
  ContentBlockedError,
  GenerationError,
  isSpendCapError,
  isContentBlockedError,
  isGenerationError,
} from "./vertex-ai";

// ============================================================================
// Tests: ContentBlockedError
// ============================================================================

describe("ContentBlockedError", () => {
  it("should have correct properties", () => {
    const error = new ContentBlockedError("Test blocked");

    expect(error.name).toBe("ContentBlockedError");
    expect(error.code).toBe("CONTENT_BLOCKED");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Test blocked");
  });

  it("should store safety ratings", () => {
    const safetyRatings = [
      { category: "HARM_CATEGORY_HATE_SPEECH", probability: "HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", probability: "LOW" },
    ];
    const error = new ContentBlockedError("Blocked", safetyRatings);

    expect(error.safetyRatings).toEqual(safetyRatings);
  });

  it("should serialize to JSON correctly", () => {
    const safetyRatings = [
      { category: "HARM_CATEGORY_HATE_SPEECH", probability: "HIGH" },
    ];
    const error = new ContentBlockedError("Blocked content", safetyRatings);
    const json = error.toJSON();

    expect(json).toEqual({
      error: "content_blocked",
      message: "Blocked content",
      safetyRatings,
    });
  });

  it("should handle undefined safety ratings", () => {
    const error = new ContentBlockedError("Blocked");
    const json = error.toJSON();

    expect(json.safetyRatings).toBeUndefined();
  });
});

// ============================================================================
// Tests: GenerationError
// ============================================================================

describe("GenerationError", () => {
  it("should have correct properties", () => {
    const error = new GenerationError("Test generation failure");

    expect(error.name).toBe("GenerationError");
    expect(error.code).toBe("GENERATION_FAILED");
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe("Test generation failure");
  });

  it("should store cause error", () => {
    const causeError = new Error("Original error");
    const error = new GenerationError("Failed", causeError);

    expect(error.cause).toBe(causeError);
  });

  it("should serialize to JSON correctly", () => {
    const error = new GenerationError("Generation failed");
    const json = error.toJSON();

    expect(json).toEqual({
      error: "generation_failed",
      message: "Generation failed",
    });
  });
});

// ============================================================================
// Tests: Error Type Guards
// ============================================================================

describe("isSpendCapError", () => {
  it("should return true for spend cap error", () => {
    const error = Object.assign(new Error("Spend cap exceeded"), {
      code: "SPEND_CAP_EXCEEDED",
    });

    expect(isSpendCapError(error)).toBe(true);
  });

  it("should return false for other errors", () => {
    expect(isSpendCapError(new Error("Random error"))).toBe(false);
    expect(isSpendCapError(new ContentBlockedError("Blocked"))).toBe(false);
    expect(isSpendCapError(new GenerationError("Failed"))).toBe(false);
  });

  it("should return false for non-errors", () => {
    expect(isSpendCapError("not an error")).toBe(false);
    expect(isSpendCapError(null)).toBe(false);
    expect(isSpendCapError(undefined)).toBe(false);
  });
});

describe("isContentBlockedError", () => {
  it("should return true for ContentBlockedError", () => {
    const error = new ContentBlockedError("Blocked");

    expect(isContentBlockedError(error)).toBe(true);
  });

  it("should return false for other errors", () => {
    expect(isContentBlockedError(new Error("Random error"))).toBe(false);
    expect(isContentBlockedError(new GenerationError("Failed"))).toBe(false);
  });

  it("should return false for non-errors", () => {
    expect(isContentBlockedError("not an error")).toBe(false);
    expect(isContentBlockedError(null)).toBe(false);
  });
});

describe("isGenerationError", () => {
  it("should return true for GenerationError", () => {
    const error = new GenerationError("Failed");

    expect(isGenerationError(error)).toBe(true);
  });

  it("should return false for other errors", () => {
    expect(isGenerationError(new Error("Random error"))).toBe(false);
    expect(isGenerationError(new ContentBlockedError("Blocked"))).toBe(false);
  });

  it("should return false for non-errors", () => {
    expect(isGenerationError("not an error")).toBe(false);
    expect(isGenerationError(null)).toBe(false);
  });
});

// ============================================================================
// Tests: Error Inheritance
// ============================================================================

describe("Error inheritance", () => {
  it("ContentBlockedError should be instanceof Error", () => {
    const error = new ContentBlockedError("Test");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ContentBlockedError);
  });

  it("GenerationError should be instanceof Error", () => {
    const error = new GenerationError("Test");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(GenerationError);
  });

  it("errors should have proper stack traces", () => {
    const error = new ContentBlockedError("Test");

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("ContentBlockedError");
  });
});
