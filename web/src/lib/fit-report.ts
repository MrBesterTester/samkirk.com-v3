import "server-only";

import type { FitFlowState, ExtractedJobFields } from "./fit-flow";
import {
  HOME_LOCATION,
  MAX_COMMUTE_MINUTES,
  MAX_ONSITE_DAYS,
} from "./fit-flow";
import { generateContent, type GenerateResult } from "./vertex-ai";
import { getCurrentChunks, type ResumeChunk } from "./resume-chunker";
import { renderMarkdown, type Citation } from "./markdown-renderer";
import { getPrivateBucket, PrivatePaths, writeFile, writeBuffer } from "./storage";
import { updateSubmission, completeSubmission } from "./submission";

// ============================================================================
// Types
// ============================================================================

/**
 * Fit score classification.
 */
export type FitScore = "Well" | "Average" | "Poorly";

/**
 * A category in the fit analysis.
 */
export interface FitCategory {
  /** Category name */
  name: string;
  /** Fit score for this category */
  score: FitScore;
  /** Rationale explaining the score */
  rationale: string;
}

/**
 * Structured fit analysis result.
 */
export interface FitAnalysis {
  /** Overall fit score */
  overallScore: FitScore;
  /** Individual category scores */
  categories: FitCategory[];
  /** List of unknowns/assumptions made */
  unknowns: string[];
  /** Final recommendation summary */
  recommendation: string;
  /** Resume chunks used for analysis */
  usedChunks: ResumeChunk[];
}

/**
 * Complete fit report with all artifacts.
 */
export interface FitReport {
  /** The fit analysis results */
  analysis: FitAnalysis;
  /** The generated markdown report */
  markdown: string;
  /** The rendered HTML report */
  html: string;
  /** Citations used in the report */
  citations: Citation[];
  /** LLM generation usage */
  usage: GenerateResult["usage"];
  /** Estimated cost in USD */
  estimatedCostUsd: number;
}

/**
 * Error thrown when report generation fails.
 */
export class FitReportError extends Error {
  readonly code = "FIT_REPORT_ERROR";
  readonly statusCode = 500;

  constructor(message: string) {
    super(message);
    this.name = "FitReportError";
  }

  toJSON() {
    return {
      error: "fit_report_error",
      message: this.message,
    };
  }
}

// ============================================================================
// E2E Testing Support
// ============================================================================

/**
 * Check if E2E testing mode is enabled.
 */
function isE2ETestingEnabled(): boolean {
  return process.env.E2E_TESTING === "true";
}

/**
 * Generate a mock fit report for E2E testing.
 * Used when E2E_TESTING=true and no resume chunks are available.
 */
