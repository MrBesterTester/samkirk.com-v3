import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  GA_EVENTS,
  trackEvent,
  trackNavClick,
  trackCtaClick,
  trackContactClick,
  trackArtifactDownload,
  trackJobLoaded,
  trackToolRunStarted,
  trackToolRunCompleted,
  trackToolRunFailed,
  trackChatMessage,
  trackToolDownload,
  trackToolReset,
} from "./analytics";

type GtagMock = ReturnType<typeof vi.fn>;

function installGtag(): GtagMock {
  const gtag = vi.fn();
  (window as unknown as { gtag?: unknown }).gtag = gtag;
  return gtag;
}

function removeGtag(): void {
  delete (window as unknown as { gtag?: unknown }).gtag;
}

describe("analytics", () => {
  let gtag: GtagMock;

  beforeEach(() => {
    gtag = installGtag();
  });

  afterEach(() => {
    removeGtag();
    vi.restoreAllMocks();
  });

  describe("trackEvent", () => {
    it("forwards the event name and params to gtag", () => {
      trackEvent(GA_EVENTS.CTA_CLICK, { cta_id: "home_hire_me" });

      expect(gtag).toHaveBeenCalledWith("event", "cta_click", {
        cta_id: "home_hire_me",
      });
    });

    it("sends an empty params object when none are supplied", () => {
      trackEvent(GA_EVENTS.TOOL_RESET);

      expect(gtag).toHaveBeenCalledWith("event", "tool_reset", {});
    });

    it("drops undefined params rather than sending them", () => {
      trackEvent(GA_EVENTS.CTA_CLICK, { cta_id: "x", cta_text: undefined });

      expect(gtag).toHaveBeenCalledWith("event", "cta_click", { cta_id: "x" });
    });

    it("truncates string params to GA4's 100-character limit", () => {
      trackEvent(GA_EVENTS.TOOL_JOB_LOADED, { job_title: "a".repeat(250) });

      const params = gtag.mock.calls[0][2] as Record<string, string>;
      expect(params.job_title).toHaveLength(100);
    });

    it("leaves numeric and boolean params untouched", () => {
      trackEvent(GA_EVENTS.TOOL_CHAT_MESSAGE, { message_index: 3, first: true });

      expect(gtag).toHaveBeenCalledWith("event", "tool_chat_message", {
        message_index: 3,
        first: true,
      });
    });

    it("is a no-op when gtag is absent", () => {
      removeGtag();

      expect(() => trackEvent(GA_EVENTS.CTA_CLICK, { cta_id: "x" })).not.toThrow();
    });

    it("is a no-op when gtag is present but not a function", () => {
      (window as unknown as { gtag?: unknown }).gtag = "not-a-function";

      expect(() => trackEvent(GA_EVENTS.CTA_CLICK, { cta_id: "x" })).not.toThrow();
    });
  });

  describe("event names", () => {
    it("keeps every name snake_case and within GA4's 40-char limit", () => {
      for (const name of Object.values(GA_EVENTS)) {
        expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
        expect(name.length).toBeLessThanOrEqual(40);
      }
    });

    it("has no duplicate names", () => {
      const names = Object.values(GA_EVENTS);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe("helpers", () => {
    it("trackNavClick records label, href, and location", () => {
      trackNavClick("Robotics", "/robotics", "header_desktop");

      expect(gtag).toHaveBeenCalledWith("event", "nav_click", {
        link_text: "Robotics",
        link_url: "/robotics",
        nav_location: "header_desktop",
      });
    });

    it("trackCtaClick includes the current path", () => {
      trackCtaClick("home_hire_me", "Hire Me");

      const params = gtag.mock.calls[0][2] as Record<string, string>;
      expect(params.cta_id).toBe("home_hire_me");
      expect(params.cta_text).toBe("Hire Me");
      expect(params.page_path).toBe(window.location.pathname);
    });

    it("trackContactClick records the method", () => {
      trackContactClick("email");

      expect(gtag).toHaveBeenCalledWith("event", "contact_click", {
        method: "email",
      });
    });

    it("trackArtifactDownload records a stable artifact id", () => {
      trackArtifactDownload("category-theory");

      expect(gtag).toHaveBeenCalledWith("event", "artifact_download", {
        artifact_id: "category-theory",
      });
    });

    it("trackJobLoaded omits absent title and company", () => {
      trackJobLoaded();

      expect(gtag).toHaveBeenCalledWith("event", "tool_job_loaded", {});
    });

    it("trackToolRunStarted records the run type", () => {
      trackToolRunStarted("fit_report");

      expect(gtag).toHaveBeenCalledWith("event", "tool_run_started", {
        run_type: "fit_report",
      });
    });

    it("trackToolRunCompleted converts duration to whole seconds", () => {
      trackToolRunCompleted("resume", 12_400);

      expect(gtag).toHaveBeenCalledWith("event", "tool_run_completed", {
        run_type: "resume",
        duration_seconds: 12,
      });
    });

    it("trackToolRunCompleted omits duration when not supplied", () => {
      trackToolRunCompleted("resume");

      expect(gtag).toHaveBeenCalledWith("event", "tool_run_completed", {
        run_type: "resume",
      });
    });

    it("trackToolRunFailed records the reason", () => {
      trackToolRunFailed("fit_report", "timeout");

      expect(gtag).toHaveBeenCalledWith("event", "tool_run_failed", {
        run_type: "fit_report",
        reason: "timeout",
      });
    });

    it("trackChatMessage records the message index", () => {
      trackChatMessage(2);

      expect(gtag).toHaveBeenCalledWith("event", "tool_chat_message", {
        message_index: 2,
      });
    });

    it("trackToolDownload records the run type", () => {
      trackToolDownload("resume");

      expect(gtag).toHaveBeenCalledWith("event", "tool_download", {
        run_type: "resume",
      });
    });

    it("trackToolReset sends no params", () => {
      trackToolReset();

      expect(gtag).toHaveBeenCalledWith("event", "tool_reset", {});
    });
  });
});
