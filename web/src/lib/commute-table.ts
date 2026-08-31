/**
 * Offline commute table: the single source of truth for driving minutes from
 * Sam's home when the Routes API cannot be reached.
 *
 * Deliberately NOT server-only. `commute.ts` (which does network I/O) and
 * `fit-flow.ts` (a pure reducer) both need it, and having two copies is how
 * Menlo Park ended up recorded as both 25 and 28 minutes on 2026-08-31.
 *
 * Values are real driving times measured against the Routes API, not
 * estimates. Order matters: the South San Francisco entry MUST precede the
 * bare San Francisco pattern, which would otherwise match it.
 */
export const FALLBACK_COMMUTE_MINUTES: ReadonlyArray<{
  pattern: RegExp;
  minutes: number;
}> = [
  { pattern: /fremont/i, minutes: 10 },
  { pattern: /newark|union\s*city/i, minutes: 14 },
  { pattern: /milpitas|hayward/i, minutes: 18 },
  { pattern: /pleasanton/i, minutes: 24 },
  { pattern: /san\s*jose|santa\s*clara/i, minutes: 26 },
  { pattern: /sunnyvale|dublin/i, minutes: 27 },
  { pattern: /menlo\s*park/i, minutes: 28 },
  { pattern: /palo\s*alto|redwood\s*city/i, minutes: 27 },
  { pattern: /mountain\s*view|cupertino/i, minutes: 29 },
  { pattern: /san\s*mateo|foster\s*city|san\s*ramon/i, minutes: 30 },
  { pattern: /oakland|alameda|livermore/i, minutes: 31 },
  { pattern: /emeryville/i, minutes: 35 },
  { pattern: /south\s*san\s*francisco|daly\s*city/i, minutes: 39 },
  { pattern: /berkeley/i, minutes: 40 },
  { pattern: /san\s*francisco|sf\b/i, minutes: 47 },
];


/** Look a location up in the offline table. Null means genuinely unknown. */
export function lookupFallbackCommute(location: string): number | null {
  for (const { pattern, minutes } of FALLBACK_COMMUTE_MINUTES) {
    if (pattern.test(location)) return minutes;
  }
  return null;
}