function generateMockFitReport(state: FitFlowState): FitReport {
  console.log("[E2E] Generating mock fit report for testing");
  
  const mockAnalysis: FitAnalysis = {
    overallScore: "Well",
    categories: [
      {
        name: "Technical Skills",
        score: "Well",
        rationale: "[E2E Mock] Strong alignment with required technical skills.",
      },
      {
        name: "Experience Level",
        score: "Average",
        rationale: "[E2E Mock] Experience level generally matches expectations.",
      },
      {
        name: "Location/Remote",
        score: "Well",
        rationale: "[E2E Mock] Location requirements are compatible.",
      },
    ],
    unknowns: [
      "[E2E Mock] This is a mock report generated for E2E testing.",
    ],
    recommendation:
      "[E2E Mock] This mock report indicates a good fit for testing purposes.",
    usedChunks: [],
  };

  const mockMarkdown = `# Fit Analysis Report

## Overall Score: ${mockAnalysis.overallScore}

**Note: This is a mock report generated for E2E testing.**

## Job Information

- **Title:** ${state.extracted.title || "Unknown"}
- **Company:** ${state.extracted.company || "Unknown"}
- **Seniority:** ${state.extracted.seniority}
- **Location Type:** ${state.extracted.locationType}

## Category Breakdown

${mockAnalysis.categories.map((cat) => `### ${cat.name}: ${cat.score}\n\n${cat.rationale}`).join("\n\n")}

## Unknowns and Assumptions

${mockAnalysis.unknowns.map((u) => `- ${u}`).join("\n")}

## Recommendation

${mockAnalysis.recommendation}

---

## Citations

*No citations - E2E mock report*
`;

  const mockHtml = `<!DOCTYPE html>
<html>
<head><title>Fit Analysis (E2E Mock)</title></head>
<body>
<h1>Fit Analysis Report (E2E Mock)</h1>
<p>Overall Score: <strong>${mockAnalysis.overallScore}</strong></p>
<p>This is a mock report generated for E2E testing.</p>
</body>
</html>`;

  return {
    analysis: mockAnalysis,
    markdown: mockMarkdown,
    html: mockHtml,
    citations: [],
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    estimatedCostUsd: 0,
  };
}

// ============================================================================
// System Prompt
// ============================================================================

/**
 * System instruction for the fit analysis LLM.
 */
export const FIT_ANALYSIS_SYSTEM_PROMPT = `You are an expert job fit analyzer for Sam Kirk's personal career website. Your role is to analyze job postings and determine how well Sam fits the role based on his resume.

## Your Task
Analyze the job posting and generate a structured fit report comparing the requirements to Sam's background.

## Output Format
You MUST respond with a valid JSON object (no markdown code fences, just raw JSON) with this exact structure:
{
  "overallScore": "Well" | "Average" | "Poorly",
  "categories": [
    {
      "name": "Technical Skills",
      "score": "Well" | "Average" | "Poorly",
      "rationale": "explanation"
    },
    {
      "name": "Experience Level",
      "score": "Well" | "Average" | "Poorly",
      "rationale": "explanation"
    },
    {
      "name": "Location/Remote",
      "score": "Well" | "Average" | "Poorly",
      "rationale": "explanation"
    },
    {
      "name": "Domain Knowledge",
      "score": "Well" | "Average" | "Poorly",
      "rationale": "explanation"
    }
  ],
  "unknowns": ["list of things that were unclear or assumed"],
  "recommendation": "Brief final recommendation (2-3 sentences)"
}

## Scoring Guidelines
- **Well**: Strong match, meets or exceeds requirements
- **Average**: Partial match, some gaps but transferable skills exist
- **Poorly**: Significant mismatch or missing critical requirements

## Location Rules (CRITICAL)
Sam lives in ${HOME_LOCATION}. Location fit is determined by:
- **Well**: Fully remote OR hybrid with ≤${MAX_ONSITE_DAYS} onsite days/week AND ≤${MAX_COMMUTE_MINUTES} min commute
- **Poorly**: Requires >2 onsite days/week OR commute >30 minutes OR unclear location (worst-case assumption)

## Important Guidelines
1. Be objective and factual - only cite information from the resume context
2. If something is unclear, list it in "unknowns" and state your assumption
3. Do not invent experience or skills not present in the resume
4. Consider both explicit requirements and inferred expectations
5. Keep rationales concise but specific (cite relevant experience)`;

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Build the user prompt for fit analysis.
 */
export function buildFitAnalysisPrompt(
  state: FitFlowState,
  resumeChunks: ResumeChunk[]
): string {
  const { jobText, extracted } = state;

  // Build resume context
  const resumeContext = resumeChunks
    .map((chunk, i) => `[CHUNK ${i + 1}: ${chunk.title}]\n${chunk.content}`)
    .join("\n\n---\n\n");

  // Build extracted fields summary
  const extractedSummary = formatExtractedFields(extracted);

  return `## Job Posting
${jobText}

## Extracted Information
${extractedSummary}

## Sam's Resume Context
${resumeContext}

## Instructions
Analyze this job posting against Sam's resume and generate the fit analysis JSON as specified. Remember to follow the location rules strictly.`;
}

