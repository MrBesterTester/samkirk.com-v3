import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================================
// Mocks - must be defined before imports
// ============================================================================

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock vertex-ai
vi.mock("./vertex-ai", () => ({
  generateContentWithHistory: vi.fn(),
  GenerationError: class GenerationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "GenerationError";
    }
  },
  ContentBlockedError: class ContentBlockedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ContentBlockedError";
    }
  },
}));

// Mock resume-context
vi.mock("./resume-context", () => ({
  getResumeContext: vi.fn(),
  generateCitationsFromChunks: vi.fn(),
}));

// Mock submission
vi.mock("./submission", () => ({
  createSubmission: vi.fn(),
  updateSubmission: vi.fn(),
  completeSubmission: vi.fn(),
  getSubmission: vi.fn(),
}));

// Mock storage
vi.mock("./storage", () => ({
  getPrivateBucket: vi.fn(() => ({})),
  PrivatePaths: {
    submissionOutput: (id: string, filename: string) =>
      `submissions/${id}/output/${filename}`,
  },
  writeFile: vi.fn(),
  readFile: vi.fn(),
  fileExists: vi.fn(),
}));

// Mock markdown-renderer
vi.mock("./markdown-renderer", () => ({
  renderMarkdownToHtml: vi.fn((md: string) => `<html>${md}</html>`),
  renderMarkdownSync: vi.fn((md: string) => `<html>${md}</html>`),
}));

// Import after mocks
import {
  buildInterviewSystemPrompt,
  generateTranscript,
  processMessage,
  getOrCreateConversation,
  stripChunkReferences,
  MAX_CONVERSATION_TURNS,
  MAX_MESSAGE_LENGTH,
  INTERVIEW_SUBJECT_NAME,
  InterviewChatError,
  type InterviewConversation,
  type ChatMessage,
  type ChatResponse,
} from "./interview-chat";
import { generateContentWithHistory, ContentBlockedError } from "./vertex-ai";
import { getResumeContext, generateCitationsFromChunks } from "./resume-context";
import { createSubmission, updateSubmission } from "./submission";
import { writeFile, readFile, fileExists } from "./storage";
import { CONTACT_EMAIL } from "./interview-guardrails";

// ============================================================================
// Test Fixtures
// ============================================================================

const mockConversation: InterviewConversation = {
  conversationId: "test-conv-123",
  submissionId: "test-sub-456",
  sessionId: "test-session-789",
  messages: [],
  citations: [],
  createdAt: "2026-02-03T10:00:00.000Z",
  updatedAt: "2026-02-03T10:00:00.000Z",
};

const mockResumeContext = {
  contextString: "[CHUNK 1: Work Experience]\nContent here...",
  usedChunks: [
    {
      chunkId: "chunk_1",
      title: "Work Experience",
      sourceRef: "h2:Experience",
      content: "10+ years experience...",
    },
  ],
  characterCount: 100,
  chunkCount: 1,
};

const mockCitations = [
  {
    chunkId: "chunk_1",
    title: "Work Experience",
    sourceRef: "h2:Experience",
  },
];

// ============================================================================
// Constants Tests
// ============================================================================

describe("Constants", () => {
  it("has correct MAX_CONVERSATION_TURNS", () => {
    expect(MAX_CONVERSATION_TURNS).toBe(20);
  });

  it("has correct MAX_MESSAGE_LENGTH", () => {
    expect(MAX_MESSAGE_LENGTH).toBe(2000);
  });

  it("exports INTERVIEW_SUBJECT_NAME", () => {
    expect(INTERVIEW_SUBJECT_NAME).toBe("Sam Kirk");
  });
});

// ============================================================================
// stripChunkReferences Tests
// ============================================================================

