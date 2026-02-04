import { describe, it, expect, vi } from "vitest";
import type { JobIngestionResult } from "./job-ingestion";
import type { ResumeChunk } from "./resume-chunker";

// Mock server-only before importing the module
vi.mock("server-only", () => ({}));

// Mock dependencies
vi.mock("./vertex-ai", () => ({
  generateContent: vi.fn(),
}));

vi.mock("./resume-context", () => ({
  getResumeContext: vi.fn(),
  generateCitationsFromChunks: vi.fn((chunks) =>
    chunks.map((c: ResumeChunk) => ({
      chunkId: c.chunkId,
      title: c.title,
      sourceRef: c.sourceRef,
    }))
  ),
}));

vi.mock("./markdown-renderer", () => ({
  renderMarkdown: vi.fn((md) => `<html>${md}</html>`),
  appendCitationsToMarkdown: vi.fn(
    (md, citations) =>
      citations.length > 0
        ? `${md}\n\n## Citations\n${citations.map((c: { title: string }) => c.title).join("\n")}`
        : md
  ),
}));

vi.mock("./storage", () => ({
  getPrivateBucket: vi.fn(() => ({})),
  PrivatePaths: {
    submissionOutput: (id: string, file: string) =>
      `submissions/${id}/output/${file}`,
    submissionExtracted: (id: string) => `submissions/${id}/extracted.json`,
    submissionInput: (id: string, file: string) =>
      `submissions/${id}/input/${file}`,
  },
  writeFile: vi.fn(),
}));

vi.mock("./submission", () => ({
  updateSubmission: vi.fn(),
  completeSubmission: vi.fn(),
}));

// Import after mocking
import {
  TARGET_WORD_COUNT_MIN,
  TARGET_WORD_COUNT_MAX,
  MAX_WORDS_PER_SECTION,
  MAX_BULLETS_PER_JOB,
  RESUME_GENERATION_SYSTEM_PROMPT,
  buildResumeGenerationPrompt,
  parseResumeResponse,
  generateMarkdownResume,
  countResumeWords,
  ResumeGeneratorError,
  type ResumeContent,
  type ResumeExperience,
  type ResumeEducation,
} from "./resume-generator";

// ============================================================================
// Test Fixtures
// ============================================================================

// Helper function for future tests - keeping for potential use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _createMockJobIngestion(
  overrides: Partial<JobIngestionResult> = {}
): JobIngestionResult {
  return {
    text: "Senior Software Engineer position at TechCorp. Requirements: 5+ years experience in TypeScript, React, and Node.js. Remote-friendly position.",
    source: "paste",
    sourceIdentifier: "pasted text",
    characterCount: 150,
    wordCount: 25,
    ...overrides,
  };
}

function createMockResumeChunks(): ResumeChunk[] {
  return [
    {
      chunkId: "chunk_001",
      title: "Summary",
      sourceRef: "h2:Summary",
      content:
        "Experienced software engineer with 10+ years building scalable web applications.",
    },
    {
      chunkId: "chunk_002",
      title: "Experience > TechCorp",
      sourceRef: "h2:Experience > h3:TechCorp",
      content:
        "Senior Engineer at TechCorp (2019-2024). Led development of React-based dashboard. Implemented Node.js microservices.",
    },
    {
      chunkId: "chunk_003",
      title: "Skills",
      sourceRef: "h2:Skills",
      content: "TypeScript, React, Node.js, Python, GCP, AWS, PostgreSQL",
    },
  ];
}