/**
 * Format extracted fields for the prompt.
 */
export function formatExtractedFields(extracted: ExtractedJobFields): string {
  const lines: string[] = [];

  if (extracted.title) {
    lines.push(`- **Job Title**: ${extracted.title}`);
  }
  if (extracted.company) {
    lines.push(`- **Company**: ${extracted.company}`);
  }
  if (extracted.seniority !== "unknown") {
    lines.push(`- **Seniority**: ${extracted.seniority}`);
  }
  if (extracted.locationType !== "unknown") {
    lines.push(`- **Location Type**: ${extracted.locationType}`);
  }
  if (extracted.officeLocation) {
    lines.push(`- **Office Location**: ${extracted.officeLocation}`);
  }
  if (extracted.onsiteDaysPerWeek !== null) {
    lines.push(`- **Onsite Days/Week**: ${extracted.onsiteDaysPerWeek}`);
  }
  if (extracted.estimatedCommuteMinutes !== null) {
    lines.push(`- **Estimated Commute**: ${extracted.estimatedCommuteMinutes} minutes`);
  }
  if (extracted.locationFitStatus) {
    lines.push(`- **Location Fit Status**: ${extracted.locationFitStatus}`);
  }
  if (extracted.mustHaveSkills.length > 0) {
    lines.push(`- **Must-Have Skills**: ${extracted.mustHaveSkills.join(", ")}`);
  }
  if (extracted.niceToHaveSkills.length > 0) {
    lines.push(`- **Nice-To-Have Skills**: ${extracted.niceToHaveSkills.join(", ")}`);
  }
  if (extracted.yearsExperienceRequired !== null) {
    lines.push(`- **Years Experience Required**: ${extracted.yearsExperienceRequired}`);
  }
  if (extracted.compensationRange) {
    lines.push(`- **Compensation**: ${extracted.compensationRange}`);
  }

  return lines.length > 0 ? lines.join("\n") : "(No fields extracted)";
}

// ============================================================================
// Response Parsing
// ============================================================================

/**
 * Parse the LLM response into a structured FitAnalysis.
 */
export function parseFitAnalysisResponse(
  responseText: string,
  usedChunks: ResumeChunk[]
): FitAnalysis {
  // Clean up the response text - remove any markdown code fences if present
  let jsonText = responseText.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.slice(7);
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.slice(3);
  }
  if (jsonText.endsWith("```")) {
    jsonText = jsonText.slice(0, -3);
  }
  jsonText = jsonText.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new FitReportError(`Failed to parse LLM response as JSON: ${jsonText.slice(0, 200)}...`);
  }

  // Validate the structure
  if (typeof parsed !== "object" || parsed === null) {
    throw new FitReportError("LLM response is not an object");
  }

  const obj = parsed as Record<string, unknown>;

  // Validate overallScore
  const validScores = ["Well", "Average", "Poorly"];
  if (!validScores.includes(obj.overallScore as string)) {
    throw new FitReportError(`Invalid overallScore: ${obj.overallScore}`);
  }

  // Validate categories
  if (!Array.isArray(obj.categories)) {
    throw new FitReportError("categories must be an array");
  }

  const categories: FitCategory[] = obj.categories.map((cat, i) => {
    if (typeof cat !== "object" || cat === null) {
      throw new FitReportError(`Category ${i} is not an object`);
    }
    const c = cat as Record<string, unknown>;
    if (typeof c.name !== "string") {
      throw new FitReportError(`Category ${i} missing name`);
    }
    if (!validScores.includes(c.score as string)) {
      throw new FitReportError(`Category ${i} has invalid score: ${c.score}`);
    }
    if (typeof c.rationale !== "string") {
      throw new FitReportError(`Category ${i} missing rationale`);
    }
    return {
      name: c.name,
      score: c.score as FitScore,
      rationale: c.rationale,
    };
  });

  // Validate unknowns
  const unknowns: string[] = Array.isArray(obj.unknowns)
    ? obj.unknowns.filter((u): u is string => typeof u === "string")
    : [];

  // Validate recommendation
  const recommendation =
    typeof obj.recommendation === "string"
      ? obj.recommendation
      : "No recommendation provided.";

  return {
    overallScore: obj.overallScore as FitScore,
    categories,
    unknowns,
    recommendation,
    usedChunks,
  };
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate the markdown report from the analysis.
 */
