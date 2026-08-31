/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./gcp-credentials", () => ({ getGcpCredentials: () => undefined }));
vi.mock("./env", () => ({ getEnv: () => ({ GCP_PROJECT_ID: "test-project" }) }));

const getAccessToken = vi.fn();
vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    getClient() {
      return Promise.resolve({ getAccessToken });
    }
  },
}));

const {
  estimateCommute,
  lookupFallbackCommute,
  resetCommuteCache,
  FALLBACK_COMMUTE_MINUTES,
  COMMUTE_ORIGIN,
} = await import("./commute");

describe("lookupFallbackCommute", () => {
  it("resolves South San Francisco before the bare San Francisco pattern", () => {
    // The original table listed South SF after /san\s*francisco/, so it was
    // unreachable and South SF was scored as San Francisco.
    expect(lookupFallbackCommute("South San Francisco, CA")).toBe(39);
    expect(lookupFallbackCommute("San Francisco, CA")).toBe(47);
  });

  it("covers the cities that used to be missing entirely", () => {
    // Each of these previously returned null, which the fit flow turned into a
    // confident "Poorly" verdict.
    expect(lookupFallbackCommute("Pleasanton, CA")).toBe(24);
    expect(lookupFallbackCommute("Dublin, CA")).toBe(27);
    expect(lookupFallbackCommute("Livermore, CA")).toBe(31);
    expect(lookupFallbackCommute("San Ramon, CA")).toBe(30);
    expect(lookupFallbackCommute("Emeryville, CA")).toBe(35);
  });

  it("puts Menlo Park at its measured time, not the old 40", () => {
    expect(lookupFallbackCommute("Menlo Park, CA")).toBe(28);
  });

  it("returns null for somewhere genuinely unknown", () => {
    expect(lookupFallbackCommute("Reykjavik, Iceland")).toBeNull();
  });

  it("orders every entry so the first match is the intended one", () => {
    for (const { pattern, minutes } of FALLBACK_COMMUTE_MINUTES) {
      const sample = pattern.source
        .split("|")[0]
        .replace(/\\s\*/g, " ")
        .replace(/\\b/g, "");
      expect(lookupFallbackCommute(sample)).toBe(minutes);
    }
  });
});

describe("estimateCommute", () => {
  beforeEach(() => {
    resetCommuteCache();
    vi.restoreAllMocks();
    getAccessToken.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the Routes API when it answers", async () => {
    getAccessToken.mockResolvedValue({ token: "tok" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          routes: [{ duration: "1705s", distanceMeters: 26622 }],
        }),
      })
    );

    const result = await estimateCommute("Menlo Park, CA");

    expect(result).toEqual({ minutes: 28, miles: 17, source: "routes_api" });
  });

  it("sends Sam's home as the origin", async () => {
    getAccessToken.mockResolvedValue({ token: "tok" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ duration: "600s" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await estimateCommute("Palo Alto, CA");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.origin.address).toBe(COMMUTE_ORIGIN);
    expect(body.destination.address).toBe("Palo Alto, CA");
  });

  it("falls back to the table when the API errors", async () => {
    getAccessToken.mockResolvedValue({ token: "tok" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const result = await estimateCommute("Menlo Park, CA");

    expect(result).toEqual({ minutes: 28, miles: null, source: "fallback_table" });
  });

  it("falls back when no credentials are available", async () => {
    getAccessToken.mockResolvedValue(null);

    const result = await estimateCommute("Pleasanton, CA");

    expect(result.source).toBe("fallback_table");
    expect(result.minutes).toBe(24);
  });

  it("reports unknown rather than guessing when both fail", async () => {
    getAccessToken.mockResolvedValue({ token: "tok" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await estimateCommute("Reykjavik, Iceland");

    expect(result).toEqual({ minutes: null, miles: null, source: "unknown" });
  });

  it("caches so a repeated location costs one API call", async () => {
    getAccessToken.mockResolvedValue({ token: "tok" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ duration: "1705s", distanceMeters: 26622 }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await estimateCommute("Menlo Park, CA");
    await estimateCommute("menlo park, ca");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats a blank location as unknown without calling out", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await estimateCommute("   ")).toEqual({
      minutes: null,
      miles: null,
      source: "unknown",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
