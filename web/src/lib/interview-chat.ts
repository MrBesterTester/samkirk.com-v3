import "server-only";

import { generateContentWithHistory, GenerationError, ContentBlockedError } from "./vertex-ai";
import {
  checkGuardrails,
  isPersistentlyOffTopic,
  generatePersistentOffTopicResponse,
  INTERVIEW_SUBJECT_NAME,
  CONTACT_EMAIL,
} from "./interview-guardrails";
import {
  getResumeContext,
  generateCitationsFromChunks,
  type ResumeContextResult,
  type Citation,
} from "./resume-context";
import {
  createSubmission,
  updateSubmission,
  completeSubmission,
  getSubmission,
} from "./submission";
import {
  getPrivateBucket,
  PrivatePaths,
  writeFile,
  writeBuffer,
  readFile,
  fileExists,
} from "./storage";
import { renderMarkdownSync } from "./markdown-renderer";

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum number of turns (user+assistant pairs) in a conversation.
 * After this limit, the user is prompted to start a new conversation.
 */
export const MAX_CONVERSATION_TURNS = 20;

/**
 * Maximum input message length (characters).
 */
export const MAX_MESSAGE_LENGTH = 2000;

/**
 * Temperature for interview responses (slightly creative but grounded).
 */
export const INTERVIEW_TEMPERATURE = 0.7;

/**
 * Maximum output tokens for interview responses.
 */
export const INTERVIEW_MAX_TOKENS = 1024;

// ============================================================================
// E2E Test Mode
// ============================================================================

/**
 * Check if E2E test mode is enabled.
 */
export function isE2ETestMode(): boolean {
  return process.env.E2E_TESTING === "true";
}

/**
 * Generate a mock response for E2E testing.
 * Used when E2E_TESTING=true and no resume chunks are available.
 */
export function generateE2EMockResponse(userMessage: string): string {
  console.log("[E2E] Generating mock interview response for testing");
  
  // Generate contextual mock responses based on common question patterns
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes("background") || lowerMessage.includes("experience")) {
    return "[E2E Mock] I have over 10 years of experience in software engineering, with a focus on full-stack development and cloud infrastructure. I've worked at both startups and larger tech companies, building scalable systems and leading technical teams.";
  }
  
  if (lowerMessage.includes("skill") || lowerMessage.includes("programming") || lowerMessage.includes("language")) {
    return "[E2E Mock] My core technical skills include TypeScript, Python, Go, and JavaScript. I'm experienced with cloud platforms (GCP, AWS), containerization (Docker, Kubernetes), and modern web frameworks like React and Next.js. I also have experience with machine learning tools including TensorFlow and PyTorch.";
  }
  
  if (lowerMessage.includes("project")) {
    return "[E2E Mock] One of my notable projects was building a real-time data pipeline that processed millions of events per day. I've also led the development of several internal tools that improved developer productivity across the organization.";
  }
  
  if (lowerMessage.includes("education") || lowerMessage.includes("degree")) {
    return "[E2E Mock] I have a Bachelor's degree in Computer Science. I also hold several cloud certifications and regularly participate in professional development through conferences and online courses.";
  }
  
  // Default response
  return "[E2E Mock] Thank you for your question about my professional background. I have extensive experience in software engineering and would be happy to discuss any specific aspects of my career, skills, or projects that interest you.";
}

// ============================================================================
// Text Processing Utilities
// ============================================================================

/**
 * Strip parenthetical chunk references from LLM output.
 * The LLM receives chunk IDs in the system prompt for citation tracking,
 * but they should never appear in user-facing responses.
 *
 * Handles formats:
 *   (chunk_42), (chunk_abc123, chunk_def456) — underscore format
 *   (chunk 1, chunk 2)                       — singular + bare numbers
 *   (chunks 1, 8, 12, 23, 33)               — plural  + bare numbers
 *   (Chunk 5), (Chunks 1, 2)                 — capitalized variants
 */
