import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  finalizeForReport,
  type FitFlowState,
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

const GenerateRequestSchema = z.object({
  flowState: z.string(), // Base64-encoded flow state
  submissionId: z.string().min(1),
});

interface GenerateSuccessResponse {
  success: true;
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

interface GenerateErrorResponse {
  success: false;
  error: string;
  code?: string;
  contactEmail?: string;
}

type GenerateResponse = GenerateSuccessResponse | GenerateErrorResponse;

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
 * POST /api/tools/fit/generate
 *
 * Generate the fit report when the flow is ready (no more questions needed).
 *
 * Request body:
 * - flowState: string - Base64-encoded flow state from previous response
 * - submissionId: string - The submission ID
 *
 * Response:
 * - report: object - The generated fit analysis report
 * - downloadReady: boolean - Whether the artifact bundle is ready for download
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateResponse>> {
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

    // 3. Enforce rate limit
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

    // 4. Enforce spend cap
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

    // 5. Parse request body
    let body: z.infer<typeof GenerateRequestSchema>;
    try {
      const rawBody = await request.json();
      const parseResult = GenerateRequestSchema.safeParse(rawBody);
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

    // 6. Parse flow state
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

    // 7. Finalize state and generate report
    const finalizedState = finalizeForReport(flowState);

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

    const response: GenerateSuccessResponse = {
      success: true,
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
  } catch (error) {
    console.error("Fit generate error:", error);
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