function createValidLLMResponse(): string {
  return JSON.stringify({
    header: {
      name: "Sam Kirk",
      title: "Senior Software Engineer",
      email: "sam@samkirk.com",
      location: "Fremont, CA",
      linkedIn: "linkedin.com/in/samkirk",
      website: "samkirk.com",
    },
    summary:
      "Experienced software engineer with 10+ years building scalable web applications. Expertise in TypeScript, React, and Node.js.",
    skills: [
      {
        category: "Programming Languages",
        items: ["TypeScript", "JavaScript", "Python"],
      },
      {
        category: "Frontend",
        items: ["React", "Next.js", "HTML/CSS"],
      },
      {
        category: "Backend",
        items: ["Node.js", "Express", "PostgreSQL"],
      },
    ],
    experience: [
      {
        title: "Senior Software Engineer",
        company: "TechCorp",
        dateRange: "2019 - 2024",
        location: "San Francisco, CA",
        bullets: [
          "Led development of React-based dashboard serving 10K+ users",
          "Implemented Node.js microservices reducing latency by 40%",
          "Mentored team of 5 junior developers",
        ],
      },
      {
        title: "Software Engineer",
        company: "StartupCo",
        dateRange: "2015 - 2019",
        bullets: [
          "Built full-stack features using TypeScript and React",
          "Designed PostgreSQL database schemas",
        ],
      },
    ],
    education: [
      {
        degree: "B.S. Computer Science",
        institution: "University of California, Berkeley",
        year: "2015",
        details: "Cum Laude",
      },
    ],
    additionalSections: [
      {
        title: "Certifications",
        content: "AWS Solutions Architect, Google Cloud Professional",
      },
    ],
  });
}

function createMockResumeContent(): ResumeContent {
  return {
    header: {
      name: "Sam Kirk",
      title: "Senior Software Engineer",
      email: "sam@samkirk.com",
      location: "Fremont, CA",
    },
    summary: "Experienced software engineer with expertise in web development.",
    skills: [
      { category: "Languages", items: ["TypeScript", "Python"] },
      { category: "Frontend", items: ["React", "Next.js"] },
    ],
    experience: [
      {
        title: "Senior Engineer",
        company: "TechCorp",
        dateRange: "2019 - 2024",
        bullets: ["Led React development", "Built microservices"],
      },
    ],
    education: [
      {
        degree: "B.S. Computer Science",
        institution: "UC Berkeley",
        year: "2015",
      },
    ],
  };
}

// ============================================================================
// Tests: Constants
// ============================================================================

describe("Constants", () => {
  it("should have appropriate word count targets", () => {
    expect(TARGET_WORD_COUNT_MIN).toBe(600);
    expect(TARGET_WORD_COUNT_MAX).toBe(900);
    expect(TARGET_WORD_COUNT_MIN).toBeLessThan(TARGET_WORD_COUNT_MAX);
  });

  it("should have section limits", () => {
    expect(MAX_WORDS_PER_SECTION).toBe(250);
    expect(MAX_BULLETS_PER_JOB).toBe(5);
  });

  it("should have reasonable 2-page targets", () => {
    // 400-500 words per page is typical for resumes
    expect(TARGET_WORD_COUNT_MAX).toBeLessThanOrEqual(1000);
    expect(TARGET_WORD_COUNT_MIN).toBeGreaterThanOrEqual(500);
  });
});

// ============================================================================
// Tests: System Prompt
// ============================================================================

describe("RESUME_GENERATION_SYSTEM_PROMPT", () => {
  it("should emphasize not inventing information", () => {
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("NEVER INVENT");
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("ONLY use information");
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("DO NOT include it");
  });

  it("should specify word count constraints", () => {
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain(
      String(TARGET_WORD_COUNT_MIN)
    );
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain(
      String(TARGET_WORD_COUNT_MAX)
    );
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("2 PAGES MAXIMUM");
  });

  it("should specify bullet point limit", () => {
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain(
      String(MAX_BULLETS_PER_JOB)
    );
  });

  it("should specify JSON output format", () => {
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("JSON");
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("header");
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("summary");
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("experience");
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("education");
  });

  it("should include tailoring guidance", () => {
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("Prioritize");
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("keywords");
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("relevant");
  });

  it("should include ATS optimization guidance", () => {
    expect(RESUME_GENERATION_SYSTEM_PROMPT).toContain("ATS");
  });
});

// ============================================================================
// Tests: buildResumeGenerationPrompt
// ============================================================================