export function stripChunkReferences(text: string): string {
  // Pattern 1: chunk_ prefix with underscore (original format)
  //   e.g. (chunk_42)  (chunk_abc123, chunk_def456)
  const underscoreFmt = /\s*\(chunk_[\w]+(?:,\s*chunk_[\w]+)*\)/gi;

  // Pattern 2: "chunks" (plural) followed by bare numbers
  //   e.g. (chunks 1, 8, 12, 23, 33)
  const pluralBareNum = /\s*\(chunks\s+\d+(?:,\s*\d+)*\)/gi;

  // Pattern 3: "chunk" (singular, no underscore) followed by number, repeated
  //   e.g. (chunk 1)  (chunk 1, chunk 2, chunk 3)
  const singularBareNum = /\s*\(chunk\s+\d+(?:,\s*chunk\s+\d+)*\)/gi;

  return text
    .replace(underscoreFmt, "")
    .replace(pluralBareNum, "")
    .replace(singularBareNum, "")
    .trim();
}

// ============================================================================
// Types
// ============================================================================

/**
 * A single message in the conversation.
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * The state of an interview conversation.
 */
export interface InterviewConversation {
  conversationId: string;
  submissionId: string;
  sessionId: string;
  messages: ChatMessage[];
  citations: Citation[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Result from processing a chat message.
 */
export interface ChatResponse {
  success: true;
  conversationId: string;
  submissionId: string;
  message: ChatMessage;
  turnCount: number;
  isComplete: boolean;
  downloadReady: boolean;
}

/**
 * Error result from processing a chat message.
 */
export interface ChatErrorResponse {
  success: false;
  error: string;
  code: string;
  contactEmail?: string;
  shouldRedirect?: boolean;
  redirectResponse?: string;
}

/**
 * Error thrown when interview chat fails.
 */
export class InterviewChatError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly contactEmail?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    contactEmail?: string
  ) {
    super(message);
    this.name = "InterviewChatError";
    this.code = code;
    this.statusCode = statusCode;
    this.contactEmail = contactEmail;
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      contactEmail: this.contactEmail,
    };
  }
}

// ============================================================================
// System Prompt
// ============================================================================

/**
 * Build the system prompt for the interview chatbot.
 * Includes resume context and behavioral instructions.
 */
export function buildInterviewSystemPrompt(resumeContext: string): string {
  return `You are a professional career interview assistant representing ${INTERVIEW_SUBJECT_NAME}. Your role is to answer questions about ${INTERVIEW_SUBJECT_NAME}'s career, skills, experience, and professional background.

## YOUR KNOWLEDGE BASE

You have access to ${INTERVIEW_SUBJECT_NAME}'s resume and professional information:

<resume_context>
${resumeContext}
</resume_context>

## BEHAVIORAL GUIDELINES

1. **Stay Professional**: Always maintain a professional, friendly, and helpful tone.

2. **Be Factual**: Only provide information that is present in the resume context above. If you don't have information about something, say so honestly rather than making assumptions.

3. **Be Concise**: Keep responses focused and reasonably concise. Aim for 2-4 paragraphs for most questions.

4. **Career Focus Only**: You ONLY discuss career-related topics:
   - Work history and experience
   - Projects and achievements  
   - Technical and soft skills
   - Education and certifications
   - Availability and start date
   - Location and remote work preferences
   - Compensation expectations (if available in context)
   - Career goals and professional growth

5. **Redirect Off-Topic Questions**: If asked about personal life, politics, religion, health, or non-career topics, politely redirect to career-related discussions.

6. **No General Assistant Behavior**: Do NOT act as a general-purpose AI assistant. Decline requests to:
   - Write code or debug problems
   - Tell jokes or stories
   - Provide recipes, weather, news, etc.
   - Help with tasks unrelated to learning about ${INTERVIEW_SUBJECT_NAME}

7. **Handle Ambiguity Gracefully**: If a question is unclear, ask for clarification before answering.

8. **First-Person Perspective**: When discussing ${INTERVIEW_SUBJECT_NAME}'s experience, speak as if you ARE ${INTERVIEW_SUBJECT_NAME} (use "I", "my", etc.).

9. **No Internal Identifiers**: Never include internal chunk identifiers in your responses. This includes any form such as "chunk_abc123", "chunk 5", "chunks 1, 8, 12", or bare chunk numbers. These are for internal tracking only and must not appear in user-facing output.

## EXAMPLE RESPONSES

Good response to "Tell me about your experience":
"I have over X years of experience in [field]. Most recently, I worked at [Company] where I [accomplishment]. Before that, I was at [Previous Company] where I [achievement]. My core strengths include [skills]."

Good redirect for off-topic:
"I appreciate the question, but I'm here specifically to discuss my professional background and career qualifications. I'd be happy to tell you about my work experience, technical skills, or projects I've worked on. What aspect of my career would you like to explore?"

## CONTACT INFORMATION

If a user needs to discuss something outside this scope, they can contact ${CONTACT_EMAIL}.`;
}

