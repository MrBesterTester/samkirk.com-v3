import { describe, it, expect, vi } from "vitest";
import { isEmailAllowed } from "./admin-allowlist";

describe("isEmailAllowed", () => {
  const ALLOWED_EMAIL = "admin@example.com";

  it("returns false for null email", () => {
    expect(isEmailAllowed(null, ALLOWED_EMAIL)).toBe(false);
  });

  it("returns false for undefined email", () => {
    expect(isEmailAllowed(undefined, ALLOWED_EMAIL)).toBe(false);
  });

  it("returns false for empty string email", () => {
    expect(isEmailAllowed("", ALLOWED_EMAIL)).toBe(false);
  });

  it("returns false when allowedEmail is undefined", () => {
    // Temporarily clear the env var so the default parameter resolves to undefined
    const original = process.env.ADMIN_ALLOWED_EMAIL;
    delete process.env.ADMIN_ALLOWED_EMAIL;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(isEmailAllowed("user@example.com")).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      "ADMIN_ALLOWED_EMAIL env var is not set"
    );
    warnSpy.mockRestore();
    process.env.ADMIN_ALLOWED_EMAIL = original;
  });

  it("returns true for exact email match", () => {
    expect(isEmailAllowed("admin@example.com", ALLOWED_EMAIL)).toBe(true);
  });

  it("returns true for case-insensitive email match (allowed email uppercase)", () => {
    expect(isEmailAllowed("admin@example.com", "Admin@Example.com")).toBe(true);
  });

  it("returns true when input email has different case than allowed", () => {
    expect(isEmailAllowed("ADMIN@EXAMPLE.COM", ALLOWED_EMAIL)).toBe(true);
  });

  it("returns false for non-matching email", () => {
    expect(isEmailAllowed("other@example.com", ALLOWED_EMAIL)).toBe(false);
  });

  it("returns false for partial email match", () => {
    expect(isEmailAllowed("admin@example", ALLOWED_EMAIL)).toBe(false);
    expect(isEmailAllowed("admin", ALLOWED_EMAIL)).toBe(false);
  });

  it("returns false for email with extra characters (suffix attack)", () => {
    expect(
      isEmailAllowed("admin@example.com.attacker.com", ALLOWED_EMAIL)
    ).toBe(false);
    expect(isEmailAllowed("admin@example.comsuffix", ALLOWED_EMAIL)).toBe(
      false
    );
  });

  it("returns false for email with extra characters (prefix attack)", () => {
    expect(isEmailAllowed("prefixadmin@example.com", ALLOWED_EMAIL)).toBe(
      false
    );
  });
});