describe("buildResumeGenerationPrompt", () => {
  it("should include job posting section", () => {
    const chunks = createMockResumeChunks();
    const prompt = buildResumeGenerationPrompt(
      "Senior Engineer at TechCorp...",
      chunks
    );

    expect(prompt).toContain("## Job Posting");
    expect(prompt).toContain("Senior Engineer at TechCorp");
  });

  it("should include target position when provided", () => {
    const chunks = createMockResumeChunks();
    const prompt = buildResumeGenerationPrompt(
      "Job description here...",
      chunks,
      "Staff Engineer",
      "BigCorp"
    );

    expect(prompt).toContain("Target Position: Staff Engineer at BigCorp");
  });

  it("should handle only title provided", () => {
    const chunks = createMockResumeChunks();
    const prompt = buildResumeGenerationPrompt(
      "Job description...",
      chunks,
      "Senior Developer"
    );

    expect(prompt).toContain("Target Position: Senior Developer");
    // Should not have " at CompanyName" in the target position line
    expect(prompt).not.toMatch(/Target Position: Senior Developer at /);
  });

  it("should handle only company provided", () => {
    const chunks = createMockResumeChunks();
    const prompt = buildResumeGenerationPrompt(
      "Job description...",
      chunks,
      undefined,
      "MegaCorp"
    );

    expect(prompt).toContain("Target Position: ");
    expect(prompt).toContain("MegaCorp");
  });

  it("should include resume context with chunk labels", () => {
    const chunks = createMockResumeChunks();
    const prompt = buildResumeGenerationPrompt("Job...", chunks);

    expect(prompt).toContain("## Sam's Resume Context");
    expect(prompt).toContain("SOURCE OF TRUTH");
    expect(prompt).toContain("[CHUNK 1: Summary]");
    expect(prompt).toContain("[CHUNK 2: Experience > TechCorp]");
    expect(prompt).toContain("[CHUNK 3: Skills]");
  });

  it("should include instructions", () => {
    const chunks = createMockResumeChunks();
    const prompt = buildResumeGenerationPrompt("Job...", chunks);

    expect(prompt).toContain("## Instructions");
    expect(prompt).toContain("ONLY use facts");
    expect(prompt).toContain(String(TARGET_WORD_COUNT_MIN));
    expect(prompt).toContain(String(TARGET_WORD_COUNT_MAX));
  });

  it("should handle empty chunks array", () => {
    const prompt = buildResumeGenerationPrompt("Job description", []);

    expect(prompt).toContain("## Sam's Resume Context");
    expect(prompt).not.toContain("[CHUNK");
  });
});

// ============================================================================
// Tests: parseResumeResponse
// ============================================================================