// ============================================================================
// Conversation Storage
// ============================================================================

/**
 * Get the GCS path for a conversation's JSON state.
 */
function getConversationPath(submissionId: string): string {
  return PrivatePaths.submissionOutput(submissionId, "conversation.json");
}

/**
 * Get the GCS path for a conversation's transcript.
 */
function getTranscriptPath(submissionId: string): string {
  return PrivatePaths.submissionOutput(submissionId, "transcript.md");
}

/**
 * Get the GCS path for a conversation's HTML transcript.
 */
function getTranscriptHtmlPath(submissionId: string): string {
  return PrivatePaths.submissionOutput(submissionId, "transcript.html");
}

/**
 * Save conversation state to GCS.
 */
async function saveConversation(conversation: InterviewConversation): Promise<void> {
  const bucket = getPrivateBucket();
  const path = getConversationPath(conversation.submissionId);
  await writeFile(bucket, path, JSON.stringify(conversation, null, 2), "application/json");
}

/**
 * Load conversation state from GCS.
 */
async function loadConversation(
  submissionId: string
): Promise<InterviewConversation | null> {
  const bucket = getPrivateBucket();
  const path = getConversationPath(submissionId);

  const exists = await fileExists(bucket, path);
  if (!exists) {
    return null;
  }

  try {
    const content = await readFile(bucket, path);
    return JSON.parse(content) as InterviewConversation;
  } catch {
    return null;
  }
}

// ============================================================================
// Transcript Generation
// ============================================================================

/**
 * Generate a markdown transcript from the conversation.
 */
