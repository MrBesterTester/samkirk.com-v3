import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only before importing the module
vi.mock("server-only", () => ({}));

// Mock the environment
vi.mock("./env", () => ({
  getEnv: vi.fn(() => ({
    GCP_PROJECT_ID: "test-project",
    VERTEX_AI_LOCATION: "global",
    VERTEX_AI_MODEL: "gemini-3.5-flash-lite",
  })),
}));

// Mock the Gen AI client; keep the SDK's real enums.
const { mockGenerateContent, mockGoogleGenAI } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();
  const mockGoogleGenAI = vi.fn(function () {
    return { models: { generateContent: mockGenerateContent } };
  });
  return { mockGenerateContent, mockGoogleGenAI };
});
vi.mock("@google/genai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@google/genai")>()),
  GoogleGenAI: mockGoogleGenAI,
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
  TruncatedResponseError,
  generateContent,
  generateContentWithHistory,
  resetVertexAI,
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

// ============================================================================
// Tests: Gen AI SDK request and response handling
// ============================================================================

function sdkResponse(overrides: {
  parts?: Array<{ text?: string; thought?: boolean }>;
  finishReason?: string;
  usageMetadata?: Record<string, number>;
  candidates?: unknown[];
} = {}) {
  return {
    candidates: overrides.candidates ?? [
      {
        content: {
          role: "model",
          parts: overrides.parts ?? [{ text: "Hello from Gemini" }],
        },
        finishReason: overrides.finishReason ?? "STOP",
        safetyRatings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", probability: "NEGLIGIBLE" },
        ],
      },
    ],
    usageMetadata: overrides.usageMetadata ?? {
      promptTokenCount: 100,
      candidatesTokenCount: 20,
      thoughtsTokenCount: 30,
    },
  };
}

describe("Gen AI client", () => {
  beforeEach(() => {
    resetVertexAI();
    mockGoogleGenAI.mockClear();
    mockGenerateContent.mockReset();
  });

  it("is built in Vertex AI mode with project and location from env", async () => {
    mockGenerateContent.mockResolvedValue(sdkResponse());

    await generateContent("Hi", { skipSpendCap: true });

    expect(mockGoogleGenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        vertexai: true,
        project: "test-project",
        location: "global",
      })
    );
  });

  it("sends the model, prompt and config in one request", async () => {
    mockGenerateContent.mockResolvedValue(sdkResponse());

    await generateContent("Analyze this job", {
      systemInstruction: "You are a fit analyzer",
      temperature: 0.3,
      maxOutputTokens: 16384,
      skipSpendCap: true,
    });

    const request = mockGenerateContent.mock.calls[0][0];
    expect(request.model).toBe("gemini-3.5-flash-lite");
    expect(request.contents).toEqual([
      { role: "user", parts: [{ text: "Analyze this job" }] },
    ]);
    expect(request.config).toMatchObject({
      systemInstruction: "You are a fit analyzer",
      temperature: 0.3,
      maxOutputTokens: 16384,
      topP: 0.9,
      topK: 40,
    });
    expect(request.config.safetySettings).toHaveLength(4);
  });

  it("returns visible text only, never thought parts", async () => {
    mockGenerateContent.mockResolvedValue(
      sdkResponse({
        parts: [
          { text: "reasoning...", thought: true },
          { text: "The answer." },
        ],
      })
    );

    const result = await generateContent("Q", { skipSpendCap: true });

    expect(result.text).toBe("The answer.");
  });

  it("bills thinking tokens as output", async () => {
    mockGenerateContent.mockResolvedValue(sdkResponse());

    const result = await generateContent("Q", { skipSpendCap: true });

    expect(result.usage).toEqual({
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
    });
  });

  it("throws TruncatedResponseError on a MAX_TOKENS finish", async () => {
    mockGenerateContent.mockResolvedValue(
      sdkResponse({ finishReason: "MAX_TOKENS", parts: [{ text: '{"a": "tru' }] })
    );

    await expect(
      generateContent("Q", { skipSpendCap: true })
    ).rejects.toBeInstanceOf(TruncatedResponseError);
  });

  it("throws ContentBlockedError when no candidate comes back", async () => {
    mockGenerateContent.mockResolvedValue(sdkResponse({ candidates: [] }));

    await expect(
      generateContent("Q", { skipSpendCap: true })
    ).rejects.toBeInstanceOf(ContentBlockedError);
  });

  it("wraps SDK failures in GenerationError", async () => {
    mockGenerateContent.mockRejectedValue(new Error("400 INVALID_ARGUMENT"));

    await expect(
      generateContent("Q", { skipSpendCap: true })
    ).rejects.toThrow(/Failed to generate content: 400 INVALID_ARGUMENT/);
  });

  it("sends history in order, then the new message", async () => {
    mockGenerateContent.mockResolvedValue(sdkResponse());

    await generateContentWithHistory(
      [
        { role: "user", text: "Hi" },
        { role: "model", text: "Hello" },
      ],
      "Tell me about Sam",
      { skipSpendCap: true }
    );

    expect(mockGenerateContent.mock.calls[0][0].contents).toEqual([
      { role: "user", parts: [{ text: "Hi" }] },
      { role: "model", parts: [{ text: "Hello" }] },
      { role: "user", parts: [{ text: "Tell me about Sam" }] },
    ]);
  });

  it("returns a MAX_TOKENS finish from history calls instead of throwing", async () => {
    mockGenerateContent.mockResolvedValue(
      sdkResponse({ finishReason: "MAX_TOKENS" })
    );

    const result = await generateContentWithHistory([], "Q", {
      skipSpendCap: true,
    });

    expect(result.finishReason).toBe("MAX_TOKENS");
  });

  it("sends thinkingLevel as the Gemini 3 thinking config", async () => {
    mockGenerateContent.mockResolvedValue(sdkResponse());

    await generateContentWithHistory([], "Q", {
      thinkingLevel: "LOW",
      skipSpendCap: true,
    });

    expect(mockGenerateContent.mock.calls[0][0].config.thinkingConfig).toEqual({
      thinkingLevel: "LOW",
    });
  });

  it("never sends a thinkingBudget, which Gemini 3 rejects intermittently", async () => {
    mockGenerateContent.mockResolvedValue(sdkResponse());

    await generateContentWithHistory([], "Q", {
      thinkingBudget: 256,
      skipSpendCap: true,
    } as never);

    expect(
      mockGenerateContent.mock.calls[0][0].config.thinkingConfig?.thinkingBudget
    ).toBeUndefined();
  });

  it("leaves thinking at the model default when no level is given", async () => {
    mockGenerateContent.mockResolvedValue(sdkResponse());

    await generateContent("Q", { skipSpendCap: true });

    expect(mockGenerateContent.mock.calls[0][0].config).not.toHaveProperty(
      "thinkingConfig"
    );
  });
});