describe("parseResumeResponse", () => {
  it("should parse valid JSON response", () => {
    const response = createValidLLMResponse();
    const result = parseResumeResponse(response);

    expect(result.header.name).toBe("Sam Kirk");
    expect(result.header.title).toBe("Senior Software Engineer");
    expect(result.summary).toContain("10+ years");
    expect(result.skills).toHaveLength(3);
    expect(result.experience).toHaveLength(2);
    expect(result.education).toHaveLength(1);
    expect(result.additionalSections).toHaveLength(1);
  });

  it("should handle JSON wrapped in markdown code fences", () => {
    const response = "```json\n" + createValidLLMResponse() + "\n```";
    const result = parseResumeResponse(response);

    expect(result.header.name).toBe("Sam Kirk");
  });

  it("should handle plain code fences", () => {
    const response = "```\n" + createValidLLMResponse() + "\n```";
    const result = parseResumeResponse(response);

    expect(result.header.name).toBe("Sam Kirk");
  });

  it("should throw on invalid JSON", () => {
    expect(() => parseResumeResponse("not json")).toThrow(ResumeGeneratorError);
  });

  it("should throw if response is not an object", () => {
    expect(() => parseResumeResponse('"just a string"')).toThrow(
      ResumeGeneratorError
    );
  });

  it("should throw if header is missing", () => {
    const response = JSON.stringify({
      summary: "test",
      skills: [],
      experience: [],
      education: [],
    });
    expect(() => parseResumeResponse(response)).toThrow(ResumeGeneratorError);
  });

  it("should throw if header.name is missing", () => {
    const response = JSON.stringify({
      header: { title: "Engineer" },
      summary: "test",
      skills: [],
      experience: [],
      education: [],
    });
    expect(() => parseResumeResponse(response)).toThrow(ResumeGeneratorError);
  });

  it("should throw if summary is missing", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      skills: [],
      experience: [],
      education: [],
    });
    expect(() => parseResumeResponse(response)).toThrow(ResumeGeneratorError);
  });

  it("should throw if skills is not an array", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: "not array",
      experience: [],
      education: [],
    });
    expect(() => parseResumeResponse(response)).toThrow(ResumeGeneratorError);
  });

  it("should throw if experience is not an array", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: [],
      experience: "not array",
      education: [],
    });
    expect(() => parseResumeResponse(response)).toThrow(ResumeGeneratorError);
  });

  it("should throw if education is not an array", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: [],
      experience: [],
      education: "not array",
    });
    expect(() => parseResumeResponse(response)).toThrow(ResumeGeneratorError);
  });

  it("should handle missing optional header fields", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: [],
      experience: [],
      education: [],
    });
    const result = parseResumeResponse(response);

    expect(result.header.email).toBeUndefined();
    expect(result.header.phone).toBeUndefined();
    expect(result.header.location).toBeUndefined();
    expect(result.header.linkedIn).toBeUndefined();
    expect(result.header.website).toBeUndefined();
  });

  it("should handle missing additionalSections", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: [],
      experience: [],
      education: [],
    });
    const result = parseResumeResponse(response);

    expect(result.additionalSections).toBeUndefined();
  });

  it("should limit bullets per job to MAX_BULLETS_PER_JOB", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: [],
      experience: [
        {
          title: "Engineer",
          company: "Corp",
          dateRange: "2020-2024",
          bullets: [
            "Bullet 1",
            "Bullet 2",
            "Bullet 3",
            "Bullet 4",
            "Bullet 5",
            "Bullet 6",
            "Bullet 7",
          ],
        },
      ],
      education: [],
    });
    const result = parseResumeResponse(response);

    expect(result.experience[0].bullets).toHaveLength(MAX_BULLETS_PER_JOB);
  });

  it("should filter non-string items from skill arrays", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: [
        { category: "Languages", items: ["TypeScript", 123, null, "Python"] },
      ],
      experience: [],
      education: [],
    });
    const result = parseResumeResponse(response);

    expect(result.skills[0].items).toEqual(["TypeScript", "Python"]);
  });

  it("should filter non-string bullets from experience", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: [],
      experience: [
        {
          title: "Engineer",
          company: "Corp",
          dateRange: "2020-2024",
          bullets: ["Valid bullet", 123, null, "Another valid"],
        },
      ],
      education: [],
    });
    const result = parseResumeResponse(response);

    expect(result.experience[0].bullets).toEqual([
      "Valid bullet",
      "Another valid",
    ]);
  });

  it("should validate skill object structure", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: [{ category: "Languages" }], // missing items
      experience: [],
      education: [],
    });
    expect(() => parseResumeResponse(response)).toThrow(ResumeGeneratorError);
  });

  it("should validate experience object structure", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: [],
      experience: [{ title: "Engineer" }], // missing required fields
      education: [],
    });
    expect(() => parseResumeResponse(response)).toThrow(ResumeGeneratorError);
  });

  it("should validate education object structure", () => {
    const response = JSON.stringify({
      header: { name: "Sam", title: "Engineer" },
      summary: "test",
      skills: [],
      experience: [],
      education: [{ degree: "BS" }], // missing required fields
    });
    expect(() => parseResumeResponse(response)).toThrow(ResumeGeneratorError);
  });
});

// ============================================================================
// Tests: generateMarkdownResume
// ============================================================================

