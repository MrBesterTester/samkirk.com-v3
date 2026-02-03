import "server-only";

import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentResult,
  Content,
  Part,
} from "@google-cloud/vertexai";
import { getEnv } from "./env";
import {
  enforceSpendCap,
  recordSpendFromTokens,
  estimateTokensFromText,
  estimateLlmCost,
} from "./spend-cap";

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration options for generating content.
 */
export interface GenerateOptions {
  /**
   * System instruction to guide the model's behavior.
   */
  systemInstruction?: string;

  /**
   * Temperature for response randomness (0-2). Lower = more deterministic.
   * Default: 0.7
   */
  temperature?: number;

  /**
   * Maximum tokens to generate in the response.
   * Default: 4096
   */
  maxOutputTokens?: number;

  /**
   * Top-p (nucleus) sampling threshold.
   * Default: 0.9
   */
  topP?: number;

  /**
   * Top-k sampling: consider only the top k tokens.
   * Default: 40
   */
  topK?: number;

  /**
   * Whether to skip spend cap enforcement (for testing only).
   * Default: false
   */
  skipSpendCap?: boolean;
}

/**
 * Result from a content generation call.
 */
export interface GenerateResult {
  /**
   * The generated text content.
   */
  text: string;

  /**
   * Token usage statistics (if available).
   */
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };

  /**
   * Estimated cost in USD.
   */
  estimatedCostUsd: number;

  /**
   * Safety ratings from the model.
   */
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;

  /**
   * The finish reason for generation.
   */
  finishReason?: string;
}

/**
 * Error thrown when content is blocked due to safety filters.
 */
export class ContentBlockedError extends Error {
  readonly code = "CONTENT_BLOCKED";
  readonly statusCode = 400;
  readonly safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;

  constructor(
    message: string,
    safetyRatings?: Array<{ category: string; probability: string }>
  ) {
    super(message);
    this.name = "ContentBlockedError";
    this.safetyRatings = safetyRatings;
  }

  toJSON() {
    return {
      error: "content_blocked",
      message: this.message,
      safetyRatings: this.safetyRatings,
    };
  }
}

/**
 * Error thrown when generation fails.
 */
export class GenerationError extends Error {
  readonly code = "GENERATION_FAILED";
  readonly statusCode = 500;
  readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "GenerationError";
    this.cause = cause;
  }

  toJSON() {
    return {
      error: "generation_failed",
      message: this.message,
    };
  }
}

// ============================================================================
// Singleton Client
// ============================================================================

let vertexAiInstance: VertexAI | null = null;

/**
 * Get the singleton Vertex AI client instance.
 */
export function getVertexAI(): VertexAI {
  if (!vertexAiInstance) {
    const env = getEnv();
    vertexAiInstance = new VertexAI({
      project: env.GCP_PROJECT_ID,
      location: env.VERTEX_AI_LOCATION,
    });
  }
  return vertexAiInstance;
}

/**
 * Reset the singleton instance (for testing).
 */
export function resetVertexAI(): void {
  vertexAiInstance = null;
}

// ============================================================================
// Default Safety Settings
// ============================================================================

/**
 * Default safety settings - moderate blocking threshold.
 * These can be overridden per-request if needed.
 */
const DEFAULT_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// ============================================================================
// Content Generation
// ============================================================================

/**
 * Generate content using Vertex AI Gemini.
 *
 * This function:
 * - Enforces spend cap before making the call
 * - Records spend after the call completes
 * - Handles safety filtering and errors gracefully
 *
 * @param prompt - The user prompt to send to the model
 * @param options - Configuration options for generation
 * @returns The generated result with text and usage statistics
 *
 * @throws SpendCapError if the monthly spend cap is exceeded
 * @throws ContentBlockedError if content is blocked by safety filters
 * @throws GenerationError if generation fails for other reasons
 *
 * @example
 * ```typescript
 * const result = await generateContent(
 *   "Analyze this job posting for fit...",
 *   {
 *     systemInstruction: "You are a job fit analyzer...",
 *     temperature: 0.3,
 *     maxOutputTokens: 2048,
 *   }
 * );
 * console.log(result.text);
 * console.log(`Cost: $${result.estimatedCostUsd.toFixed(4)}`);
 * ```
 */
