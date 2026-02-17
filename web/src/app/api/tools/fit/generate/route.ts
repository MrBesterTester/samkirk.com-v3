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
import { withToolProtection } from "@/lib/tool-protection";

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
    // 1–4. Session, captcha, rate limit, spend cap
    const protection = await withToolProtection(request);
    if (!protection.ok) return protection.response;

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
