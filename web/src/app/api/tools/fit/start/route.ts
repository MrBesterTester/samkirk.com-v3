import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ingestFromPaste,
  ingestFromUrl,
  ingestFromFile,
  JobIngestionError,
  type JobIngestionResult,
  type JobFileMetadata,
} from "@/lib/job-ingestion";
import {
  initializeFitFlow,
  nextQuestion,
  setPendingQuestion,
  type NextQuestionResult,
} from "@/lib/fit-flow";
import { withToolProtection } from "@/lib/tool-protection";
import { createSubmission } from "@/lib/submission";
import { randomBytes } from "crypto";

// ============================================================================
// Request/Response Types
// ============================================================================

const StartRequestSchema = z.object({
  mode: z.enum(["paste", "url"]),
  text: z.string().optional(),
  url: z.string().url().optional(),
}).refine(
  (data) => {
    if (data.mode === "paste") {
      return typeof data.text === "string" && data.text.trim().length > 0;
    }
    if (data.mode === "url") {
      return typeof data.url === "string" && data.url.trim().length > 0;
    }
    return false;
  },
  { message: "Invalid input for the selected mode" }
);

// File upload is validated separately via FormData parsing (no Zod schema needed
// since the file comes as a multipart form field, not JSON).

interface StartSuccessResponse {
  success: true;
  flowId: string;
  submissionId: string;
  status: "question" | "ready";
  question?: {
    type: string;
    text: string;
    options?: string[];
    required: boolean;
  };
  extracted: {
    title: string | null;
    company: string | null;
    seniority: string;
    locationType: string;
  };
}

interface StartErrorResponse {
  success: false;
  error: string;
  code?: string;
  shouldPromptPaste?: boolean;
  contactEmail?: string;
}

type StartResponse = StartSuccessResponse | StartErrorResponse;

// ============================================================================
// Helper: Generate Flow ID
// ============================================================================

function generateFlowId(): string {
  return randomBytes(16).toString("base64url");
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/tools/fit/start
 *
 * Start a new Fit flow with job input (paste, URL, or file upload).
 * Requires:
 * - Valid session
 * - Captcha passed
 * - Within rate limits
 * - Within spend cap
 *
 * Request body (JSON for paste/url):
 * - mode: "paste" | "url"
 * - text?: string (required if mode === "paste")
 * - url?: string (required if mode === "url")
 *
 * Request body (FormData for file):
 * - mode: "file"
 * - file: File (the uploaded file)
 *
 * Response:
 * - flowId: string - Unique ID for this flow session
 * - submissionId: string - Submission ID for artifacts
 * - status: "question" | "ready"
 * - question?: object - Next follow-up question if status is "question"
 * - extracted: object - Initial extracted fields from job text
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<StartResponse>> {
  try {
    // 1–4. Session, captcha, rate limit, spend cap
    const protection = await withToolProtection(request);
    if (!protection.ok) return protection.response;
    const { sessionId } = protection;

    // 5. Parse request body (JSON for paste/url, FormData for file)
    let jobIngestion: JobIngestionResult;
    let inputMode: "paste" | "url" | "file";

    const contentType = request.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    if (isFormData) {
      // File upload mode — parse FormData
      try {
        const formData = await request.formData();
        const mode = formData.get("mode");
        const file = formData.get("file");

        if (mode !== "file" || !(file instanceof File)) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid file upload request",
              code: "INVALID_REQUEST",
            },
            { status: 400 }
          );
        }

        inputMode = "file";
        const buffer = Buffer.from(await file.arrayBuffer());
        const metadata: JobFileMetadata = {
          filename: file.name,
          size: file.size,
          contentType: file.type || undefined,
        };

        jobIngestion = await ingestFromFile(buffer, metadata);
      } catch (error) {
        if (error instanceof JobIngestionError) {
          return NextResponse.json(
            {
              success: false,
              error: error.message,
              code: error.code,
              shouldPromptPaste: error.shouldPromptPaste,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    } else {
      // JSON mode — paste or url
      let body: z.infer<typeof StartRequestSchema>;
      try {
        const rawBody = await request.json();
        const parseResult = StartRequestSchema.safeParse(rawBody);
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

      // 6. Ingest job input
      inputMode = body.mode;
      try {
        if (body.mode === "paste" && body.text) {
          jobIngestion = ingestFromPaste(body.text);
        } else if (body.mode === "url" && body.url) {
          jobIngestion = await ingestFromUrl(body.url);
        } else {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid input mode",
              code: "INVALID_REQUEST",
            },
            { status: 400 }
          );
        }
      } catch (error) {
        if (error instanceof JobIngestionError) {
          return NextResponse.json(
            {
              success: false,
              error: error.message,
              code: error.code,
              shouldPromptPaste: error.shouldPromptPaste,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // 7. Create submission record
    const { id: submissionId } = await createSubmission({
      tool: "fit",
      sessionId,
      inputs: {
        mode: inputMode,
        sourceIdentifier: jobIngestion.sourceIdentifier,
        characterCount: jobIngestion.characterCount,
        wordCount: jobIngestion.wordCount,
      },
    });

    // 8. Initialize fit flow
    const flowId = generateFlowId();
    let flowState = initializeFitFlow(flowId, jobIngestion);

    // 9. Determine next action (question or ready for report)
    const nextResult: NextQuestionResult = nextQuestion(flowState);

    let responseStatus: "question" | "ready";
    let responseQuestion: StartSuccessResponse["question"] | undefined;

    if (nextResult.status === "question") {
      // Set pending question on state
      flowState = setPendingQuestion(flowState, nextResult.question);
      responseStatus = "question";
      responseQuestion = {
        type: nextResult.question.type,
        text: nextResult.question.text,
        options: nextResult.question.options,
        required: nextResult.question.required,
      };
    } else if (nextResult.status === "ready") {
      responseStatus = "ready";
    } else {
      // Error status
      return NextResponse.json(
        {
          success: false,
          error: nextResult.message,
          code: "FLOW_ERROR",
        },
        { status: 400 }
      );
    }

    // 10. Return response
    // Note: In a production app, we'd persist flowState to Firestore or Redis
    // For now, we'll send the state back to the client to manage
    const response: StartSuccessResponse = {
      success: true,
      flowId,
      submissionId,
      status: responseStatus,
      question: responseQuestion,
      extracted: {
        title: flowState.extracted.title,
        company: flowState.extracted.company,
        seniority: flowState.extracted.seniority,
        locationType: flowState.extracted.locationType,
      },
    };

    // Include flow state data in a header for the client to send back
    // This is a simple approach; production would use server-side session storage
    const responseHeaders = new Headers();
    responseHeaders.set(
      "X-Fit-Flow-State",
      Buffer.from(JSON.stringify(flowState)).toString("base64")
    );

    return NextResponse.json(response, { headers: responseHeaders });
  } catch (error) {
    console.error("Fit start error:", error);
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