export function generateMarkdownReport(
  analysis: FitAnalysis,
  extracted: ExtractedJobFields
): string {
  const { overallScore, categories, unknowns, recommendation } = analysis;

  // Build score emoji
  const scoreEmoji = overallScore === "Well" ? "✅" : overallScore === "Average" ? "⚠️" : "❌";

  // Build the report
  const sections: string[] = [];

  // Header
  sections.push(`# Fit Analysis Report`);
  sections.push("");

  // Job Summary
  if (extracted.title || extracted.company) {
    const titlePart = extracted.title || "Position";
    const companyPart = extracted.company ? ` at ${extracted.company}` : "";
    sections.push(`## Job: ${titlePart}${companyPart}`);
    sections.push("");
  }

  // Overall Score
  sections.push(`## Overall Fit: ${scoreEmoji} ${overallScore}`);
  sections.push("");

  // Summary
  sections.push(`### Recommendation`);
  sections.push("");
  sections.push(recommendation);
  sections.push("");

  // Category Breakdown
  sections.push(`## Category Breakdown`);
  sections.push("");

  for (const category of categories) {
    const catEmoji = category.score === "Well" ? "✅" : category.score === "Average" ? "⚠️" : "❌";
    sections.push(`### ${category.name}: ${catEmoji} ${category.score}`);
    sections.push("");
    sections.push(category.rationale);
    sections.push("");
  }

  // Unknowns/Assumptions
  if (unknowns.length > 0) {
    sections.push(`## Unknowns & Assumptions`);
    sections.push("");
    for (const unknown of unknowns) {
      sections.push(`- ${unknown}`);
    }
    sections.push("");
  }

  // Extracted Fields Summary
  sections.push(`## Extracted Job Details`);
  sections.push("");
  sections.push(formatExtractedFields(extracted));
  sections.push("");

  return sections.join("\n");
}

/**
 * Generate citations from used resume chunks.
 */
export function generateCitations(chunks: ResumeChunk[]): Citation[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    title: chunk.title,
    sourceRef: chunk.sourceRef,
  }));
}

// ============================================================================
// Main Report Generation
// ============================================================================

/**
 * Generate a complete fit report for a finalized Fit flow state.
 *
 * This function:
 * 1. Loads resume chunks for context
 * 2. Builds the analysis prompt
 * 3. Calls the LLM to generate the analysis
 * 4. Parses and validates the response
 * 5. Generates markdown and HTML reports
 * 6. Creates citations
 *
 * @param state - The finalized Fit flow state
 * @returns The complete fit report
 *
 * @throws FitReportError if report generation fails
 * @throws SpendCapError if monthly spend cap is exceeded
 */
export async function generateFitReport(state: FitFlowState): Promise<FitReport> {
  // 1. Load resume chunks
  const resumeChunks = await getCurrentChunks();

  if (resumeChunks.length === 0) {
    // In E2E test mode, return a mock report instead of throwing
    if (isE2ETestingEnabled()) {
      return generateMockFitReport(state);
    }
    throw new FitReportError(
      "No resume chunks available. Please upload a resume first."
    );
  }

  // 2. Build the prompt
  const prompt = buildFitAnalysisPrompt(state, resumeChunks);

  // 3. Call the LLM
  const llmResult = await generateContent(prompt, {
    systemInstruction: FIT_ANALYSIS_SYSTEM_PROMPT,
    temperature: 0.3, // Lower temperature for more consistent structured output
    maxOutputTokens: 2048,
  });

  // 4. Parse the response
  const analysis = parseFitAnalysisResponse(llmResult.text, resumeChunks);

  // 5. Generate markdown report
  const baseMarkdown = generateMarkdownReport(analysis, state.extracted);

  // 6. Generate citations (stored separately, not appended to report output)
  const citations = generateCitations(resumeChunks);

  // 7. Render HTML from clean markdown (citations live in citations/ folder only)
  const html = renderMarkdown(baseMarkdown, {
    fullDocument: true,
    title: `Fit Analysis: ${state.extracted.title || "Job Position"}`,
    sanitize: true,
  });

  return {
    analysis,
    markdown: baseMarkdown,
    html,
    citations,
    usage: llmResult.usage,
    estimatedCostUsd: llmResult.estimatedCostUsd,
  };
}