export function generateTranscript(
  conversation: InterviewConversation
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Interview Transcript`);
  lines.push("");
  lines.push(`**Candidate:** ${INTERVIEW_SUBJECT_NAME}`);
  lines.push(`**Date:** ${new Date(conversation.createdAt).toLocaleDateString()}`);
  lines.push(`**Total Messages:** ${conversation.messages.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Messages
  for (const message of conversation.messages) {
    const roleLabel = message.role === "user" ? "**Interviewer:**" : `**${INTERVIEW_SUBJECT_NAME}:**`;
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    
    lines.push(`${roleLabel} *(${timestamp})*`);
    lines.push("");
    lines.push(message.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push("");
  lines.push(`*Generated by samkirk.com Interview Tool*`);
  lines.push(`*Contact: ${CONTACT_EMAIL}*`);

  return lines.join("\n");
}

/**
 * Save transcript to GCS (both MD and HTML).
 */
async function saveTranscript(
  conversation: InterviewConversation
): Promise<void> {
  const bucket = getPrivateBucket();
  const transcript = generateTranscript(conversation);

  // Save markdown
  await writeFile(
    bucket,
    getTranscriptPath(conversation.submissionId),
    transcript,
    "text/markdown; charset=utf-8"
  );

  // Save HTML
  const html = renderMarkdownSync(transcript);
  await writeFile(
    bucket,
    getTranscriptHtmlPath(conversation.submissionId),
    html,
    "text/html; charset=utf-8"
  );

  // Save PDF
  const { renderTranscriptPdf } = await import("./pdf-renderer");
  const pdfBuffer = await renderTranscriptPdf(conversation);
  const pdfPath = PrivatePaths.submissionOutput(conversation.submissionId, "transcript.pdf");
  await writeBuffer(bucket, pdfPath, pdfBuffer, "application/pdf");
}

// ============================================================================
// Core Chat Functions
// ============================================================================

/**
 * Start a new interview conversation.
 */
export async function startConversation(
  sessionId: string,
  conversationId: string
): Promise<InterviewConversation> {
  // Create submission record
  const { id: submissionId } = await createSubmission({
    tool: "interview",
    sessionId,
    inputs: {
      conversationId,
      startedAt: new Date().toISOString(),
    },
  });

  // Create conversation state
  const conversation: InterviewConversation = {
    conversationId,
    submissionId,
    sessionId,
    messages: [],
    citations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to GCS
  await saveConversation(conversation);

  return conversation;
}

/**
 * Get or create a conversation.
 */
export async function getOrCreateConversation(
  sessionId: string,
  conversationId: string,
  submissionId?: string
): Promise<InterviewConversation> {
  // If we have a submissionId, try to load existing conversation
  if (submissionId) {
    const existing = await loadConversation(submissionId);
    if (existing && existing.conversationId === conversationId) {
      return existing;
    }
  }

  // Create new conversation
  return startConversation(sessionId, conversationId);
}

/**
 * Process a user message and generate a response.
 * This is the main entry point for the interview chat.
 */
export async function processMessage(
  conversation: InterviewConversation,
  userMessage: string
): Promise<ChatResponse | ChatErrorResponse> {
  // Validate message length
  if (userMessage.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`,
      code: "MESSAGE_TOO_LONG",
    };
  }

  if (userMessage.trim().length === 0) {
    return {
      success: false,
      error: "Message cannot be empty.",
      code: "EMPTY_MESSAGE",
    };
  }

  // Check conversation turn limit
  const turnCount = Math.ceil(conversation.messages.length / 2);
  if (turnCount >= MAX_CONVERSATION_TURNS) {
    return {
      success: false,
      error: `Maximum conversation length (${MAX_CONVERSATION_TURNS} turns) reached. Please start a new conversation.`,
      code: "MAX_TURNS_REACHED",
    };
  }

  // Check guardrails
  const guardrailResult = checkGuardrails(userMessage);
  
  if (!guardrailResult.passed) {
    // Check for persistent off-topic behavior
    const userMessages = conversation.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content);
    
    if (isPersistentlyOffTopic([...userMessages, userMessage])) {
      const redirectResponse = generatePersistentOffTopicResponse();
      
      // Add the message and redirect response to conversation
      const userMsg: ChatMessage = {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: redirectResponse,
        timestamp: new Date().toISOString(),
      };

      conversation.messages.push(userMsg, assistantMsg);
      conversation.updatedAt = new Date().toISOString();
      await saveConversation(conversation);

      return {
        success: true,
        conversationId: conversation.conversationId,
        submissionId: conversation.submissionId,
        message: assistantMsg,
        turnCount: Math.ceil(conversation.messages.length / 2),
        isComplete: false,
        downloadReady: true,
      };
    }

    // Return single redirect
    if (guardrailResult.redirectResponse) {
      const userMsg: ChatMessage = {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: guardrailResult.redirectResponse,
        timestamp: new Date().toISOString(),
      };

      conversation.messages.push(userMsg, assistantMsg);
      conversation.updatedAt = new Date().toISOString();
      await saveConversation(conversation);

      return {
        success: true,
        conversationId: conversation.conversationId,
        submissionId: conversation.submissionId,
        message: assistantMsg,
        turnCount: Math.ceil(conversation.messages.length / 2),
        isComplete: false,
        downloadReady: true,
      };
    }
  }

  // Load resume context
  let resumeContext: ResumeContextResult;
  try {
    resumeContext = await getResumeContext({ format: "detailed", includeChunkIds: false });
  } catch (error) {
    console.error("Failed to load resume context:", error);
    return {
      success: false,
      error: "Unable to load interview context. Please try again later.",
      code: "CONTEXT_LOAD_FAILED",
    };
  }

  // Check if we have any resume context
  if (resumeContext.chunkCount === 0) {
    // In E2E test mode, generate a mock response instead of failing
    if (isE2ETestMode()) {
      console.log("[E2E] No resume chunks available, using mock response");
      const mockContent = generateE2EMockResponse(userMessage);
      
      const userMsg: ChatMessage = {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: mockContent,
        timestamp: new Date().toISOString(),
      };

      conversation.messages.push(userMsg, assistantMsg);
      conversation.updatedAt = new Date().toISOString();
      await saveConversation(conversation);
      await saveTranscript(conversation);

      // Update submission with latest state
      await updateSubmission(conversation.submissionId, {
        extracted: {
          messageCount: conversation.messages.length,
          turnCount: Math.ceil(conversation.messages.length / 2),
          e2eMode: true,
        },
        outputs: {
          transcriptPath: getTranscriptPath(conversation.submissionId),
          lastMessageAt: assistantMsg.timestamp,
        },
        citations: [],
      });

      return {
        success: true,
        conversationId: conversation.conversationId,
        submissionId: conversation.submissionId,
        message: assistantMsg,
        turnCount: Math.ceil(conversation.messages.length / 2),
        isComplete: false,
        downloadReady: true,
      };
    }

    return {
      success: false,
      error: "No resume data available. Please contact the administrator.",
      code: "NO_RESUME_DATA",
      contactEmail: CONTACT_EMAIL,
    };
  }

  // Build system prompt
  const systemPrompt = buildInterviewSystemPrompt(resumeContext.contextString);

  // Build conversation history for LLM
  const history = conversation.messages.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    text: m.content,
  }));

  // Generate response
  let assistantContent: string;
  try {
    const result = await generateContentWithHistory(history, userMessage, {
      systemInstruction: systemPrompt,
      temperature: INTERVIEW_TEMPERATURE,
      maxOutputTokens: INTERVIEW_MAX_TOKENS,
    });
    assistantContent = stripChunkReferences(result.text);
  } catch (error) {
    if (error instanceof ContentBlockedError) {
      assistantContent = `I apologize, but I'm unable to respond to that question. Let me help you with information about ${INTERVIEW_SUBJECT_NAME}'s professional background instead. What would you like to know about my work experience, skills, or projects?`;
    } else if (error instanceof GenerationError) {
      console.error("Generation error:", error);
      return {
        success: false,
        error: "Failed to generate response. Please try again.",
        code: "GENERATION_FAILED",
      };
    } else {
      throw error;
    }
  }

  // Update citations
  const newCitations = generateCitationsFromChunks(resumeContext.usedChunks);
  const citationIds = new Set(conversation.citations.map((c) => c.chunkId));
  for (const citation of newCitations) {
    if (!citationIds.has(citation.chunkId)) {
      conversation.citations.push(citation);
      citationIds.add(citation.chunkId);
    }
  }

  // Add messages to conversation
  const userMsg: ChatMessage = {
    role: "user",
    content: userMessage,
    timestamp: new Date().toISOString(),
  };

  const assistantMsg: ChatMessage = {
    role: "assistant",
    content: assistantContent,
    timestamp: new Date().toISOString(),
  };

  conversation.messages.push(userMsg, assistantMsg);
  conversation.updatedAt = new Date().toISOString();

  // Save conversation and transcript
  await saveConversation(conversation);
  await saveTranscript(conversation);

  // Update submission with latest state
  await updateSubmission(conversation.submissionId, {
    extracted: {
      messageCount: conversation.messages.length,
      turnCount: Math.ceil(conversation.messages.length / 2),
    },
    outputs: {
      transcriptPath: getTranscriptPath(conversation.submissionId),
      lastMessageAt: assistantMsg.timestamp,
    },
    citations: conversation.citations,
  });

  return {
    success: true,
    conversationId: conversation.conversationId,
    submissionId: conversation.submissionId,
    message: assistantMsg,
    turnCount: Math.ceil(conversation.messages.length / 2),
    isComplete: false,
    downloadReady: true,
  };
}

/**
 * End a conversation and finalize the submission.
 */
export async function endConversation(
  conversation: InterviewConversation
): Promise<void> {
  // Save final transcript
  await saveTranscript(conversation);

  // Mark submission as complete
  await completeSubmission(conversation.submissionId, {
    outputs: {
      transcriptPath: getTranscriptPath(conversation.submissionId),
      messageCount: conversation.messages.length,
      endedAt: new Date().toISOString(),
    },
    citations: conversation.citations,
  });
}

/**
 * Get conversation by submission ID.
 */
export async function getConversationBySubmissionId(
  submissionId: string
): Promise<InterviewConversation | null> {
  // Verify submission exists and is for interview tool
  const submission = await getSubmission(submissionId);
  if (!submission || submission.tool !== "interview") {
    return null;
  }

  return loadConversation(submissionId);
}

// Re-export constants for convenience
export { INTERVIEW_SUBJECT_NAME, CONTACT_EMAIL } from "./interview-guardrails";
