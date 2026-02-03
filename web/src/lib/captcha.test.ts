import { describe, it, expect } from "vitest";
import {
  buildVerifyRequestBody,
  mapRecaptchaErrorCodes,
} from "./captcha";

describe("captcha", () => {
  describe("buildVerifyRequestBody", () => {
    it("builds request body with secret and token", () => {
      const body = buildVerifyRequestBody("test-secret", "test-token");
      const params = new URLSearchParams(body);

      expect(params.get("secret")).toBe("test-secret");
      expect(params.get("response")).toBe("test-token");
      expect(params.has("remoteip")).toBe(false);
    });

    it("includes remoteip when provided", () => {
      const body = buildVerifyRequestBody(
        "test-secret",
        "test-token",
        "192.168.1.1"
      );
      const params = new URLSearchParams(body);

      expect(params.get("secret")).toBe("test-secret");
      expect(params.get("response")).toBe("test-token");
      expect(params.get("remoteip")).toBe("192.168.1.1");
    });

    it("handles special characters in token", () => {
      const body = buildVerifyRequestBody(
        "test-secret",
        "token+with=special&chars"
      );
      const params = new URLSearchParams(body);

      expect(params.get("response")).toBe("token+with=special&chars");
    });

    it("handles empty remoteip as falsy (not added)", () => {
      const body = buildVerifyRequestBody("test-secret", "test-token", "");
      const params = new URLSearchParams(body);

      // Empty string is falsy, so remoteip is not added
      expect(params.has("remoteip")).toBe(false);
    });
  });

  describe("mapRecaptchaErrorCodes", () => {
    it("returns default message for undefined error codes", () => {
      expect(mapRecaptchaErrorCodes(undefined)).toBe(
        "Captcha verification failed"
      );
    });

    it("returns default message for empty error codes array", () => {
      expect(mapRecaptchaErrorCodes([])).toBe("Captcha verification failed");
    });

    it("maps missing-input-response error", () => {
      expect(mapRecaptchaErrorCodes(["missing-input-response"])).toBe(
        "Please complete the captcha"
      );
    });

    it("maps invalid-input-response error", () => {
      expect(mapRecaptchaErrorCodes(["invalid-input-response"])).toBe(
        "Invalid captcha response. Please try again."
      );
    });

    it("maps timeout-or-duplicate error", () => {
      expect(mapRecaptchaErrorCodes(["timeout-or-duplicate"])).toBe(
        "Captcha expired. Please try again."
      );
    });

    it("maps missing-input-secret error to server config error", () => {
      expect(mapRecaptchaErrorCodes(["missing-input-secret"])).toBe(
        "Server configuration error"
      );
    });

    it("maps invalid-input-secret error to server config error", () => {
      expect(mapRecaptchaErrorCodes(["invalid-input-secret"])).toBe(
        "Server configuration error"
      );
    });

    it("maps bad-request error", () => {
      expect(mapRecaptchaErrorCodes(["bad-request"])).toBe("Invalid request");
    });

    it("returns first matching error when multiple codes present", () => {
      // First error in the check order wins
      expect(
        mapRecaptchaErrorCodes([
          "invalid-input-response",
          "timeout-or-duplicate",
        ])
      ).toBe("Invalid captcha response. Please try again.");
    });

    it("returns default message for unknown error codes", () => {
      expect(mapRecaptchaErrorCodes(["unknown-error-code"])).toBe(
        "Captcha verification failed"
      );
    });
  });
});
