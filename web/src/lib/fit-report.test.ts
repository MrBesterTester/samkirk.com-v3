import { describe, it, expect, vi } from "vitest";
import type { FitFlowState, ExtractedJobFields } from "./fit-flow";
import type { ResumeChunk } from "./resume-chunker";

// Mock server-only before importing the module
vi.mock("server-only", () => ({}));

// Mock dependencies
vi.mock("./vertex-ai", () => ({
  generateContent: vi.fn(),
}));

vi.mock("./resume-chunker", () => ({
  getCurrentChunks: vi.fn(),
}));

vi.mock("./markdown-renderer", () => ({
  renderMarkdown: vi.fn((md) => `<html>${md}</html>`),
  appendCitationsToMarkdown: vi.fn((md, citations) =>
    citations.length > 0 ? `${md}\n\n## Citations\n${citations.map((c: { title: string }) => c.title).join("\n")}` : md
  ),
}));

vi.mock("./storage", () => ({
  getPrivateBucket: vi.fn(() => ({})),
  PrivatePaths: {
    submissionOutput: (id: string, file: string) => `submissions/${id}/output/${file}`,
    submissionExtracted: (id: string) => `submissions/${id}/extracted.json`,
    submissionInput: (id: string, file: string) => `submissions/${id}/input/${file}`,
  },
  writeFile: vi.fn(),
}));

vi.mock("./submission", () => ({
  updateSubmission: vi.fn(),
  completeSubmission: vi.fn(),
}));

// Import after mocking
import {
  buildFitAnalysisPrompt,
  formatExtractedFields,
  parseFitAnalysisResponse,
  generateMarkdownReport,
  generateCitations,
  FitReportError,
  FIT_ANALYSIS_SYSTEM_PROMPT,
  type FitAnalysis,
  type FitScore,
} from "./fit-report";

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockExtractedFields(
  overrides: Partial<ExtractedJobFields> = {}
): ExtractedJobFields {
  return {
    title: "Senior Software Engineer",
    company: "Test Corp",
    seniority: "senior",
    seniorityConfirmed: true,
    locationType: "fully_remote",
    officeLocation: null,
    onsiteDaysPerWeek: null,
    estimatedCommuteMinutes: null,
    locationFitStatus: "acceptable",
    locationConfirmed: true,
    mustHaveSkills: ["TypeScript", "React", "Node.js"],
    mustHaveSkillsConfirmed: true,
    niceToHaveSkills: ["Python", "AWS"],
    yearsExperienceRequired: 5,
    compensationRange: "$150k-$200k",
    ...overrides,
  };
}

