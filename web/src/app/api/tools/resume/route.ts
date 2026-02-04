import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ingestFromPaste,
  ingestFromUrl,
  JobIngestionError,
  type JobIngestionResult,
} from "@/lib/job-ingestion";
import {
  generateAndStoreResume,
  ResumeGeneratorError,
  type GeneratedResume,
} from "@/lib/resume-generator";
import {
  getSessionIdFromCookies,
  isSessionValid,
  getSession,
} from "@/lib/session";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { enforceSpendCap, SpendCapError } from "@/lib/spend-cap";
import { createSubmission } from "@/lib/submission";

// ============================================================================
// Request/Response Types
// ============================================================================

const ResumeRequestSchema = z.object({
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

interface ResumeSuccessResponse {
  success: true;
  submissionId: string;
  resume: {
    header: {
      name: string;
      title: string;
      email?: string;
      location?: string;
    };
    summary: string;
    wordCount: number;
    experienceCount: number;
    skillsCount: number;
  };
  downloadReady: boolean;
}

interface ResumeErrorResponse {
  success: false;
  error: string;
  code?: string;
  shouldPromptPaste?: boolean;
  contactEmail?: string;
}

type ResumeResponse = ResumeSuccessResponse | ResumeErrorResponse;

// ============================================================================
// Helper: Check Captcha Passed
// ============================================================================

async function hasCaptchaPassed(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;
  return !!session.captchaPassedAt;
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/tools/resume
 *
 * Generate a custom resume tailored to a job posting.
 * Requires:
 * - Valid session
 * - Captcha passed
 * - Within rate limits
 * - Within spend cap
 *
 * Request body:
 * - mode: "paste" | "url"
 * - text?: string (required if mode === "paste")
 * - url?: string (required if mode === "url")
 *
 * Response:
 * - submissionId: string - Submission ID for artifacts/download
 * - resume: object - Summary of the generated resume
 * - downloadReady: boolean - Whether the artifact bundle is ready
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ResumeResponse>> {
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
    let body: z.infer<typeof ResumeRequestSchema>;
    try {
      const rawBody = await request.json();
      const parseResult = ResumeRequestSchema.safeParse(rawBody);
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
    let jobIngestion: JobIngestionResult;
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

    // 7. Create submission record
    const { id: submissionId } = await createSubmission({
      tool: "resume",
      sessionId,
      inputs: {
        mode: body.mode,
        sourceIdentifier: jobIngestion.sourceIdentifier,
        characterCount: jobIngestion.characterCount,
        wordCount: jobIngestion.wordCount,
      },
    });

    // 8. Generate resume
    let resume: GeneratedResume;
    try {
      resume = await generateAndStoreResume(submissionId, jobIngestion);
    } catch (error) {
      if (error instanceof ResumeGeneratorError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: "RESUME_GENERATION_FAILED",
          },
          { status: 500 }
        );
      }
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
      console.error("Resume generation error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate resume. Please try again.",
          code: "GENERATION_FAILED",
        },
        { status: 500 }
      );
    }

    // 9. Return success response
    const response: ResumeSuccessResponse = {
      success: true,
      submissionId,
      resume: {
        header: {
          name: resume.content.header.name,
          title: resume.content.header.title,
          email: resume.content.header.email,
          location: resume.content.header.location,
        },
        summary: resume.content.summary,
        wordCount: resume.content.experience.reduce(
          (sum, exp) => sum + exp.bullets.length,
          0
        ) + resume.content.skills.reduce(
          (sum, skill) => sum + skill.items.length,
          0
        ),
        experienceCount: resume.content.experience.length,
        skillsCount: resume.content.skills.length,
      },
      downloadReady: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Resume endpoint error:", error);
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
