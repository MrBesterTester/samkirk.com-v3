import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSessionIdFromCookies,
  isSessionValid,
  getSession,
} from "@/lib/session";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { enforceSpendCap, SpendCapError } from "@/lib/spend-cap";
import {
  getOrCreateConversation,
  processMessage,
  getConversationBySubmissionId,
  endConversation,
  MAX_MESSAGE_LENGTH,
  type ChatResponse,
  type ChatErrorResponse,
  type InterviewConversation,
} from "@/lib/interview-chat";
import { randomBytes } from "crypto";

// ============================================================================
// Request/Response Types
// ============================================================================

const InterviewRequestSchema = z.object({
  action: z.enum(["message", "end"]),
  message: z.string().max(MAX_MESSAGE_LENGTH).nullish(),
  conversationId: z.string().nullish(),
  submissionId: z.string().nullish(),
}).refine(
  (data) => {
    if (data.action === "message") {
      return typeof data.message === "string" && data.message.trim().length > 0;
    }
    if (data.action === "end") {
      return typeof data.submissionId === "string" && data.submissionId.length > 0;
    }
    return false;
  },
  { message: "Invalid request for the specified action" }
);

interface InterviewSuccessResponse {
  success: true;
  conversationId: string;
  submissionId: string;
  message?: {
    role: "assistant";
    content: string;
    timestamp: string;
  };
  turnCount: number;
  isComplete: boolean;
  downloadReady: boolean;
}

interface InterviewEndResponse {
  success: true;
  message: string;
}

interface InterviewErrorResponse {
  success: false;
  error: string;
  code?: string;
  contactEmail?: string;
}

type InterviewResponse =
  | InterviewSuccessResponse
  | InterviewEndResponse
  | InterviewErrorResponse;

// ============================================================================
// Helper: Generate Conversation ID
// ============================================================================

function generateConversationId(): string {
  return randomBytes(16).toString("base64url");
}

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
 * POST /api/tools/interview
 *
 * Handle interview chat interactions.
 * Requires:
 * - Valid session
 * - Captcha passed
 * - Within rate limits
 * - Within spend cap
 *
 * Request body:
 * - action: "message" | "end"
 * - message?: string (required if action === "message")
 * - conversationId?: string (optional, will generate if not provided)
 * - submissionId?: string (required for continuing existing conversation or ending)
 *
 * Response:
 * - conversationId: string - ID for this conversation
 * - submissionId: string - Submission ID for artifacts/download
 * - message?: object - The assistant's response
 * - turnCount: number - Current number of turns
 * - isComplete: boolean - Whether the conversation has ended
 * - downloadReady: boolean - Whether the transcript is available for download
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<InterviewResponse>> {
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

    // 4. Parse request body
    let body: z.infer<typeof InterviewRequestSchema>;
    try {
      const rawBody = await request.json();
      const parseResult = InterviewRequestSchema.safeParse(rawBody);
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

    // 5. Handle "end" action
    if (body.action === "end" && body.submissionId) {
      const conversation = await getConversationBySubmissionId(body.submissionId);
      if (!conversation) {
        return NextResponse.json(
          {
            success: false,
            error: "Conversation not found",
            code: "NOT_FOUND",
          },
          { status: 404 }
        );
      }

      await endConversation(conversation);

      return NextResponse.json({
        success: true,
        message: "Conversation ended successfully. Transcript is available for download.",
      });
    }

    // 6. Handle "message" action
    if (body.action === "message" && body.message) {
      // Enforce spend cap before processing message (LLM call)
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

      // Get or create conversation
      const conversationId = body.conversationId || generateConversationId();
      let conversation: InterviewConversation;

      try {
        conversation = await getOrCreateConversation(
          sessionId,
          conversationId,
          body.submissionId
        );
      } catch (error) {
        console.error("Failed to get/create conversation:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to initialize conversation. Please try again.",
            code: "CONVERSATION_INIT_FAILED",
          },
          { status: 500 }
        );
      }

      // Process the message
      const result = await processMessage(conversation, body.message);

      if (!result.success) {
        const errorResult = result as ChatErrorResponse;
        return NextResponse.json(
          {
            success: false,
            error: errorResult.error,
            code: errorResult.code,
            contactEmail: errorResult.contactEmail,
          },
          { status: 400 }
        );
      }

      const chatResult = result as ChatResponse;

      // Return success response
      const response: InterviewSuccessResponse = {
        success: true,
        conversationId: chatResult.conversationId,
        submissionId: chatResult.submissionId,
        message: {
          role: "assistant",
          content: chatResult.message.content,
          timestamp: chatResult.message.timestamp,
        },
        turnCount: chatResult.turnCount,
        isComplete: chatResult.isComplete,
        downloadReady: chatResult.downloadReady,
      };

      return NextResponse.json(response);
    }

    // Invalid action/request combination
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
        code: "INVALID_REQUEST",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Interview endpoint error:", error);

    // Handle spend cap errors that might be thrown during message processing
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
