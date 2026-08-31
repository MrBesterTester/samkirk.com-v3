import "server-only";

import { GoogleAuth } from "google-auth-library";
import { getGcpCredentials } from "./gcp-credentials";
import { getEnv } from "./env";
import { lookupFallbackCommute } from "./commute-table";

/**
 * Commute-time lookup from Sam's home to a prospective office.
 *
 * Replaces a hand-maintained table of ten Bay Area cities that was both wrong
 * and incomplete (audited 2026-08-31 against the Routes API):
 *
 *   - It overstated nearly every Peninsula city -- Menlo Park 40 vs 28 real,
 *     Redwood City 40 vs 27, San Mateo 45 vs 30, South SF 55 vs 39. Combined
 *     with the old 30-minute threshold that quietly ruled out the entire
 *     Peninsula, which is where the roles Sam wants actually are.
 *   - Eleven Bay Area cities were missing outright, including Pleasanton (24
 *     minutes -- closer than Palo Alto), Dublin and Livermore.
 *   - A missing city produced `null`, which the fit flow converted into a
 *     confident "Poorly" verdict rather than an admission of ignorance.
 *
 * Authentication reuses the credentials the app already holds for Vertex AI.
 * The Routes API accepts OAuth bearer tokens, so no separate API key has to be
 * created, stored or rotated.
 */

export { FALLBACK_COMMUTE_MINUTES, lookupFallbackCommute } from "./commute-table";

/** Sam's home, the origin for every lookup. */
export const COMMUTE_ORIGIN = "Fremont, CA" as const;

const ROUTES_ENDPOINT =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

/** Give up on a slow lookup rather than stall the fit flow. */
export const ROUTES_TIMEOUT_MS = 5000;


export type CommuteSource = "routes_api" | "fallback_table" | "unknown";

export interface CommuteEstimate {
  /** One-way driving minutes, or null when genuinely undetermined. */
  minutes: number | null;
  /** Straight-line-free road distance in miles, when the API answered. */
  miles: number | null;
  /** Where the number came from. Never present an "unknown" as a real answer. */
  source: CommuteSource;
}

/** Process-lifetime cache; office locations repeat within a session. */
const cache = new Map<string, CommuteEstimate>();

/** Exposed for tests. */
export function resetCommuteCache(): void {
  cache.clear();
}



async function fetchAccessToken(): Promise<string | null> {
  try {
    const credentials = getGcpCredentials();
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      ...(credentials ? { credentials } : {}),
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token?.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Estimate the one-way driving commute from Sam's home to `location`.
 *
 * Never throws and never guesses: on any failure the caller gets
 * `source: "unknown"` with `minutes: null`, which the fit flow must report as
 * "could not determine" rather than as a poor location fit.
 */
export async function estimateCommute(
  location: string
): Promise<CommuteEstimate> {
  const key = location.trim().toLowerCase();
  if (!key) return { minutes: null, miles: null, source: "unknown" };

  const cached = cache.get(key);
  if (cached) return cached;

  const result = await computeViaRoutesApi(location);
  const estimate: CommuteEstimate =
    result ??
    (() => {
      const minutes = lookupFallbackCommute(location);
      return minutes === null
        ? { minutes: null, miles: null, source: "unknown" as const }
        : { minutes, miles: null, source: "fallback_table" as const };
    })();

  cache.set(key, estimate);
  return estimate;
}

async function computeViaRoutesApi(
  location: string
): Promise<CommuteEstimate | null> {
  const token = await fetchAccessToken();
  if (!token) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROUTES_TIMEOUT_MS);

  try {
    const response = await fetch(ROUTES_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Goog-User-Project": getEnv().GCP_PROJECT_ID,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { address: COMMUTE_ORIGIN },
        destination: { address: location },
        travelMode: "DRIVE",
        // TRAFFIC_UNAWARE keeps the answer stable and cheap. A rush-hour
        // number would change between runs and make reports irreproducible.
        routingPreference: "TRAFFIC_UNAWARE",
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      routes?: Array<{ duration?: string; distanceMeters?: number }>;
    };
    const route = data.routes?.[0];
    if (!route?.duration) return null;

    const seconds = Number.parseInt(route.duration.replace(/s$/, ""), 10);
    if (!Number.isFinite(seconds)) return null;

    return {
      minutes: Math.round(seconds / 60),
      miles:
        typeof route.distanceMeters === "number"
          ? Math.round(route.distanceMeters / 1609)
          : null,
      source: "routes_api",
    };
  } catch {
    // Timeout, network failure, malformed response -- all mean "unknown".
    return null;
  } finally {
    clearTimeout(timer);
  }
}
