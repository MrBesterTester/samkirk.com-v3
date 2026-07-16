import { describe, it, expect } from "vitest";
import { assertResponseComplete, TruncatedResponseError } from "./vertex-ai";

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