describe("stripChunkReferences", () => {
  it("strips a single chunk reference", () => {
    const input = "I have experience in React (chunk_42)";
    expect(stripChunkReferences(input)).toBe("I have experience in React");
  });

  it("strips multiple chunk references in parentheses", () => {
    const input = "I worked on several projects (chunk_42, chunk_14, chunk_5)";
    expect(stripChunkReferences(input)).toBe("I worked on several projects");
  });

  it("strips two chunk references", () => {
    const input = "Built scalable systems (chunk_abc, chunk_def)";
    expect(stripChunkReferences(input)).toBe("Built scalable systems");
  });

  it("strips chunk references from multiple locations in text", () => {
    const input =
      "I have React skills (chunk_1) and Node.js experience (chunk_2, chunk_3).";
    expect(stripChunkReferences(input)).toBe(
      "I have React skills and Node.js experience."
    );
  });

  it("returns text unchanged when no chunk references present", () => {
    const input = "I have 10 years of experience in software engineering.";
    expect(stripChunkReferences(input)).toBe(input);
  });

  it("handles chunk IDs with mixed alphanumeric characters", () => {
    const input = "Led team of 5 engineers (chunk_abc123def)";
    expect(stripChunkReferences(input)).toBe("Led team of 5 engineers");
  });

  it("handles empty string", () => {
    expect(stripChunkReferences("")).toBe("");
  });

  it("handles text that is only a chunk reference", () => {
    expect(stripChunkReferences("(chunk_42)")).toBe("");
  });

  it("does not strip non-chunk parenthetical content", () => {
    const input = "I worked at Google (2019-2022) on cloud infrastructure.";
    expect(stripChunkReferences(input)).toBe(input);
  });

  it("preserves leading whitespace but trims trailing", () => {
    const input = "Experience in ML (chunk_99) ";
    expect(stripChunkReferences(input)).toBe("Experience in ML");
  });

  it("handles chunk reference with underscore in ID", () => {
    const input = "Deployed to production (chunk_my_project_1)";
    expect(stripChunkReferences(input)).toBe("Deployed to production");
  });

  // --- New patterns: plural "chunks" with bare numbers ---

  it("strips plural chunks with bare numbers", () => {
    const input =
      "I have extensive experience in React (chunks 1, 8, 12, 23, 33)";
    expect(stripChunkReferences(input)).toBe(
      "I have extensive experience in React"
    );
  });

  it("strips single bare number after chunks", () => {
    const input = "Led a team of engineers (chunks 5)";
    expect(stripChunkReferences(input)).toBe("Led a team of engineers");
  });

  // --- New patterns: singular "chunk" with bare numbers (no underscore) ---

  it("strips singular chunk with bare number", () => {
    const input = "Built scalable APIs (chunk 1)";
    expect(stripChunkReferences(input)).toBe("Built scalable APIs");
  });

  it("strips multiple singular chunk bare-number refs", () => {
    const input = "Worked on cloud infra (chunk 1, chunk 2, chunk 3)";
    expect(stripChunkReferences(input)).toBe("Worked on cloud infra");
  });

  // --- Capitalised variants ---

  it("strips capitalised Chunk with bare number", () => {
    const input = "Managed deployments (Chunk 5)";
    expect(stripChunkReferences(input)).toBe("Managed deployments");
  });

  it("strips capitalised Chunks with bare numbers", () => {
    const input = "Designed systems (Chunks 1, 2, 3)";
    expect(stripChunkReferences(input)).toBe("Designed systems");
  });

  // --- Mixed formats in one string ---

  it("strips mixed underscore and bare-number formats in same text", () => {
    const input =
      "React skills (chunk_42) and Node.js experience (chunks 1, 8, 12).";
    expect(stripChunkReferences(input)).toBe(
      "React skills and Node.js experience."
    );
  });

  // --- Ensure legitimate parentheticals are NOT stripped ---

  it("does not strip parenthetical tech stacks", () => {
    const input =
      "I worked with modern technologies (React, Node.js, PostgreSQL).";
    expect(stripChunkReferences(input)).toBe(input);
  });

  it("does not strip parenthetical date ranges", () => {
    const input = "At Google (2019-2022) I led the platform team.";
    expect(stripChunkReferences(input)).toBe(input);
  });

  it("does not strip parenthetical team sizes", () => {
    const input = "Managed a growing team (5 to 12 engineers).";
    expect(stripChunkReferences(input)).toBe(input);
  });
});

// ============================================================================
// buildInterviewSystemPrompt Tests
// ============================================================================