// ============================================================================
// Artifact Storage
// ============================================================================

/**
 * Store fit report artifacts to GCS and update the submission.
 *
 * @param submissionId - The submission ID
 * @param report - The generated fit report
 * @param state - The Fit flow state
 */
export async function storeFitReportArtifacts(
  submissionId: string,
  report: FitReport,
  state: FitFlowState
): Promise<void> {
  const bucket = getPrivateBucket();

  // Store the markdown report
  const mdPath = PrivatePaths.submissionOutput(submissionId, "report.md");
  await writeFile(bucket, mdPath, report.markdown, "text/markdown; charset=utf-8");

  // Store the HTML report
  const htmlPath = PrivatePaths.submissionOutput(submissionId, "report.html");
  await writeFile(bucket, htmlPath, report.html, "text/html; charset=utf-8");

  // Store the PDF report
  const { renderFitReportPdf } = await import("./pdf-renderer");
  const pdfBuffer = await renderFitReportPdf(report.analysis, state.extracted, report.citations);
  const pdfPath = PrivatePaths.submissionOutput(submissionId, "report.pdf");
  await writeBuffer(bucket, pdfPath, pdfBuffer, "application/pdf");

  // Store the extracted data
  const extractedPath = PrivatePaths.submissionExtracted(submissionId);
  await writeFile(
    bucket,
    extractedPath,
    JSON.stringify(state.extracted, null, 2),
    "application/json; charset=utf-8"
  );

  // Store the original job text as input
  if (state.jobText) {
    const inputPath = PrivatePaths.submissionInput(submissionId, "job-text.txt");
    await writeFile(bucket, inputPath, state.jobText, "text/plain; charset=utf-8");
  }

  // Update submission with final outputs
  await completeSubmission(submissionId, {
    extracted: state.extracted as unknown as Record<string, unknown>,
    outputs: {
      overallScore: report.analysis.overallScore,
      categoryCount: report.analysis.categories.length,
      unknownCount: report.analysis.unknowns.length,
      reportMdPath: mdPath,
      reportHtmlPath: htmlPath,
      inputTokens: report.usage.inputTokens,
      outputTokens: report.usage.outputTokens,
      estimatedCostUsd: report.estimatedCostUsd,
    },
    citations: report.citations,
  });
}

/**
 * Generate a fit report and store all artifacts.
 *
 * This is the main entry point for the fit report generation flow.
 * It combines report generation with artifact storage.
 *
 * @param submissionId - The submission ID
 * @param state - The finalized Fit flow state
 * @returns The generated report
 */
export async function generateAndStoreFitReport(
  submissionId: string,
  state: FitFlowState
): Promise<FitReport> {
  // Update submission to "generating" status
  await updateSubmission(submissionId, {
    status: "in_progress",
    extracted: state.extracted as unknown as Record<string, unknown>,
  });

  try {
    // Generate the report
    const report = await generateFitReport(state);

    // Store artifacts and complete submission
    await storeFitReportArtifacts(submissionId, report, state);

    return report;
  } catch (error) {
    // Mark submission as error
    await updateSubmission(submissionId, {
      status: "error",
      outputs: {
        errorType: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