describe("generateMarkdownResume", () => {
  it("should generate header section", () => {
    const content = createMockResumeContent();
    const md = generateMarkdownResume(content);

    expect(md).toContain("# Sam Kirk");
    expect(md).toContain("**Senior Software Engineer**");
  });

  it("should include contact info line", () => {
    const content = createMockResumeContent();
    const md = generateMarkdownResume(content);

    expect(md).toContain("sam@samkirk.com");
    expect(md).toContain("Fremont, CA");
  });

  it("should format LinkedIn as a link", () => {
    const content: ResumeContent = {
      ...createMockResumeContent(),
      header: {
        ...createMockResumeContent().header,
        linkedIn: "linkedin.com/in/samkirk",
      },
    };
    const md = generateMarkdownResume(content);

    expect(md).toContain("[LinkedIn](https://linkedin.com/in/samkirk)");
  });

  it("should handle LinkedIn URL with https prefix", () => {
    const content: ResumeContent = {
      ...createMockResumeContent(),
      header: {
        ...createMockResumeContent().header,
        linkedIn: "https://linkedin.com/in/samkirk",
      },
    };
    const md = generateMarkdownResume(content);

    expect(md).toContain("[LinkedIn](https://linkedin.com/in/samkirk)");
    expect(md).not.toContain("https://https://");
  });

  it("should include summary section", () => {
    const content = createMockResumeContent();
    const md = generateMarkdownResume(content);

    expect(md).toContain("## Professional Summary");
    expect(md).toContain("Experienced software engineer");
  });

  it("should include skills section", () => {
    const content = createMockResumeContent();
    const md = generateMarkdownResume(content);

    expect(md).toContain("## Skills");
    expect(md).toContain("**Languages:** TypeScript, Python");
    expect(md).toContain("**Frontend:** React, Next.js");
  });

  it("should skip skills section if empty", () => {
    const content: ResumeContent = {
      ...createMockResumeContent(),
      skills: [],
    };
    const md = generateMarkdownResume(content);

    expect(md).not.toContain("## Skills");
  });

  it("should include experience section", () => {
    const content = createMockResumeContent();
    const md = generateMarkdownResume(content);

    expect(md).toContain("## Professional Experience");
    expect(md).toContain("### Senior Engineer — TechCorp");
    expect(md).toContain("*2019 - 2024*");
    expect(md).toContain("- Led React development");
    expect(md).toContain("- Built microservices");
  });

  it("should include location in experience when present", () => {
    const content: ResumeContent = {
      ...createMockResumeContent(),
      experience: [
        {
          title: "Engineer",
          company: "Corp",
          dateRange: "2020-2024",
          location: "San Francisco, CA",
          bullets: ["Did stuff"],
        },
      ],
    };
    const md = generateMarkdownResume(content);

    expect(md).toContain("*2020-2024 | San Francisco, CA*");
  });

  it("should skip experience section if empty", () => {
    const content: ResumeContent = {
      ...createMockResumeContent(),
      experience: [],
    };
    const md = generateMarkdownResume(content);

    expect(md).not.toContain("## Professional Experience");
  });

  it("should include education section", () => {
    const content = createMockResumeContent();
    const md = generateMarkdownResume(content);

    expect(md).toContain("## Education");
    expect(md).toContain("**B.S. Computer Science** — UC Berkeley, 2015");
  });

  it("should include education details when present", () => {
    const content: ResumeContent = {
      ...createMockResumeContent(),
      education: [
        {
          degree: "B.S. Computer Science",
          institution: "MIT",
          year: "2015",
          details: "Summa Cum Laude",
        },
      ],
    };
    const md = generateMarkdownResume(content);

    expect(md).toContain("*Summa Cum Laude*");
  });

  it("should skip education section if empty", () => {
    const content: ResumeContent = {
      ...createMockResumeContent(),
      education: [],
    };
    const md = generateMarkdownResume(content);

    expect(md).not.toContain("## Education");
  });

  it("should include additional sections when present", () => {
    const content: ResumeContent = {
      ...createMockResumeContent(),
      additionalSections: [
        { title: "Awards", content: "Employee of the Year 2023" },
        { title: "Publications", content: "Paper on distributed systems" },
      ],
    };
    const md = generateMarkdownResume(content);

    expect(md).toContain("## Awards");
    expect(md).toContain("Employee of the Year 2023");
    expect(md).toContain("## Publications");
    expect(md).toContain("Paper on distributed systems");
  });
});

// ============================================================================
// Tests: countResumeWords
// ============================================================================