describe("buildInterviewSystemPrompt", () => {
  it("includes subject name in prompt", () => {
    const prompt = buildInterviewSystemPrompt("Resume content here");
    expect(prompt).toContain(INTERVIEW_SUBJECT_NAME);
  });

  it("includes resume context", () => {
    const resumeContext = "This is the resume context";
    const prompt = buildInterviewSystemPrompt(resumeContext);
    expect(prompt).toContain(resumeContext);
  });

  it("includes resume context tags", () => {
    const prompt = buildInterviewSystemPrompt("content");
    expect(prompt).toContain("<resume_context>");
    expect(prompt).toContain("</resume_context>");
  });

  it("includes behavioral guidelines", () => {
    const prompt = buildInterviewSystemPrompt("content");
    expect(prompt).toContain("BEHAVIORAL GUIDELINES");
  });

  it("includes career-only focus instruction", () => {
    const prompt = buildInterviewSystemPrompt("content");
    expect(prompt).toContain("Career Focus Only");
  });

  it("includes redirect instruction for off-topic questions", () => {
    const prompt = buildInterviewSystemPrompt("content");
    expect(prompt).toContain("Redirect Off-Topic Questions");
  });

  it("includes contact email", () => {
    const prompt = buildInterviewSystemPrompt("content");
    expect(prompt).toContain(CONTACT_EMAIL);
  });

  it("includes first-person perspective instruction", () => {
    const prompt = buildInterviewSystemPrompt("content");
    expect(prompt).toContain("First-Person Perspective");
  });

  it("includes instruction to exclude internal chunk identifiers", () => {
    const prompt = buildInterviewSystemPrompt("content");
    expect(prompt).toContain("No Internal Identifiers");
    expect(prompt).toContain("chunk");
  });
});

// ============================================================================
// generateTranscript Tests
// ============================================================================

describe("generateTranscript", () => {
  it("generates empty transcript for no messages", () => {
    const conversation: InterviewConversation = {
      ...mockConversation,
      messages: [],
    };

    const transcript = generateTranscript(conversation);

    expect(transcript).toContain("# Interview Transcript");
    expect(transcript).toContain("**Total Messages:** 0");
  });

  it("includes candidate name", () => {
    const transcript = generateTranscript(mockConversation);
    expect(transcript).toContain(`**Candidate:** ${INTERVIEW_SUBJECT_NAME}`);
  });

  it("formats user messages correctly", () => {
    const conversation: InterviewConversation = {
      ...mockConversation,
      messages: [
        {
          role: "user",
          content: "What is your experience?",
          timestamp: "2026-02-03T10:01:00.000Z",
        },
      ],
    };

    const transcript = generateTranscript(conversation);
    expect(transcript).toContain("**Interviewer:**");
    expect(transcript).toContain("What is your experience?");
  });

  it("formats assistant messages with subject name", () => {
    const conversation: InterviewConversation = {
      ...mockConversation,
      messages: [
        {
          role: "assistant",
          content: "I have 10+ years of experience.",
          timestamp: "2026-02-03T10:02:00.000Z",
        },
      ],
    };

    const transcript = generateTranscript(conversation);
    expect(transcript).toContain(`**${INTERVIEW_SUBJECT_NAME}:**`);
    expect(transcript).toContain("I have 10+ years of experience.");
  });

  it("does not include citations in transcript", () => {
    const conversation: InterviewConversation = {
      ...mockConversation,
      citations: [
        { chunkId: "c1", title: "Work Experience", sourceRef: "h2:Experience" },
        { chunkId: "c2", title: "Skills", sourceRef: "h2:Skills" },
      ],
    };

    const transcript = generateTranscript(conversation);
    expect(transcript).not.toContain("Sources Referenced");
    expect(transcript).not.toContain("Work Experience");
    expect(transcript).not.toContain("h2:Experience");
  });

  it("includes footer with contact email", () => {
    const transcript = generateTranscript(mockConversation);
    expect(transcript).toContain(`*Contact: ${CONTACT_EMAIL}*`);
  });

  it("separates messages with dividers", () => {
    const conversation: InterviewConversation = {
      ...mockConversation,
      messages: [
        { role: "user", content: "Q1", timestamp: "2026-02-03T10:01:00.000Z" },
        { role: "assistant", content: "A1", timestamp: "2026-02-03T10:02:00.000Z" },
      ],
    };

    const transcript = generateTranscript(conversation);
    const dividerCount = (transcript.match(/---/g) || []).length;
    expect(dividerCount).toBeGreaterThanOrEqual(3); // Header + after each message
  });
});

