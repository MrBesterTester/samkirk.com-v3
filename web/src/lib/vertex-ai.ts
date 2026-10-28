import "server-only";

import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentResponse,
  Content,
  ThinkingLevel,
} from "@google/genai";
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

/** A Gemini 3 thinking level, by name. */
export type GeminiThinkingLevel = Exclude<
  keyof typeof ThinkingLevel,
  "THINKING_LEVEL_UNSPECIFIED"
>;

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
   * Gemini 3 thinking level. Omit to use the model default (MINIMAL on
   * gemini-3.5-flash-lite, MEDIUM on gemini-3.8-flash).
   *
   * Thinking is billed as output and counts against `maxOutputTokens`, so
   * unbounded reasoning can starve the visible answer (measured 2026-08-31 on
   * 2.5 Flash: 901 of 1024 tokens spent thinking, answer truncated at 119).
   * Gemini 3 replaced the old token `thinkingBudget` with this level; sending
   * a budget can cause intermittent 400 INVALID_ARGUMENT errors.
   */
  thinkingLevel?: GeminiThinkingLevel;

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
        `thinking level. Thinking tokens count against maxOutputTokens.`,
    );
  }
}

// ============================================================================
// Singleton Client
// ============================================================================

let vertexAiInstance: GoogleGenAI | null = null;

/**
 * Get the singleton Gen AI client, in Vertex AI mode.
 *
 * Uses @google/genai rather than @google-cloud/vertexai: Google stopped
 * supporting Gemini in Vertex AI SDK releases after June 2026, and the old SDK
 * built a regional endpoint from the location, which cannot reach models
 * offered only at `global` (gemini-3.5-flash-lite).
 */
export function getVertexAI(): GoogleGenAI {
  if (!vertexAiInstance) {
    const env = getEnv();
    const credentials = getGcpCredentials();
    vertexAiInstance = new GoogleGenAI({
      vertexai: true,
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
 * Send one generateContent request and wrap transport failures.
 */
async function requestCompletion(
  contents: Content[],
  options: Pick<
    GenerateOptions,
    | "systemInstruction"
    | "temperature"
    | "maxOutputTokens"
    | "topP"
    | "topK"
    | "thinkingLevel"
  >
): Promise<GenerateContentResponse> {
  const { systemInstruction, thinkingLevel, ...sampling } = options;
  const env = getEnv();

  try {
    return await getVertexAI().models.generateContent({
      model: env.VERTEX_AI_MODEL,
      contents,
      config: {
        ...sampling,
        safetySettings: DEFAULT_SAFETY_SETTINGS,
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(thinkingLevel !== undefined
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel[thinkingLevel] } }
          : {}),
      },
    });
  } catch (error) {
    throw new GenerationError(
      `Failed to generate content: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
}

/** Finish reasons that mean the model withheld its answer. */
const BLOCKED_FINISH_REASONS = new Set([
  "SAFETY",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
  "IMAGE_SAFETY",
]);

/**
 * Turn a response into a GenerateResult: pull out the visible answer, record
 * spend, and classify failures.
 *
 * Spend is recorded before any truncation error is thrown, because Google
 * bills a truncated call (thinking included) like any other. Thought parts
 * (`thought: true`) are reasoning, not the answer; they only appear if
 * includeThoughts is set, but are excluded regardless.
 *
 * @param promptText - all prompt text, for estimating tokens if usage is absent
 * @param throwOnTruncation - true where a fragment would break the caller
 *   (JSON parsing); the interview labels fragments instead
 * @throws ContentBlockedError when no answer came back for safety reasons
 * @throws TruncatedResponseError on MAX_TOKENS (always, if no text came back)
 * @throws GenerationError when the candidate carries no text otherwise
 */
async function finishGeneration(
  response: GenerateContentResponse,
  promptText: string,
  skipSpendCap: boolean,
  throwOnTruncation: boolean
): Promise<GenerateResult> {
  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason
    ? String(candidate.finishReason)
    : undefined;
  const safetyRatings = candidate?.safetyRatings?.map((r) => ({
    category: String(r.category),
    probability: String(r.probabilityScore ?? r.probability ?? "UNKNOWN"),
  }));

  if (!candidate?.content) {
    throw new ContentBlockedError(
      "Content generation was blocked by safety filters",
      safetyRatings
    );
  }

  const generatedText = (candidate.content.parts ?? [])
    .filter((p) => typeof p.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("");

  const usageMetadata = response.usageMetadata;
  const inputTokens =
    usageMetadata?.promptTokenCount ?? estimateTokensFromText(promptText);
  const outputTokens = billableOutputTokens(usageMetadata, generatedText);
  const estimatedCostUsd = estimateLlmCost(inputTokens, outputTokens);

  if (!skipSpendCap) {
    await recordSpendFromTokens(inputTokens, outputTokens);
  }

  if (generatedText === "") {
    if (finishReason && BLOCKED_FINISH_REASONS.has(finishReason)) {
      throw new ContentBlockedError(
        "Content generation was blocked by safety filters",
        safetyRatings
      );
    }
    // Thinking can use the whole budget before any answer is written.
    assertResponseComplete(finishReason, 0);
    throw new GenerationError("No text content in response");
  }

  // A MAX_TOKENS finish means this text is a fragment. Fail here rather than
  // let a caller parse a truncated string and blame the JSON (A9).
  if (throwOnTruncation) {
    assertResponseComplete(finishReason, generatedText.length);
  }

  return {
    text: generatedText,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    },
    estimatedCostUsd,
    safetyRatings,
    finishReason,
  };
}

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
 * Gemini "thinking" models bill internal reasoning as output, reported
 * separately as `thoughtsTokenCount`.
 *
 * Counting only `candidatesTokenCount` under-reported real output spend by
 * roughly 8x on interview turns (measured 2026-08-31: 119 visible tokens
 * against 901 thinking tokens), which silently let the $20 monthly cap in
 * `spend-cap.ts` permit far more real spend than it recorded.
 */
export function billableOutputTokens(
  usageMetadata:
    | { candidatesTokenCount?: number; thoughtsTokenCount?: number }
    | undefined,
  fallbackText: string
): number {
  if (!usageMetadata) return estimateTokensFromText(fallbackText);

  const visible = usageMetadata.candidatesTokenCount ?? 0;
  const thinking = usageMetadata.thoughtsTokenCount ?? 0;

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
    thinkingLevel,
  } = options;

  // Enforce spend cap before making the call
  if (!skipSpendCap) {
    await enforceSpendCap();
  }

  const contents: Content[] = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  const response = await requestCompletion(contents, {
    systemInstruction,
    temperature,
    maxOutputTokens,
    topP,
    topK,
    thinkingLevel,
  });

  return finishGeneration(response, prompt, skipSpendCap, true);
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
    thinkingLevel,
  } = options;

  // Enforce spend cap before making the call
  if (!skipSpendCap) {
    await enforceSpendCap();
  }

  // Build the content request with history
  const contents: Content[] = [
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
    {
      role: "user",
      parts: [{ text: newMessage }],
    },
  ];

  const response = await requestCompletion(contents, {
    systemInstruction,
    temperature,
    maxOutputTokens,
    topP,
    topK,
    thinkingLevel,
  });

  // No truncation guard on this path: interview text is conversational, so a
  // MAX_TOKENS cut is labelled by the caller (INTERVIEW_TRUNCATION_NOTICE)
  // rather than thrown.
  const fullPrompt = [...history.map((m) => m.text), newMessage].join("\n\n");
  return finishGeneration(response, fullPrompt, skipSpendCap, false);
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