describe("countResumeWords", () => {
  it("should count words in header", () => {
    const content: ResumeContent = {
      header: { name: "Sam Kirk", title: "Senior Software Engineer" },
      summary: "",
      skills: [],
      experience: [],
      education: [],
    };
    const count = countResumeWords(content);

    // "Sam" "Kirk" "Senior" "Software" "Engineer" = 5
    expect(count).toBe(5);
  });

  it("should count words in summary", () => {
    const content: ResumeContent = {
      header: { name: "Sam", title: "Eng" },
      summary: "Experienced engineer with ten years of experience.",
      skills: [],
      experience: [],
      education: [],
    };
    const count = countResumeWords(content);

    // Header: 2, Summary: 7 = 9
    expect(count).toBe(9);
  });

  it("should count words in skills", () => {
    const content: ResumeContent = {
      header: { name: "Sam", title: "Eng" },
      summary: "Test",
      skills: [
        { category: "Programming Languages", items: ["TypeScript", "Python"] },
      ],
      experience: [],
      education: [],
    };
    const count = countResumeWords(content);

    // Header: 2, Summary: 1, Skills category: 2, items: 2 = 7
    expect(count).toBe(7);
  });

  it("should count words in experience", () => {
    const content: ResumeContent = {
      header: { name: "Sam", title: "Eng" },
      summary: "Test",
      skills: [],
      experience: [
        {
          title: "Senior Engineer",
          company: "Tech Corp",
          dateRange: "2020",
          bullets: ["Led team of five engineers", "Built new platform"],
        },
      ],
      education: [],
    };
    const count = countResumeWords(content);

    // Header: 2, Summary: 1, Exp title: 2, company: 2, bullets: 5+3=8 = 15
    // (dateRange is not counted as it's typically a date/number)
    expect(count).toBe(15);
  });

  it("should count words in education", () => {
    const content: ResumeContent = {
      header: { name: "Sam", title: "Eng" },
      summary: "Test",
      skills: [],
      experience: [],
      education: [
        {
          degree: "Bachelor of Science",
          institution: "MIT",
          year: "2020",
          details: "Summa Cum Laude",
        },
      ],
    };
    const count = countResumeWords(content);

    // Header: 2, Summary: 1, Edu: 3 + 1 + 3 = 10
    expect(count).toBe(10);
  });

  it("should count words in additional sections", () => {
    const content: ResumeContent = {
      header: { name: "Sam", title: "Eng" },
      summary: "Test",
      skills: [],
      experience: [],
      education: [],
      additionalSections: [
        { title: "Awards and Honors", content: "Employee of the year" },
      ],
    };
    const count = countResumeWords(content);

    // Header: 2, Summary: 1, Section: 3 + 4 = 10
    expect(count).toBe(10);
  });

  it("should return total for a complete resume", () => {
    const content = createMockResumeContent();
    const count = countResumeWords(content);

    // Should be a reasonable count for a resume
    expect(count).toBeGreaterThan(20);
    expect(count).toBeLessThan(500);
  });

  it("should handle empty strings", () => {
    const content: ResumeContent = {
      header: { name: "", title: "" },
      summary: "",
      skills: [],
      experience: [],
      education: [],
    };
    const count = countResumeWords(content);

    expect(count).toBe(0);
  });
});

// ============================================================================
// Tests: ResumeGeneratorError
// ============================================================================

describe("ResumeGeneratorError", () => {
  it("should have correct properties", () => {
    const error = new ResumeGeneratorError("Test error");

    expect(error.name).toBe("ResumeGeneratorError");
    expect(error.code).toBe("RESUME_GENERATOR_ERROR");
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe("Test error");
  });

  it("should serialize to JSON correctly", () => {
    const error = new ResumeGeneratorError("Test error");
    const json = error.toJSON();

    expect(json).toEqual({
      error: "resume_generator_error",
      message: "Test error",
    });
  });

  it("should be instanceof Error", () => {
    const error = new ResumeGeneratorError("Test");
    expect(error).toBeInstanceOf(Error);
  });
});

// ============================================================================
// Tests: Type Definitions
// ============================================================================

describe("Type definitions", () => {
  it("ResumeExperience should have correct required fields", () => {
    const exp: ResumeExperience = {
      title: "Engineer",
      company: "Corp",
      dateRange: "2020-2024",
      bullets: ["Did things"],
    };
    expect(exp.title).toBeDefined();
    expect(exp.company).toBeDefined();
    expect(exp.dateRange).toBeDefined();
    expect(exp.bullets).toBeDefined();
    expect(exp.location).toBeUndefined();
  });

  it("ResumeEducation should have correct required fields", () => {
    const edu: ResumeEducation = {
      degree: "BS",
      institution: "MIT",
      year: "2020",
    };
    expect(edu.degree).toBeDefined();
    expect(edu.institution).toBeDefined();
    expect(edu.year).toBeDefined();
    expect(edu.details).toBeUndefined();
  });
});