// ============================================================================
// processMessage Tests
// ============================================================================

describe("processMessage", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Setup default mocks
    vi.mocked(getResumeContext).mockResolvedValue(mockResumeContext);
    vi.mocked(generateCitationsFromChunks).mockReturnValue(mockCitations);
    vi.mocked(generateContentWithHistory).mockResolvedValue({
      text: "I have extensive experience in software engineering.",
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      estimatedCostUsd: 0.001,
    });
    vi.mocked(updateSubmission).mockResolvedValue();
    vi.mocked(writeFile).mockResolvedValue();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("validation", () => {
    it("rejects empty messages", async () => {
      const result = await processMessage(mockConversation, "");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("EMPTY_MESSAGE");
      }
    });

    it("rejects whitespace-only messages", async () => {
      const result = await processMessage(mockConversation, "   \n\t  ");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("EMPTY_MESSAGE");
      }
    });

    it("rejects messages exceeding max length", async () => {
      const longMessage = "a".repeat(MAX_MESSAGE_LENGTH + 1);
      const result = await processMessage(mockConversation, longMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("MESSAGE_TOO_LONG");
        expect(result.error).toContain(String(MAX_MESSAGE_LENGTH));
      }
    });

    it("accepts messages at max length", async () => {
      const maxLengthMessage = "a".repeat(MAX_MESSAGE_LENGTH);
      const result = await processMessage(mockConversation, maxLengthMessage);

      // Should proceed past validation (may fail later for other reasons)
      expect(result.success).toBe(true);
    });
  });

  describe("turn limit", () => {
    it("rejects when max turns reached", async () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < MAX_CONVERSATION_TURNS * 2; i++) {
        messages.push({
          role: i % 2 === 0 ? "user" : "assistant",
          content: `Message ${i}`,
          timestamp: new Date().toISOString(),
        });
      }

      const conversationAtLimit: InterviewConversation = {
        ...mockConversation,
        messages,
      };

      const result = await processMessage(conversationAtLimit, "Another message");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("MAX_TURNS_REACHED");
        expect(result.error).toContain(String(MAX_CONVERSATION_TURNS));
      }
    });

    it("allows messages before max turns", async () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < (MAX_CONVERSATION_TURNS - 1) * 2; i++) {
        messages.push({
          role: i % 2 === 0 ? "user" : "assistant",
          content: `Message ${i}`,
          timestamp: new Date().toISOString(),
        });
      }

      const conversationNearLimit: InterviewConversation = {
        ...mockConversation,
        messages,
      };

      const result = await processMessage(conversationNearLimit, "One more question");

      expect(result.success).toBe(true);
    });
  });

  describe("guardrails", () => {
    it("redirects off-topic political questions", async () => {
      const result = await processMessage(
        { ...mockConversation, messages: [] },
        "What are your political views?"
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const chatResult = result as ChatResponse;
        expect(chatResult.message.content).toContain("career-related topics");
      }
    });

    it("redirects personal life questions", async () => {
      const result = await processMessage(
        { ...mockConversation, messages: [] },
        "Are you married?"
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const chatResult = result as ChatResponse;
        expect(chatResult.message.content).toContain("professional");
      }
    });

    it("redirects general assistant requests", async () => {
      const result = await processMessage(
        { ...mockConversation, messages: [] },
        "Write me a Python function to sort an array"
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const chatResult = result as ChatResponse;
        // The redirect response should mention it's not a general assistant
        expect(chatResult.message.content.toLowerCase()).toMatch(
          /general.purpose|not.+assistant|specifically designed|career|professional/
        );
      }
    });
  });

  describe("successful message processing", () => {
    it("processes valid career question", async () => {
      const result = await processMessage(
        mockConversation,
        "Tell me about your work experience"
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const chatResult = result as ChatResponse;
        expect(chatResult.conversationId).toBe(mockConversation.conversationId);
        expect(chatResult.submissionId).toBe(mockConversation.submissionId);
        expect(chatResult.message.role).toBe("assistant");
        expect(chatResult.message.content).toBeTruthy();
      }
    });

    it("increments turn count", async () => {
      // Use a fresh conversation with no messages
      const freshConversation: InterviewConversation = {
        ...mockConversation,
        messages: [],
        citations: [],
      };

      const result = await processMessage(
        freshConversation,
        "What are your skills?"
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const chatResult = result as ChatResponse;
        expect(chatResult.turnCount).toBe(1);
      }
    });

    it("calls generateContentWithHistory with history", async () => {
      const conversationWithHistory: InterviewConversation = {
        ...mockConversation,
        messages: [
          { role: "user", content: "Hello", timestamp: "2026-02-03T10:00:00Z" },
          { role: "assistant", content: "Hi!", timestamp: "2026-02-03T10:00:01Z" },
        ],
      };

      await processMessage(conversationWithHistory, "What are your skills?");

      expect(generateContentWithHistory).toHaveBeenCalledWith(
        expect.arrayContaining([
          { role: "user", text: "Hello" },
          { role: "model", text: "Hi!" },
        ]),
        "What are your skills?",
        expect.objectContaining({
          systemInstruction: expect.any(String),
        })
      );
    });

    it("saves transcript after successful message", async () => {
      await processMessage(mockConversation, "Tell me about your experience");

      expect(writeFile).toHaveBeenCalledTimes(3); // conversation.json, transcript.md, transcript.html
    });

    it("updates submission with message data", async () => {
      await processMessage(mockConversation, "What is your background?");

      expect(updateSubmission).toHaveBeenCalledWith(
        mockConversation.submissionId,
        expect.objectContaining({
          extracted: expect.objectContaining({
            messageCount: expect.any(Number),
            turnCount: expect.any(Number),
          }),
        })
      );
    });

    it("strips chunk references from LLM response", async () => {
      vi.mocked(generateContentWithHistory).mockResolvedValue({
        text: "I have experience in React (chunk_42) and Node.js (chunk_14, chunk_5).",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        estimatedCostUsd: 0.001,
      });

      const result = await processMessage(
        mockConversation,
        "What are your skills?"
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const chatResult = result as ChatResponse;
        expect(chatResult.message.content).not.toContain("chunk_");
        expect(chatResult.message.content).toBe(
          "I have experience in React and Node.js."
        );
      }
    });

    it("returns downloadReady as true", async () => {
      const result = await processMessage(
        mockConversation,
        "Describe a challenging project"
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const chatResult = result as ChatResponse;
        expect(chatResult.downloadReady).toBe(true);
      }
    });
  });

  describe("error handling", () => {
    it("handles missing resume context gracefully", async () => {
      vi.mocked(getResumeContext).mockResolvedValue({
        contextString: "",
        usedChunks: [],
        characterCount: 0,
        chunkCount: 0,
      });

      const result = await processMessage(
        mockConversation,
        "Tell me about yourself"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("NO_RESUME_DATA");
        expect(result.contactEmail).toBe(CONTACT_EMAIL);
      }
    });

    it("handles content blocked by safety filters", async () => {
      vi.mocked(generateContentWithHistory).mockRejectedValue(
        new ContentBlockedError("Content blocked")
      );

      const result = await processMessage(
        mockConversation,
        "What is your experience?"
      );

      // Should return a redirect response instead of error
      expect(result.success).toBe(true);
      if (result.success) {
        const chatResult = result as ChatResponse;
        expect(chatResult.message.content).toContain("unable to respond");
      }
    });

    it("handles resume context loading failure", async () => {
      vi.mocked(getResumeContext).mockRejectedValue(new Error("Network error"));

      const result = await processMessage(
        mockConversation,
        "What are your skills?"
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe("CONTEXT_LOAD_FAILED");
      }
    });
  });

  describe("citations handling", () => {
    it("accumulates unique citations across messages", async () => {
      const conversationWithCitations: InterviewConversation = {
        ...mockConversation,
        citations: [
          { chunkId: "existing", title: "Existing", sourceRef: "ref:existing" },
        ],
      };

      vi.mocked(generateCitationsFromChunks).mockReturnValue([
        { chunkId: "new", title: "New Chunk", sourceRef: "ref:new" },
        { chunkId: "existing", title: "Existing", sourceRef: "ref:existing" }, // duplicate
      ]);

      const result = await processMessage(
        conversationWithCitations,
        "Tell me more"
      );

      expect(result.success).toBe(true);
      // Should have called updateSubmission with citations including both old and new (deduplicated)
      expect(updateSubmission).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          citations: expect.arrayContaining([
            expect.objectContaining({ chunkId: "existing" }),
            expect.objectContaining({ chunkId: "new" }),
          ]),
        })
      );
    });
  });
});