function createMockFitFlowState(
  overrides: Partial<FitFlowState> = {}
): FitFlowState {
  return {
    flowId: "test-flow-123",
    status: "ready",
    jobInput: null,
    jobText: "Senior Software Engineer position at Test Corp...",
    extracted: createMockExtractedFields(),
    followUpsAsked: 0,
    history: [],
    pendingQuestion: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockResumeChunks(): ResumeChunk[] {
  return [
    {
      chunkId: "chunk_001",
      title: "Career Summary",
      sourceRef: "h1:Career Summary",
      content: "45+ years in Silicon Valley developing software and firmware tests...",
    },
    {
      chunkId: "chunk_002",
      title: "Employment History > SAK Consulting",
      sourceRef: "h1:Employment History > h2:Chief Consulting Engineer — SAK Consulting (Current, 2022-present)",
      content: "Chief Consulting Engineer at SAK Consulting (2022-present)...",
    },
    {
      chunkId: "chunk_003",
      title: "Aggregated Skills Summary",
      sourceRef: "h1:Aggregated Skills Summary",
      content: "Python: 8+ years, C: 15+ years, Linux/Unix: Continuous since 1980...",
    },
  ];
}

function createValidLLMResponse(): string {
  return JSON.stringify({
    overallScore: "Well",
    categories: [
      {
        name: "Technical Skills",
        score: "Well",
        rationale: "Strong match with required TypeScript and React skills.",
      },
      {
        name: "Experience Level",
        score: "Well",
        rationale: "45+ years experience exceeds the 5 years required.",
      },
      {
        name: "Location/Remote",
        score: "Well",
        rationale: "Role is fully remote, which is acceptable.",
      },
      {
        name: "Domain Knowledge",
        score: "Average",
        rationale: "Some relevant experience but not in same industry.",
      },
    ],
    unknowns: ["Specific tech stack version requirements", "Team size"],
    recommendation: "Strong overall fit. The candidate's extensive experience in TypeScript and React aligns well with the requirements.",
  });
}

// ============================================================================
// Tests: System Prompt
// ============================================================================

describe("FIT_ANALYSIS_SYSTEM_PROMPT", () => {
  it("should include location rules", () => {
    expect(FIT_ANALYSIS_SYSTEM_PROMPT).toContain("Fremont, CA");
    expect(FIT_ANALYSIS_SYSTEM_PROMPT).toContain("30 min commute");
    expect(FIT_ANALYSIS_SYSTEM_PROMPT).toContain("2 onsite days/week");
  });

  it("should specify JSON output format", () => {
    expect(FIT_ANALYSIS_SYSTEM_PROMPT).toContain("JSON object");
    expect(FIT_ANALYSIS_SYSTEM_PROMPT).toContain("overallScore");
    expect(FIT_ANALYSIS_SYSTEM_PROMPT).toContain("categories");
  });

  it("should define score values", () => {
    expect(FIT_ANALYSIS_SYSTEM_PROMPT).toContain("Well");
    expect(FIT_ANALYSIS_SYSTEM_PROMPT).toContain("Average");
    expect(FIT_ANALYSIS_SYSTEM_PROMPT).toContain("Poorly");
  });
});

// ============================================================================
// Tests: formatExtractedFields
// ============================================================================

describe("formatExtractedFields", () => {
  it("should format all populated fields", () => {
    const extracted = createMockExtractedFields();
    const result = formatExtractedFields(extracted);

    expect(result).toContain("**Job Title**: Senior Software Engineer");
    expect(result).toContain("**Company**: Test Corp");
    expect(result).toContain("**Seniority**: senior");
    expect(result).toContain("**Location Type**: fully_remote");
    expect(result).toContain("**Must-Have Skills**: TypeScript, React, Node.js");
    expect(result).toContain("**Years Experience Required**: 5");
    expect(result).toContain("**Compensation**: $150k-$200k");
  });

  it("should skip unknown/null fields", () => {
    const extracted = createMockExtractedFields({
      title: null,
      company: null,
      seniority: "unknown",
      locationType: "unknown",
    });
    const result = formatExtractedFields(extracted);

    expect(result).not.toContain("Job Title");
    expect(result).not.toContain("Company");
    expect(result).not.toContain("Seniority");
    expect(result).not.toContain("Location Type");
  });

  it("should handle empty skills arrays", () => {
    const extracted = createMockExtractedFields({
      mustHaveSkills: [],
      niceToHaveSkills: [],
    });
    const result = formatExtractedFields(extracted);

    expect(result).not.toContain("Must-Have Skills");
    expect(result).not.toContain("Nice-To-Have Skills");
  });

  it("should return placeholder for completely empty fields", () => {
    const extracted = createMockExtractedFields({
      title: null,
      company: null,
      seniority: "unknown",
      locationType: "unknown",
      locationFitStatus: "unknown",
      mustHaveSkills: [],
      niceToHaveSkills: [],
      yearsExperienceRequired: null,
      compensationRange: null,
      officeLocation: null,
      onsiteDaysPerWeek: null,
      estimatedCommuteMinutes: null,
    });
    const result = formatExtractedFields(extracted);

    // Should still show location fit status
    expect(result).toContain("Location Fit Status");
  });

  it("should include commute information when available", () => {
    const extracted = createMockExtractedFields({
      locationType: "hybrid",
      officeLocation: "San Jose, CA",
      onsiteDaysPerWeek: 2,
      estimatedCommuteMinutes: 25,
    });
    const result = formatExtractedFields(extracted);

    expect(result).toContain("**Office Location**: San Jose, CA");
    expect(result).toContain("**Onsite Days/Week**: 2");
    expect(result).toContain("**Estimated Commute**: 25 minutes");
  });
});

// ============================================================================
// Tests: buildFitAnalysisPrompt
// ============================================================================

describe("buildFitAnalysisPrompt", () => {
  it("should include job text", () => {
    const state = createMockFitFlowState();
    const chunks = createMockResumeChunks();
    const prompt = buildFitAnalysisPrompt(state, chunks);

    expect(prompt).toContain("## Job Posting");
    expect(prompt).toContain("Senior Software Engineer position at Test Corp");
  });

  it("should include extracted information", () => {
    const state = createMockFitFlowState();
    const chunks = createMockResumeChunks();
    const prompt = buildFitAnalysisPrompt(state, chunks);

    expect(prompt).toContain("## Extracted Information");
    expect(prompt).toContain("TypeScript, React, Node.js");
  });

  it("should include resume chunks with labels", () => {
    const state = createMockFitFlowState();
    const chunks = createMockResumeChunks();
    const prompt = buildFitAnalysisPrompt(state, chunks);

    expect(prompt).toContain("## Sam's Resume Context");
    expect(prompt).toContain("[CHUNK 1: Career Summary]");
    expect(prompt).toContain("[CHUNK 2: Employment History > SAK Consulting]");
    expect(prompt).toContain("[CHUNK 3: Aggregated Skills Summary]");
    expect(prompt).toContain("45+ years in Silicon Valley");
  });

  it("should include instructions section", () => {
    const state = createMockFitFlowState();
    const chunks = createMockResumeChunks();
    const prompt = buildFitAnalysisPrompt(state, chunks);

    expect(prompt).toContain("## Instructions");
    expect(prompt).toContain("location rules");
  });

  it("should handle empty resume chunks", () => {
    const state = createMockFitFlowState();
    const prompt = buildFitAnalysisPrompt(state, []);

    expect(prompt).toContain("## Sam's Resume Context");
    // Empty chunks should still work
    expect(prompt).not.toContain("[CHUNK");
  });
});

// ============================================================================
// Tests: parseFitAnalysisResponse
// ============================================================================

describe("parseFitAnalysisResponse", () => {
  const chunks = createMockResumeChunks();

  it("should parse valid JSON response", () => {
    const response = createValidLLMResponse();
    const result = parseFitAnalysisResponse(response, chunks);

    expect(result.overallScore).toBe("Well");
    expect(result.categories).toHaveLength(4);
    expect(result.unknowns).toHaveLength(2);
    expect(result.recommendation).toContain("Strong overall fit");
    expect(result.usedChunks).toBe(chunks);
  });

  it("should handle JSON wrapped in markdown code fences", () => {
    const response = "```json\n" + createValidLLMResponse() + "\n```";
    const result = parseFitAnalysisResponse(response, chunks);

    expect(result.overallScore).toBe("Well");
  });

  it("should handle plain code fences", () => {
    const response = "```\n" + createValidLLMResponse() + "\n```";
    const result = parseFitAnalysisResponse(response, chunks);

    expect(result.overallScore).toBe("Well");
  });

  it("should validate overallScore value", () => {
    const response = JSON.stringify({
      overallScore: "Invalid",
      categories: [],
      unknowns: [],
      recommendation: "test",
    });

    expect(() => parseFitAnalysisResponse(response, chunks)).toThrow(FitReportError);
  });

  it("should validate category scores", () => {
    const response = JSON.stringify({
      overallScore: "Well",
      categories: [
        { name: "Test", score: "Bad", rationale: "test" },
      ],
      unknowns: [],
      recommendation: "test",
    });

    expect(() => parseFitAnalysisResponse(response, chunks)).toThrow(FitReportError);
  });

  it("should throw on invalid JSON", () => {
    expect(() => parseFitAnalysisResponse("not json", chunks)).toThrow(FitReportError);
  });

  it("should throw if categories is not an array", () => {
    const response = JSON.stringify({
      overallScore: "Well",
      categories: "not an array",
      unknowns: [],
      recommendation: "test",
    });

    expect(() => parseFitAnalysisResponse(response, chunks)).toThrow(FitReportError);
  });

  it("should handle missing unknowns array", () => {
    const response = JSON.stringify({
      overallScore: "Well",
      categories: [],
      recommendation: "test",
    });
    const result = parseFitAnalysisResponse(response, chunks);

    expect(result.unknowns).toEqual([]);
  });

  it("should handle missing recommendation", () => {
    const response = JSON.stringify({
      overallScore: "Average",
      categories: [],
      unknowns: [],
    });
    const result = parseFitAnalysisResponse(response, chunks);

    expect(result.recommendation).toBe("No recommendation provided.");
  });
});

// ============================================================================
// Tests: generateMarkdownReport
// ============================================================================

describe("generateMarkdownReport", () => {
  const mockAnalysis: FitAnalysis = {
    overallScore: "Well",
    categories: [
      {
        name: "Technical Skills",
        score: "Well",
        rationale: "Strong TypeScript experience.",
      },
      {
        name: "Location/Remote",
        score: "Average",
        rationale: "Remote is acceptable.",
      },
    ],
    unknowns: ["Team structure", "Reporting line"],
    recommendation: "Good fit overall.",
    usedChunks: createMockResumeChunks(),
  };

  it("should generate report header", () => {
    const extracted = createMockExtractedFields();
    const md = generateMarkdownReport(mockAnalysis, extracted);

    expect(md).toContain("# Fit Analysis Report");
  });

  it("should include job title and company", () => {
    const extracted = createMockExtractedFields();
    const md = generateMarkdownReport(mockAnalysis, extracted);

    expect(md).toContain("## Job: Senior Software Engineer at Test Corp");
  });

  it("should include overall score with emoji", () => {
    const extracted = createMockExtractedFields();
    const md = generateMarkdownReport(mockAnalysis, extracted);

    expect(md).toContain("## Overall Fit: ✅ Well");
  });

  it("should show different emojis for different scores", () => {
    const avgAnalysis = { ...mockAnalysis, overallScore: "Average" as FitScore };
    const poorAnalysis = { ...mockAnalysis, overallScore: "Poorly" as FitScore };
    const extracted = createMockExtractedFields();

    const avgMd = generateMarkdownReport(avgAnalysis, extracted);
    const poorMd = generateMarkdownReport(poorAnalysis, extracted);

    expect(avgMd).toContain("⚠️ Average");
    expect(poorMd).toContain("❌ Poorly");
  });

  it("should include recommendation section", () => {
    const extracted = createMockExtractedFields();
    const md = generateMarkdownReport(mockAnalysis, extracted);

    expect(md).toContain("### Recommendation");
    expect(md).toContain("Good fit overall.");
  });

  it("should include category breakdown", () => {
    const extracted = createMockExtractedFields();
    const md = generateMarkdownReport(mockAnalysis, extracted);

    expect(md).toContain("## Category Breakdown");
    expect(md).toContain("### Technical Skills: ✅ Well");
    expect(md).toContain("Strong TypeScript experience.");
    expect(md).toContain("### Location/Remote: ⚠️ Average");
  });

  it("should include unknowns section when present", () => {
    const extracted = createMockExtractedFields();
    const md = generateMarkdownReport(mockAnalysis, extracted);

    expect(md).toContain("## Unknowns & Assumptions");
    expect(md).toContain("- Team structure");
    expect(md).toContain("- Reporting line");
  });

  it("should omit unknowns section when empty", () => {
    const noUnknownsAnalysis = { ...mockAnalysis, unknowns: [] };
    const extracted = createMockExtractedFields();
    const md = generateMarkdownReport(noUnknownsAnalysis, extracted);

    expect(md).not.toContain("## Unknowns & Assumptions");
  });

  it("should include extracted job details", () => {
    const extracted = createMockExtractedFields();
    const md = generateMarkdownReport(mockAnalysis, extracted);

    expect(md).toContain("## Extracted Job Details");
    expect(md).toContain("TypeScript, React, Node.js");
  });
});

// ============================================================================
// Tests: generateCitations
// ============================================================================

describe("generateCitations", () => {
  it("should convert chunks to citations", () => {
    const chunks = createMockResumeChunks();
    const citations = generateCitations(chunks);

    expect(citations).toHaveLength(3);
    expect(citations[0]).toEqual({
      chunkId: "chunk_001",
      title: "Career Summary",
      sourceRef: "h1:Career Summary",
    });
  });

  it("should preserve all chunk metadata", () => {
    const chunks = createMockResumeChunks();
    const citations = generateCitations(chunks);

    expect(citations[1].chunkId).toBe("chunk_002");
    expect(citations[1].title).toBe("Employment History > SAK Consulting");
    expect(citations[1].sourceRef).toBe("h1:Employment History > h2:Chief Consulting Engineer — SAK Consulting (Current, 2022-present)");
  });

  it("should handle empty chunks array", () => {
    const citations = generateCitations([]);

    expect(citations).toEqual([]);
  });
});

// ============================================================================
// Tests: FitReportError
// ============================================================================

describe("FitReportError", () => {
  it("should have correct properties", () => {
    const error = new FitReportError("Test error");

    expect(error.name).toBe("FitReportError");
    expect(error.code).toBe("FIT_REPORT_ERROR");
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe("Test error");
  });

  it("should serialize to JSON correctly", () => {
    const error = new FitReportError("Test error");
    const json = error.toJSON();

    expect(json).toEqual({
      error: "fit_report_error",
      message: "Test error",
    });
  });
});
