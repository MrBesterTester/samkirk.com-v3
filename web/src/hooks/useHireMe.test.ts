import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useHireMe } from "./useHireMe";

/**
 * These tests drive the real hook against a stubbed `fetch` and assert on the
 * events that reach `window.gtag`.
 *
 * Asserting at the gtag boundary rather than mocking `@/lib/analytics` means the
 * whole production path is exercised — the hook's call, `trackToolRunFailed`,
 * and `sanitizeParams` — instead of a mock of our own code. `window.gtag` is a
 * genuine third-party seam, so stubbing it is honest.
 */

type GtagCall = [command: string, name: string, params?: Record<string, unknown>];

function gtagEvents(gtag: ReturnType<typeof vi.fn>, name: string): GtagCall[] {
  return (gtag.mock.calls as GtagCall[]).filter(
    ([command, eventName]) => command === "event" && eventName === name,
  );
}

/** A fit "start" response that parks the flow on a question. */
function fitStartQuestionResponse(): Response {
  return new Response(
    JSON.stringify({
      success: true,
      submissionId: "sub-1",
      status: "question",
      question: {
        type: "commute",
        text: "How far are you willing to commute?",
        required: true,
      },
      extracted: {
        title: "Staff Engineer",
        company: "Acme",
        seniority: "staff",
        locationType: "hybrid",
      },
    }),
    { status: 200, headers: { "X-Fit-Flow-State": "flow-state-1" } },
  );
}

describe("useHireMe", () => {
  let gtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtag = vi.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  describe("answerFitQuestion", () => {
    it("reports a failed answer round-trip as tool_run_failed", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(fitStartQuestionResponse())
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: "Vertex AI unavailable" }), {
            status: 503,
          }),
        );
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useHireMe());

      act(() => {
        result.current.loadJob("paste", { text: "A job posting." });
      });

      await act(async () => {
        await result.current.triggerFit();
      });

      // The flow must actually be parked on a question, or the answer call
      // below returns early and the test proves nothing.
      expect(result.current.state.fitFlow.active).toBe(true);
      expect(result.current.state.fitFlow.flowState).toBe("flow-state-1");

      await act(async () => {
        await result.current.answerFitQuestion("q-1", "Up to 45 minutes.");
      });

      const failures = gtagEvents(gtag, "tool_run_failed");
      expect(failures).toHaveLength(1);
      expect(failures[0][2]).toMatchObject({
        run_type: "fit_report",
        reason: "Vertex AI unavailable",
      });
    });

    it("reports a successful answer round-trip as completed, not failed", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(fitStartQuestionResponse())
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              success: true,
              status: "complete",
              report: {
                overallScore: "Well",
                recommendation: "Strong fit for the role.",
                categories: [
                  { name: "Experience", score: "Well", rationale: "45+ years." },
                ],
                unknowns: [],
              },
            }),
            { status: 200 },
          ),
        );
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useHireMe());

      act(() => {
        result.current.loadJob("paste", { text: "A job posting." });
      });

      await act(async () => {
        await result.current.triggerFit();
      });

      expect(result.current.state.fitFlow.active).toBe(true);

      await act(async () => {
        await result.current.answerFitQuestion("q-1", "Up to 45 minutes.");
      });

      // The completion path must stay instrumented, and the failure event must
      // not fire on a run that succeeded — a fix that emitted `tool_run_failed`
      // unconditionally would satisfy the previous test but break this one.
      const completions = gtagEvents(gtag, "tool_run_completed");
      expect(completions).toHaveLength(1);
      expect(completions[0][2]).toMatchObject({ run_type: "fit_report" });
      expect(gtagEvents(gtag, "tool_run_failed")).toHaveLength(0);
    });
  });
});