// ============================================================================
// getOrCreateConversation Tests
// ============================================================================

describe("getOrCreateConversation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(createSubmission).mockResolvedValue({
      id: "new-sub-id",
      doc: {} as never,
    });
    vi.mocked(writeFile).mockResolvedValue();
  });

  it("creates new conversation when no submissionId provided", async () => {
    const conversation = await getOrCreateConversation(
      "session-123",
      "conv-456"
    );

    expect(conversation.conversationId).toBe("conv-456");
    expect(conversation.sessionId).toBe("session-123");
    expect(conversation.messages).toEqual([]);
    expect(createSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: "interview",
        sessionId: "session-123",
      })
    );
  });

  it("loads existing conversation when submissionId matches", async () => {
    const existingConversation: InterviewConversation = {
      conversationId: "existing-conv",
      submissionId: "existing-sub",
      sessionId: "session-123",
      messages: [
        { role: "user", content: "Hello", timestamp: "2026-02-03T10:00:00Z" },
      ],
      citations: [],
      createdAt: "2026-02-03T10:00:00Z",
      updatedAt: "2026-02-03T10:00:00Z",
    };

    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(existingConversation));

    const conversation = await getOrCreateConversation(
      "session-123",
      "existing-conv",
      "existing-sub"
    );

    expect(conversation.conversationId).toBe("existing-conv");
    expect(conversation.messages.length).toBe(1);
    expect(createSubmission).not.toHaveBeenCalled();
  });

  it("creates new conversation when submissionId doesnt match conversationId", async () => {
    const existingConversation: InterviewConversation = {
      conversationId: "different-conv",
      submissionId: "existing-sub",
      sessionId: "session-123",
      messages: [],
      citations: [],
      createdAt: "2026-02-03T10:00:00Z",
      updatedAt: "2026-02-03T10:00:00Z",
    };

    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(existingConversation));

    const conversation = await getOrCreateConversation(
      "session-123",
      "new-conv",
      "existing-sub"
    );

    // Should create new since conversationId doesn't match
    expect(conversation.conversationId).toBe("new-conv");
    expect(createSubmission).toHaveBeenCalled();
  });
});

// ============================================================================
// InterviewChatError Tests
// ============================================================================

describe("InterviewChatError", () => {
  it("creates error with correct properties", () => {
    const error = new InterviewChatError(
      "Test message",
      "TEST_CODE",
      400,
      "test@example.com"
    );

    expect(error.message).toBe("Test message");
    expect(error.code).toBe("TEST_CODE");
    expect(error.statusCode).toBe(400);
    expect(error.contactEmail).toBe("test@example.com");
    expect(error.name).toBe("InterviewChatError");
  });

  it("defaults statusCode to 400", () => {
    const error = new InterviewChatError("Test", "CODE");
    expect(error.statusCode).toBe(400);
  });

  it("serializes to JSON correctly", () => {
    const error = new InterviewChatError(
      "Error message",
      "ERR_CODE",
      500,
      "contact@example.com"
    );

    const json = error.toJSON();

    expect(json).toEqual({
      error: "ERR_CODE",
      message: "Error message",
      contactEmail: "contact@example.com",
    });
  });
});
