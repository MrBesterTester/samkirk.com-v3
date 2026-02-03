import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  processAnswer,
  nextQuestion,
  setPendingQuestion,
  finalizeForReport,
  type FitFlowState,
  type FollowUpAnswer,
  type NextQuestionResult,
} from "@/lib/fit-flow";
import {
  generateAndStoreFitReport,
  type FitReport,
} from "@/lib/fit-report";
import {
  getSessionIdFromCookies,
  isSessionValid,
  getSession,
} from "@/lib/session";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { enforceSpendCap, SpendCapError } from "@/lib/spend-cap";

// ============================================================================
// Request/Response Types
// ============================================================================

const AnswerRequestSchema = z.object({
  flowState: z.string(), // Base64-encoded flow state
  submissionId: z.string().min(1),
  questionType: z.enum([
    "seniority",
    "location",
    "must_have_skills",
    "onsite_frequency",
    "commute_estimate",
  ]),
  response: z.string().min(1, "Response cannot be empty"),
});

interface AnswerQuestionResponse {
  success: true;
  status: "question";
  question: {
    type: string;
    text: string;
    options?: string[];
    required: boolean;
  };
  followUpsAsked: number;
}

interface AnswerReadyResponse {
  success: true;
  status: "ready";
  followUpsAsked: number;
}

interface AnswerCompleteResponse {
  success: true;
  status: "complete";
  report: {
    overallScore: string;
    recommendation: string;
    categories: Array<{
      name: string;
      score: string;
      rationale: string;
    }>;
    unknowns: string[];
  };
  downloadReady: boolean;
}

interface AnswerErrorResponse {
  success: false;
  error: string;
  code?: string;
  contactEmail?: string;
}

type AnswerResponse =
  | AnswerQuestionResponse
  | AnswerReadyResponse
  | AnswerCompleteResponse
  | AnswerErrorResponse;

// ============================================================================
// Helper: Check Captcha Passed
// ============================================================================

async function hasCaptchaPassed(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;
  return !!session.captchaPassedAt;
}

// ============================================================================
// Helper: Parse Flow State
// ============================================================================

