import "server-only";

import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentResult,
  GenerationConfig,
  Content,
  Part,
} from "@google-cloud/vertexai";
import { getEnv } from "./env";
import { getGcpCredentials } from "./gcp-credentials";
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
   * Cap on internal reasoning tokens for Gemini 2.5 "thinking" models.
   *
   * Thinking is billed as output and counts against `maxOutputTokens`, so an
   * unbounded budget starves the visible answer (measured 2026-08-31: 901 of
   * 1024 tokens spent thinking, answer truncated at 119 tokens).
   */
  thinkingBudget?: number;

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

/**
 * Thrown when the model stopped because it hit the output-token ceiling
 * (finishReason MAX_TOKENS) rather than finishing its answer. The returned text
 * is a fragment. Distinct from GenerationError so callers -- and logs -- can
 * tell "the model was cut off" from "the model failed", and never mistake a
 * truncated fragment for malformed JSON (see A9, 2026-07-15).
 */
export class TruncatedResponseError extends GenerationError {
  readonly reason = "MAX_TOKENS";

  constructor(message: string) {
    super(message);
    this.name = "TruncatedResponseError";
  }
}

/**
 * Guard: fail loudly when a response was truncated at the token limit.
 *
 * generateContent used to return finishReason and no caller read it, so a
 * MAX_TOKENS truncation flowed into JSON.parse and surfaced as "Failed to parse
 * LLM response as JSON" -- blaming the JSON for what was really an exhausted
 * budget. Call this before handing text downstream.
 */
export function assertResponseComplete(
  finishReason: string | undefined,
  outputTextLength: number,
): void {
  if (finishReason === "MAX_TOKENS") {
    throw new TruncatedResponseError(
      `Model response was truncated at the output-token limit ` +
        `(finishReason=MAX_TOKENS, ${outputTextLength} chars produced). ` +
        `This is NOT a JSON parse error -- raise maxOutputTokens or lower the ` +
        `thinking budget. Thinking tokens count against maxOutputTokens.`,
    );
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
    const credentials = getGcpCredentials();
    vertexAiInstance = new VertexAI({
      project: env.GCP_PROJECT_ID,
      location: env.VERTEX_AI_LOCATION,
      ...(credentials && { googleAuthOptions: { credentials } }),
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
/**
 * Billable output tokens for a response.
 *
 * Gemini 2.5 "thinking" models bill internal reasoning as output, reported
 * separately as `thoughtsTokenCount`. The SDK's UsageMetadata type does not
 * declare that field, so it is read defensively.
 *
 * Counting only `candidatesTokenCount` under-reported real output spend by
 * roughly 8x on interview turns (measured 2026-08-31: 119 visible tokens
 * against 901 thinking tokens), which silently let the $20 monthly cap in
 * `spend-cap.ts` permit far more real spend than it recorded.
 */
export function billableOutputTokens(
  usageMetadata: { candidatesTokenCount?: number } | undefined,
  fallbackText: string
): number {
  if (!usageMetadata) return estimateTokensFromText(fallbackText);

  const visible = usageMetadata.candidatesTokenCount ?? 0;
  const thinking =
    (usageMetadata as { thoughtsTokenCount?: number }).thoughtsTokenCount ?? 0;

  // An empty metadata object still means "no counts" - fall back rather than
  // record the call as free.
  if (visible === 0 && thinking === 0) {
    return estimateTokensFromText(fallbackText);
  }

  return visible + thinking;
}

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

  // A MAX_TOKENS finish means this text is a fragment. Fail here rather than
  // let a caller parse a truncated string and blame the JSON (A9).
  assertResponseComplete(
    candidate.finishReason ? String(candidate.finishReason) : undefined,
    generatedText.length,
  );

  // Extract usage metadata
  const usageMetadata = response.usageMetadata;
  const inputTokens = usageMetadata?.promptTokenCount ?? estimateTokensFromText(prompt);
  const outputTokens = billableOutputTokens(usageMetadata, generatedText);
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
    thinkingBudget,
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
      // EXPERIMENTAL: thinkingConfig is not declared by
      // @google-cloud/vertexai@1.10.0's GenerationConfig, so it is cast
      // through to the REST API. A silently ignored field would leave the
      // truncation in place while looking fixed -- verify thoughtsTokenCount
      // actually drops before relying on this.
      ...(thinkingBudget !== undefined
        ? { thinkingConfig: { thinkingBudget } }
        : {}),
    } as GenerationConfig,
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

  // NOTE: no truncation guard on this (streaming/interview) path yet. Interview
  // is confirmed working and returns conversational text where a MAX_TOKENS cut
  // is degraded-but-usable, not broken JSON. Adding a throwing guard here needs
  // its own verification of interview's real finishReason first (A9 follow-up).

  // Estimate tokens from full conversation
  const fullPrompt = [...history.map((m) => m.text), newMessage].join("\n\n");
  const usageMetadata = response.usageMetadata;
  const inputTokens =
    usageMetadata?.promptTokenCount ?? estimateTokensFromText(fullPrompt);
  const outputTokens = billableOutputTokens(usageMetadata, generatedText);
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
