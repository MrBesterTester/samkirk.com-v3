import { describe, it, expect } from "vitest";
import {
  assertResponseComplete,
  TruncatedResponseError,
  billableOutputTokens,
} from "./vertex-ai";
import { estimateTokensFromText } from "./spend-cap";

/**
 * These exist because of A9 (2026-07-15): after the gemini-2.5-flash swap,
 * Resume and Fit returned "Failed to parse LLM response as JSON". The JSON was
 * not malformed -- the model hit MAX_TOKENS (thinking ate the budget) and was
 * cut off mid-string. generateContent returned finishReason but no caller read
 * it, so a truncation masqueraded as a parse error. This guard makes truncation
 * announce itself instead of lying downstream.
 */
describe("assertResponseComplete", () => {
  it("throws a truncation error, not a generic one, on MAX_TOKENS", () => {
    expect(() => assertResponseComplete("MAX_TOKENS", 164)).toThrowError(
      TruncatedResponseError,
    );
  });

  it("names the token limit in the message, so it isn't mistaken for a parse bug", () => {
    try {
      assertResponseComplete("MAX_TOKENS", 164);
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(TruncatedResponseError);
      expect((e as Error).message).toMatch(/MAX_TOKENS|truncat|output-token/i);
    }
  });

  it("does not throw on a normal STOP finish", () => {
    expect(() => assertResponseComplete("STOP", 2345)).not.toThrow();
  });

  it("does not throw when finishReason is absent", () => {
    expect(() => assertResponseComplete(undefined, 500)).not.toThrow();
  });
});

/**
 * Thinking-token accounting (2026-08-31).
 *
 * Gemini 2.5 bills internal reasoning as output under `thoughtsTokenCount`.
 * The spend cap previously counted only `candidatesTokenCount`, under-reporting
 * real output spend by ~8x on interview turns and letting the $20 monthly cap
 * permit far more than it recorded.
 */
describe("billableOutputTokens", () => {
  it("counts thinking tokens alongside visible output", () => {
    // The call measured on 2026-08-31: 119 visible, 901 thinking.
    expect(
      billableOutputTokens(
        { candidatesTokenCount: 119, thoughtsTokenCount: 901 } as never,
        "ignored"
      )
    ).toBe(1020);
  });

  it("still works when the model reports no thinking tokens", () => {
    expect(
      billableOutputTokens({ candidatesTokenCount: 250 } as never, "ignored")
    ).toBe(250);
  });

  it("falls back to a text estimate when metadata is absent", () => {
    const text = "x".repeat(400);
    expect(billableOutputTokens(undefined, text)).toBe(
      estimateTokensFromText(text)
    );
  });

  it("falls back rather than recording a call as free", () => {
    const text = "y".repeat(200);
    expect(
      billableOutputTokens(
        { candidatesTokenCount: 0, thoughtsTokenCount: 0 } as never,
        text
      )
    ).toBe(estimateTokensFromText(text));
  });
});