function parseFlowState(encoded: string): FitFlowState | null {
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    // Basic validation
    if (
      typeof parsed.flowId !== "string" ||
      typeof parsed.jobText !== "string"
    ) {
      return null;
    }
    // Restore Date objects
    parsed.createdAt = new Date(parsed.createdAt);
    parsed.updatedAt = new Date(parsed.updatedAt);
    return parsed as FitFlowState;
  } catch {
    return null;
  }
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/tools/fit/answer
 *
 * Submit an answer to a follow-up question in the Fit flow.
 *
 * Request body:
 * - flowState: string - Base64-encoded flow state from previous response
 * - submissionId: string - The submission ID
 * - questionType: string - Type of question being answered
 * - response: string - User's answer
 *
 * Response varies based on flow status:
 * - status: "question" - Another follow-up question needed
 * - status: "ready" - Ready to generate report (client should call again with no answer)
 * - status: "complete" - Report generated, includes results
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AnswerResponse>> {
  try {
    // 1. Check session
    const sessionId = await getSessionIdFromCookies();
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "No session found. Please refresh the page.",
          code: "NO_SESSION",
        },
        { status: 401 }
      );
    }

    const sessionValid = await isSessionValid(sessionId);
    if (!sessionValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expired. Please refresh the page.",
          code: "SESSION_EXPIRED",
        },
        { status: 401 }
      );
    }

    // 2. Check captcha
    const captchaPassed = await hasCaptchaPassed(sessionId);
    if (!captchaPassed) {
      return NextResponse.json(
        {
          success: false,
          error: "Please complete the captcha verification first.",
          code: "CAPTCHA_REQUIRED",
        },
        { status: 403 }
      );
    }

    // 3. Parse request body
    let body: z.infer<typeof AnswerRequestSchema>;
    try {
      const rawBody = await request.json();
      const parseResult = AnswerRequestSchema.safeParse(rawBody);
      if (!parseResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: parseResult.error.issues[0]?.message || "Invalid request",
            code: "INVALID_REQUEST",
          },
          { status: 400 }
        );
      }
      body = parseResult.data;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          code: "INVALID_REQUEST",
        },
        { status: 400 }
      );
    }

    // 4. Parse flow state
    const flowState = parseFlowState(body.flowState);
    if (!flowState) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid flow state. Please start over.",
          code: "INVALID_FLOW_STATE",
        },
        { status: 400 }
      );
    }

    // 5. Verify there's a pending question
    if (!flowState.pendingQuestion) {
      return NextResponse.json(
        {
          success: false,
          error: "No pending question to answer.",
          code: "NO_PENDING_QUESTION",
        },
        { status: 400 }
      );
    }

    // 6. Process the answer
    const answer: FollowUpAnswer = {
      questionType: body.questionType,
      response: body.response,
      answeredAt: new Date(),
    };

    let updatedState = processAnswer(flowState, answer);

    if (updatedState.status === "error") {
      return NextResponse.json(
        {
          success: false,
          error: updatedState.errorMessage || "Failed to process answer",
          code: "PROCESS_ERROR",
        },
        { status: 400 }
      );
    }

    // 7. Determine next action
    const nextResult: NextQuestionResult = nextQuestion(updatedState);

    if (nextResult.status === "question") {
      // More questions needed
      updatedState = setPendingQuestion(updatedState, nextResult.question);

      const responseHeaders = new Headers();
      responseHeaders.set(
        "X-Fit-Flow-State",
        Buffer.from(JSON.stringify(updatedState)).toString("base64")
      );

      const response: AnswerQuestionResponse = {
        success: true,
        status: "question",
        question: {
          type: nextResult.question.type,
          text: nextResult.question.text,
          options: nextResult.question.options,
          required: nextResult.question.required,
        },
        followUpsAsked: updatedState.followUpsAsked,
      };

      return NextResponse.json(response, { headers: responseHeaders });
    }

    if (nextResult.status === "ready") {
      // Ready to generate report
      // Enforce rate limit and spend cap before generating
      try {
        await enforceRateLimit(request);
      } catch (error) {
        if (error instanceof RateLimitError) {
          return NextResponse.json(
            {
              success: false,
              error: error.message,
              code: "RATE_LIMIT_EXCEEDED",
              contactEmail: error.contactEmail,
            },
            { status: error.statusCode }
          );
        }
        throw error;
      }

      try {
        await enforceSpendCap();
      } catch (error) {
        if (error instanceof SpendCapError) {
          return NextResponse.json(
            {
              success: false,
              error: error.message,
              code: "SPEND_CAP_EXCEEDED",
              contactEmail: error.contactEmail,
            },
            { status: error.statusCode }
          );
        }
        throw error;
      }

      // Finalize state and generate report
      const finalizedState = finalizeForReport(updatedState);
      
      let report: FitReport;
      try {
        report = await generateAndStoreFitReport(body.submissionId, finalizedState);
      } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to generate report. Please try again.",
            code: "REPORT_GENERATION_FAILED",
          },
          { status: 500 }
        );
      }

      const response: AnswerCompleteResponse = {
        success: true,
        status: "complete",
        report: {
          overallScore: report.analysis.overallScore,
          recommendation: report.analysis.recommendation,
          categories: report.analysis.categories.map((cat) => ({
            name: cat.name,
            score: cat.score,
            rationale: cat.rationale,
          })),
          unknowns: report.analysis.unknowns,
        },
        downloadReady: true,
      };

      return NextResponse.json(response);
    }

    // Error status from nextQuestion
    return NextResponse.json(
      {
        success: false,
        error: nextResult.message,
        code: "FLOW_ERROR",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Fit answer error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
