/**
 * Google Analytics 4 custom event instrumentation.
 *
 * GA4's Enhanced Measurement already covers page_view, scroll, outbound link
 * clicks, and `download=` file downloads with no code. Everything in this file
 * is deliberately restricted to what Enhanced Measurement *cannot* see:
 *
 *   - internal navigation choices (which nav link, which CTA)
 *   - the /hire-me tool funnel (start → generate → download), whose downloads
 *     are JS-built blob URLs and therefore invisible to automatic tracking
 *   - contact intent (mailto / LinkedIn / booking link)
 *
 * All event names are snake_case and <= 40 chars per GA4's limits; parameter
 * values are truncated to 100 chars for the same reason.
 *
 * Every function here is a safe no-op when gtag is absent (SSR, ad blockers,
 * local dev without a measurement ID), so callers never need to guard.
 */

/**
 * Canonical event names. Import these rather than passing string literals so
 * the set stays greppable and typos fail at compile time.
 */
export const GA_EVENTS = {
  /** A click on a same-origin nav link in the header or footer. */
  NAV_CLICK: "nav_click",
  /** A click on a named call-to-action button or link within page content. */
  CTA_CLICK: "cta_click",
  /** Intent to contact Sam (email, LinkedIn, calendar booking). */
  CONTACT_CLICK: "contact_click",
  /** Download of a static exploration artifact (HTML write-up, etc.). */
  ARTIFACT_DOWNLOAD: "artifact_download",

  /* --- /hire-me tool funnel --- */
  /** A job description was successfully ingested. */
  TOOL_JOB_LOADED: "tool_job_loaded",
  /** User pressed "Analyze My Fit" or "Generate Resume". */
  TOOL_RUN_STARTED: "tool_run_started",
  /** A fit report or tailored resume finished generating. */
  TOOL_RUN_COMPLETED: "tool_run_completed",
  /** A generation attempt failed. */
  TOOL_RUN_FAILED: "tool_run_failed",
  /** User sent a free-form chat message. */
  TOOL_CHAT_MESSAGE: "tool_chat_message",
  /** User downloaded the .zip artifact bundle. */
  TOOL_DOWNLOAD: "tool_download",
  /** User reset the conversation. */
  TOOL_RESET: "tool_reset",
} as const;

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS];

/** GA4 permits string, number, and boolean parameter values. */
export type GaEventParams = Record<string, string | number | boolean | undefined>;

/** Where a nav click originated. Kept as a closed set so reports stay clean. */
export type NavLocation = "header_desktop" | "header_mobile" | "footer";

/** How the visitor chose to make contact. */
export type ContactMethod = "email" | "linkedin" | "calendar";

/** Which /hire-me flow produced the artifact. */
export type ToolRun = "fit_report" | "resume" | "interview";

/** GA4 caps parameter values at 100 characters. */
const MAX_PARAM_LENGTH = 100;

type GtagFn = (command: string, ...args: unknown[]) => void;

/**
 * Resolve gtag from the window, or undefined when it is not available.
 * Not available during SSR, before the GA script loads, or when blocked.
 */
function getGtag(): GtagFn | undefined {
  if (typeof window === "undefined") return undefined;
  const candidate = (window as unknown as { gtag?: unknown }).gtag;
  return typeof candidate === "function" ? (candidate as GtagFn) : undefined;
}

/**
 * Drop undefined params and clamp string values to GA4's 100-char limit, so a
 * long job title or page path can never silently invalidate the whole event.
 */
function sanitizeParams(params: GaEventParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    out[key] = typeof value === "string" ? value.slice(0, MAX_PARAM_LENGTH) : value;
  }
  return out;
}

/**
 * Send a custom event to GA4. No-ops when gtag is unavailable.
 *
 * Prefer the named helpers below; use this directly only for one-off events
 * that do not warrant a helper.
 */
export function trackEvent(name: GaEventName, params: GaEventParams = {}): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", name, sanitizeParams(params));
}

/** Record a header or footer navigation click. */
export function trackNavClick(label: string, href: string, location: NavLocation): void {
  trackEvent(GA_EVENTS.NAV_CLICK, {
    link_text: label,
    link_url: href,
    nav_location: location,
  });
}

/**
 * Record a click on a named in-page call to action.
 *
 * `id` is a stable slug (e.g. "home_hire_me") — keep it stable across copy
 * changes so historical reports stay comparable.
 */
export function trackCtaClick(id: string, label?: string): void {
  trackEvent(GA_EVENTS.CTA_CLICK, {
    cta_id: id,
    cta_text: label,
    page_path: typeof window === "undefined" ? undefined : window.location.pathname,
  });
}

/** Record intent to make contact. */
export function trackContactClick(method: ContactMethod): void {
  trackEvent(GA_EVENTS.CONTACT_CLICK, { method });
}

/**
 * Record a download of a static exploration artifact.
 *
 * This duplicates Enhanced Measurement's `file_download` on purpose: that event
 * keys on file extension and URL, while `artifact_id` stays stable if the file
 * is ever renamed.
 */
export function trackArtifactDownload(artifactId: string): void {
  trackEvent(GA_EVENTS.ARTIFACT_DOWNLOAD, { artifact_id: artifactId });
}

/** Record that a job description was ingested. */
export function trackJobLoaded(title?: string, company?: string): void {
  trackEvent(GA_EVENTS.TOOL_JOB_LOADED, {
    job_title: title,
    job_company: company,
  });
}

/** Record the start of a fit-report or resume generation run. */
export function trackToolRunStarted(run: ToolRun): void {
  trackEvent(GA_EVENTS.TOOL_RUN_STARTED, { run_type: run });
}

/** Record a successful generation run, with wall-clock duration in seconds. */
export function trackToolRunCompleted(run: ToolRun, durationMs?: number): void {
  trackEvent(GA_EVENTS.TOOL_RUN_COMPLETED, {
    run_type: run,
    duration_seconds: durationMs === undefined ? undefined : Math.round(durationMs / 1000),
  });
}

/** Record a failed generation run. */
export function trackToolRunFailed(run: ToolRun, reason?: string): void {
  trackEvent(GA_EVENTS.TOOL_RUN_FAILED, { run_type: run, reason });
}

/** Record a free-form chat message. `index` is 1-based within the session. */
export function trackChatMessage(index: number): void {
  trackEvent(GA_EVENTS.TOOL_CHAT_MESSAGE, { message_index: index });
}

/** Record a .zip artifact bundle download from the /hire-me tool. */
export function trackToolDownload(run: ToolRun): void {
  trackEvent(GA_EVENTS.TOOL_DOWNLOAD, { run_type: run });
}

/** Record a conversation reset. */
export function trackToolReset(): void {
  trackEvent(GA_EVENTS.TOOL_RESET, {});
}
