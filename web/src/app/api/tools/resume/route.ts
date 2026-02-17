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
  generateAndStoreResume,
  ResumeGeneratorError,
  type GeneratedResume,
} from "@/lib/resume-generator";
import { SpendCapError } from "@/lib/spend-cap";
import { withToolProtection } from "@/lib/tool-protection";
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

// File upload is validated separately via FormData parsing (no Zod schema needed
// since the file comes as a multipart form field, not JSON).

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
 * - submissionId: string - Submission ID for artifacts/download
 * - resume: object - Summary of the generated resume
 * - downloadReady: boolean - Whether the artifact bundle is ready
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ResumeResponse>> {
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
      tool: "resume",
      sessionId,
      inputs: {
        mode: inputMode,
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