export async function generateContent(
  prompt: string,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const {
    systemInstruction,
    temperature = 0.7,
    maxOutputTokens = 4096,
    topP = 0.9,
    topK = 40,
    skipSpendCap = false,
  } = options;

  // Enforce spend cap before making the call
  if (!skipSpendCap) {
    await enforceSpendCap();
  }

  const env = getEnv();
  const vertexAI = getVertexAI();

  // Get the generative model
  const model = vertexAI.getGenerativeModel({
    model: env.VERTEX_AI_MODEL,
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP,
      topK,
    },
    safetySettings: DEFAULT_SAFETY_SETTINGS,
    systemInstruction: systemInstruction
      ? { role: "system", parts: [{ text: systemInstruction }] }
      : undefined,
  });

  // Build the content request
  const contents: Content[] = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  let result: GenerateContentResult;

  try {
    result = await model.generateContent({ contents });
  } catch (error) {
    throw new GenerationError(
      `Failed to generate content: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }

  // Extract the response
  const response = result.response;

  // Check if content was blocked
  if (
    !response.candidates ||
    response.candidates.length === 0 ||
    !response.candidates[0].content
  ) {
    const safetyRatings = response.candidates?.[0]?.safetyRatings?.map((r) => ({
      category: String(r.category),
      probability: String(r.probabilityScore ?? r.probability ?? "UNKNOWN"),
    }));

    throw new ContentBlockedError(
      "Content generation was blocked by safety filters",
      safetyRatings
    );
  }

  const candidate = response.candidates[0];
  const textParts = candidate.content.parts.filter(
    (p): p is Part & { text: string } => "text" in p && typeof p.text === "string"
  );

  if (textParts.length === 0) {
    throw new GenerationError("No text content in response");
  }

  const generatedText = textParts.map((p) => p.text).join("");

  // Extract usage metadata
  const usageMetadata = response.usageMetadata;
  const inputTokens = usageMetadata?.promptTokenCount ?? estimateTokensFromText(prompt);
  const outputTokens =
    usageMetadata?.candidatesTokenCount ?? estimateTokensFromText(generatedText);
  const totalTokens = inputTokens + outputTokens;

  // Calculate and record spend
  const estimatedCostUsd = estimateLlmCost(inputTokens, outputTokens);

  if (!skipSpendCap) {
    await recordSpendFromTokens(inputTokens, outputTokens);
  }

  // Extract safety ratings
  const safetyRatings = candidate.safetyRatings?.map((r) => ({
    category: String(r.category),
    probability: String(r.probabilityScore ?? r.probability ?? "UNKNOWN"),
  }));

  return {
    text: generatedText,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens,
    },
    estimatedCostUsd,
    safetyRatings,
    finishReason: candidate.finishReason
      ? String(candidate.finishReason)
      : undefined,
  };
}

/**
 * Generate content with a conversation history (multi-turn).
 *
 * @param history - Previous messages in the conversation
 * @param newMessage - The new user message
 * @param options - Configuration options for generation
 * @returns The generated result
 */
export async function generateContentWithHistory(
  history: Array<{ role: "user" | "model"; text: string }>,
  newMessage: string,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const {
    systemInstruction,
    temperature = 0.7,
    maxOutputTokens = 4096,
    topP = 0.9,
    topK = 40,
    skipSpendCap = false,
  } = options;

  // Enforce spend cap before making the call
  if (!skipSpendCap) {
    await enforceSpendCap();
  }

  const env = getEnv();
  const vertexAI = getVertexAI();

  // Get the generative model
  const model = vertexAI.getGenerativeModel({
    model: env.VERTEX_AI_MODEL,
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP,
      topK,
    },
    safetySettings: DEFAULT_SAFETY_SETTINGS,
    systemInstruction: systemInstruction
      ? { role: "system", parts: [{ text: systemInstruction }] }
      : undefined,
  });

  // Build the content request with history
  const contents: Content[] = [
    ...history.map((msg) => ({
      role: msg.role as "user" | "model",
      parts: [{ text: msg.text }],
    })),
    {
      role: "user" as const,
      parts: [{ text: newMessage }],
    },
  ];

  let result: GenerateContentResult;

  try {
    result = await model.generateContent({ contents });
  } catch (error) {
    throw new GenerationError(
      `Failed to generate content: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }

  // Extract the response (same logic as generateContent)
  const response = result.response;

  if (
    !response.candidates ||
    response.candidates.length === 0 ||
    !response.candidates[0].content
  ) {
    const safetyRatings = response.candidates?.[0]?.safetyRatings?.map((r) => ({
      category: String(r.category),
      probability: String(r.probabilityScore ?? r.probability ?? "UNKNOWN"),
    }));

    throw new ContentBlockedError(
      "Content generation was blocked by safety filters",
      safetyRatings
    );
  }

  const candidate = response.candidates[0];
  const textParts = candidate.content.parts.filter(
    (p): p is Part & { text: string } => "text" in p && typeof p.text === "string"
  );

  if (textParts.length === 0) {
    throw new GenerationError("No text content in response");
  }

  const generatedText = textParts.map((p) => p.text).join("");

  // Estimate tokens from full conversation
  const fullPrompt = [...history.map((m) => m.text), newMessage].join("\n\n");
  const usageMetadata = response.usageMetadata;
  const inputTokens =
    usageMetadata?.promptTokenCount ?? estimateTokensFromText(fullPrompt);
  const outputTokens =
    usageMetadata?.candidatesTokenCount ?? estimateTokensFromText(generatedText);
  const totalTokens = inputTokens + outputTokens;

  // Calculate and record spend
  const estimatedCostUsd = estimateLlmCost(inputTokens, outputTokens);

  if (!skipSpendCap) {
    await recordSpendFromTokens(inputTokens, outputTokens);
  }

  const safetyRatings = candidate.safetyRatings?.map((r) => ({
    category: String(r.category),
    probability: String(r.probabilityScore ?? r.probability ?? "UNKNOWN"),
  }));

  return {
    text: generatedText,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens,
    },
    estimatedCostUsd,
    safetyRatings,
    finishReason: candidate.finishReason
      ? String(candidate.finishReason)
      : undefined,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if an error is a spend cap error.
 */
export function isSpendCapError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code: string }).code === "SPEND_CAP_EXCEEDED"
  );
}

/**
 * Check if an error is a content blocked error.
 */
export function isContentBlockedError(error: unknown): error is ContentBlockedError {
  return error instanceof ContentBlockedError;
}

/**
 * Check if an error is a generation error.
 */
export function isGenerationError(error: unknown): error is GenerationError {
  return error instanceof GenerationError;
}
