import "server-only";

import { generateContent, type GenerateResult } from "./vertex-ai";
import {
  getResumeContext,
  generateCitationsFromChunks,
  type ResumeChunk,
} from "./resume-context";
import {
  renderMarkdown,
  appendCitationsToMarkdown,
  type Citation,
} from "./markdown-renderer";
import { getPrivateBucket, PrivatePaths, writeFile } from "./storage";
import { updateSubmission, completeSubmission } from "./submission";
import type { JobIngestionResult } from "./job-ingestion";

// ============================================================================
// Constants
// ============================================================================

/**
 * Target word count for a 2-page resume.
 * Professional resumes typically have 400-600 words per page.
 * We target the lower end to ensure it fits comfortably on 2 pages.
 */
export const TARGET_WORD_COUNT_MIN = 600;
export const TARGET_WORD_COUNT_MAX = 900;

/**
 * Maximum words per section to prevent any single section from dominating.
 */
export const MAX_WORDS_PER_SECTION = 250;

/**
 * Maximum bullet points per job to keep content concise.
 */
export const MAX_BULLETS_PER_JOB = 5;

// ============================================================================
// Types
// ============================================================================

/**
 * A professional experience entry in the generated resume.
 */
export interface ResumeExperience {
  /** Job title */
  title: string;
  /** Company name */
  company: string;
  /** Date range (e.g., "2020 - 2023") */
  dateRange: string;
  /** Location (optional) */
  location?: string;
  /** Achievement bullets (max 5) */
  bullets: string[];
}

/**
 * Education entry in the generated resume.
 */
export interface ResumeEducation {
  /** Degree or certification */
  degree: string;
  /** Institution name */
  institution: string;
  /** Year or date range */
  year: string;
  /** Additional details (optional) */
  details?: string;
}

/**
 * Structured resume content.
 */
export interface ResumeContent {
  /** Contact information header */
  header: {
    name: string;
    title: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    website?: string;
  };
  /** Professional summary (2-3 sentences) */
  summary: string;
  /** Core skills/technologies (grouped) */
  skills: {
    category: string;
    items: string[];
  }[];
  /** Professional experience (most recent first) */
  experience: ResumeExperience[];
  /** Education and certifications */
  education: ResumeEducation[];
  /** Additional sections (optional) */
  additionalSections?: {
    title: string;
    content: string;
  }[];
}

/**
 * Complete generated resume with all artifacts.
 */
export interface GeneratedResume {
  /** The structured resume content */
  content: ResumeContent;
  /** The generated markdown resume */
  markdown: string;
  /** The rendered HTML resume */
  html: string;
  /** Citations to resume chunks used */
  citations: Citation[];
  /** LLM generation usage */
  usage: GenerateResult["usage"];
  /** Estimated cost in USD */
  estimatedCostUsd: number;
}

/**
 * Error thrown when resume generation fails.
 */
export class ResumeGeneratorError extends Error {
  readonly code = "RESUME_GENERATOR_ERROR";
  readonly statusCode = 500;

  constructor(message: string) {
    super(message);
    this.name = "ResumeGeneratorError";
  }

  toJSON() {
    return {
      error: "resume_generator_error",
      message: this.message,
    };
  }
}

// ============================================================================
// System Prompt
// ============================================================================

/**
 * System instruction for the resume generation LLM.
 * 
 * Key constraints:
 * 1. NEVER invent information not present in the resume context
 * 2. Keep output to 2 pages (600-900 words total)
 * 3. Tailor content to the specific job requirements
 * 4. Use clear, ATS-friendly formatting
 */
export const RESUME_GENERATION_SYSTEM_PROMPT = `You are an expert resume writer creating a tailored 2-page professional resume for Sam Kirk.

## CRITICAL CONSTRAINTS

### 1. FACTUAL ACCURACY - NEVER INVENT
- You MUST ONLY use information explicitly present in the resume context provided
- If a skill, experience, or achievement is NOT in the context, DO NOT include it
- If asked about something not in the context, OMIT that section rather than fabricate
- Every claim must be traceable to the resume context chunks

### 2. LENGTH CONSTRAINT - 2 PAGES MAXIMUM
- Target ${TARGET_WORD_COUNT_MIN}-${TARGET_WORD_COUNT_MAX} total words
- Maximum ${MAX_WORDS_PER_SECTION} words per section
- Maximum ${MAX_BULLETS_PER_JOB} bullet points per job
- Be concise but impactful - quality over quantity

### 3. TAILORING
- Prioritize experience and skills that match the job requirements
- Reorder sections to highlight most relevant qualifications
- Adjust bullet points to emphasize relevant achievements
- Use keywords from the job posting where they match actual experience

## OUTPUT FORMAT

You MUST respond with valid JSON (no markdown code fences, just raw JSON) with this exact structure:
{
  "header": {
    "name": "Sam Kirk",
    "title": "Professional title tailored to job",
    "email": "sam@samkirk.com",
    "location": "Fremont, CA",
    "linkedIn": "linkedin.com/in/samkirk",
    "website": "samkirk.com"
  },
  "summary": "2-3 sentence professional summary tailored to the job",
  "skills": [
    { "category": "Category Name", "items": ["skill1", "skill2"] }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "dateRange": "YYYY - YYYY or YYYY - Present",
      "location": "City, State (optional)",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "year": "YYYY",
      "details": "Optional details"
    }
  ],
  "additionalSections": [
    { "title": "Section Name", "content": "Section content" }
  ]
}

## FORMATTING GUIDELINES

1. **Summary**: Start with a strong action verb or achievement. Avoid clichés like "results-driven" or "team player" unless supported by specific evidence.

2. **Experience Bullets**: 
   - Start with strong action verbs (Led, Developed, Implemented, Achieved)
   - Include quantifiable metrics when available from the context
   - Focus on accomplishments, not just responsibilities
   - Format: "Verb + what you did + result/impact"

3. **Skills**: Group logically (e.g., "Programming Languages", "Cloud & Infrastructure", "Leadership")

4. **ATS Optimization**: Use standard section headers, avoid tables/columns in text, use common job title formats

Remember: It's better to have fewer, highly relevant bullet points than many generic ones. Quality and relevance trump quantity.`;

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Build the user prompt for resume generation.
 */
export function buildResumeGenerationPrompt(
  jobText: string,
  resumeChunks: ResumeChunk[],
  jobTitle?: string,
  company?: string
): string {
  // Build resume context
  const resumeContext = resumeChunks
    .map((chunk, i) => `[CHUNK ${i + 1}: ${chunk.title}]\n${chunk.content}`)
    .join("\n\n---\n\n");

  // Build job info
  const jobHeader = jobTitle || company
    ? `Target Position: ${jobTitle || ""}${jobTitle && company ? " at " : ""}${company || ""}\n\n`
    : "";

  return `## Job Posting
${jobHeader}${jobText}

## Sam's Resume Context (SOURCE OF TRUTH)
Use ONLY information from these sections. Do NOT invent or assume anything not explicitly stated here.

${resumeContext}

## Instructions
Generate a tailored 2-page professional resume as specified. Remember:
1. ONLY use facts from the resume context above
2. Keep total content to ${TARGET_WORD_COUNT_MIN}-${TARGET_WORD_COUNT_MAX} words
3. Prioritize content most relevant to this specific job
4. Return valid JSON matching the specified structure`;
}

// ============================================================================
// Response Parsing
// ============================================================================

/**
 * Parse the LLM response into structured ResumeContent.
 */
export function parseResumeResponse(
  responseText: string
): ResumeContent {
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
    throw new ResumeGeneratorError(
      `Failed to parse LLM response as JSON: ${jsonText.slice(0, 200)}...`
    );
  }

  // Validate the structure
  if (typeof parsed !== "object" || parsed === null) {
    throw new ResumeGeneratorError("LLM response is not an object");
  }

  const obj = parsed as Record<string, unknown>;

  // Validate header
  if (typeof obj.header !== "object" || obj.header === null) {
    throw new ResumeGeneratorError("Missing or invalid header");
  }
  const header = obj.header as Record<string, unknown>;
  if (typeof header.name !== "string" || typeof header.title !== "string") {
    throw new ResumeGeneratorError("Header missing required fields (name, title)");
  }

  // Validate summary
  if (typeof obj.summary !== "string") {
    throw new ResumeGeneratorError("Missing or invalid summary");
  }

  // Validate skills
  if (!Array.isArray(obj.skills)) {
    throw new ResumeGeneratorError("Skills must be an array");
  }
  const skills = obj.skills.map((skill, i) => {
    if (typeof skill !== "object" || skill === null) {
      throw new ResumeGeneratorError(`Skill ${i} is not an object`);
    }
    const s = skill as Record<string, unknown>;
    if (typeof s.category !== "string" || !Array.isArray(s.items)) {
      throw new ResumeGeneratorError(`Skill ${i} missing category or items`);
    }
    return {
      category: s.category,
      items: s.items.filter((item): item is string => typeof item === "string"),
    };
  });

  // Validate experience
  if (!Array.isArray(obj.experience)) {
    throw new ResumeGeneratorError("Experience must be an array");
  }
  const experience: ResumeExperience[] = obj.experience.map((exp, i) => {
    if (typeof exp !== "object" || exp === null) {
      throw new ResumeGeneratorError(`Experience ${i} is not an object`);
    }
    const e = exp as Record<string, unknown>;
    if (
      typeof e.title !== "string" ||
      typeof e.company !== "string" ||
      typeof e.dateRange !== "string" ||
      !Array.isArray(e.bullets)
    ) {
      throw new ResumeGeneratorError(
        `Experience ${i} missing required fields`
      );
    }
    return {
      title: e.title,
      company: e.company,
      dateRange: e.dateRange,
      location: typeof e.location === "string" ? e.location : undefined,
      bullets: e.bullets
        .filter((b): b is string => typeof b === "string")
        .slice(0, MAX_BULLETS_PER_JOB),
    };
  });

  // Validate education
  if (!Array.isArray(obj.education)) {
    throw new ResumeGeneratorError("Education must be an array");
  }
  const education: ResumeEducation[] = obj.education.map((edu, i) => {
    if (typeof edu !== "object" || edu === null) {
      throw new ResumeGeneratorError(`Education ${i} is not an object`);
    }
    const e = edu as Record<string, unknown>;
    if (
      typeof e.degree !== "string" ||
      typeof e.institution !== "string" ||
      typeof e.year !== "string"
    ) {
      throw new ResumeGeneratorError(`Education ${i} missing required fields`);
    }
    return {
      degree: e.degree,
      institution: e.institution,
      year: e.year,
      details: typeof e.details === "string" ? e.details : undefined,
    };
  });

  // Parse additional sections (optional)
  const additionalSections = Array.isArray(obj.additionalSections)
    ? obj.additionalSections
        .filter(
          (s): s is { title: string; content: string } =>
            typeof s === "object" &&
            s !== null &&
            typeof (s as Record<string, unknown>).title === "string" &&
            typeof (s as Record<string, unknown>).content === "string"
        )
        .map((s) => ({ title: s.title, content: s.content }))
    : undefined;

  return {
    header: {
      name: header.name as string,
      title: header.title as string,
      email: typeof header.email === "string" ? header.email : undefined,
      phone: typeof header.phone === "string" ? header.phone : undefined,
      location: typeof header.location === "string" ? header.location : undefined,
      linkedIn: typeof header.linkedIn === "string" ? header.linkedIn : undefined,
      website: typeof header.website === "string" ? header.website : undefined,
    },
    summary: obj.summary as string,
    skills,
    experience,
    education,
    additionalSections,
  };
}

// ============================================================================
// Markdown Generation
// ============================================================================

/**
 * Generate a markdown resume from structured content.
 */
export function generateMarkdownResume(content: ResumeContent): string {
  const sections: string[] = [];

  // Header
  const { header } = content;
  sections.push(`# ${header.name}`);
  sections.push("");
  sections.push(`**${header.title}**`);
  sections.push("");

  // Contact info line
  const contactParts: string[] = [];
  if (header.email) contactParts.push(header.email);
  if (header.phone) contactParts.push(header.phone);
  if (header.location) contactParts.push(header.location);
  if (header.linkedIn) contactParts.push(`[LinkedIn](https://${header.linkedIn.replace(/^https?:\/\//, "")})`);
  if (header.website) contactParts.push(`[Website](https://${header.website.replace(/^https?:\/\//, "")})`);
  if (contactParts.length > 0) {
    sections.push(contactParts.join(" | "));
    sections.push("");
  }

  // Summary
  sections.push("## Professional Summary");
  sections.push("");
  sections.push(content.summary);
  sections.push("");

  // Skills
  if (content.skills.length > 0) {
    sections.push("## Skills");
    sections.push("");
    for (const skill of content.skills) {
      sections.push(`**${skill.category}:** ${skill.items.join(", ")}`);
    }
    sections.push("");
  }

  // Experience
  if (content.experience.length > 0) {
    sections.push("## Professional Experience");
    sections.push("");
    for (const exp of content.experience) {
      const locationPart = exp.location ? ` | ${exp.location}` : "";
      sections.push(`### ${exp.title} — ${exp.company}`);
      sections.push(`*${exp.dateRange}${locationPart}*`);
      sections.push("");
      for (const bullet of exp.bullets) {
        sections.push(`- ${bullet}`);
      }
      sections.push("");
    }
  }

  // Education
  if (content.education.length > 0) {
    sections.push("## Education");
    sections.push("");
    for (const edu of content.education) {
      sections.push(`**${edu.degree}** — ${edu.institution}, ${edu.year}`);
      if (edu.details) {
        sections.push(`*${edu.details}*`);
      }
    }
    sections.push("");
  }

  // Additional sections
  if (content.additionalSections && content.additionalSections.length > 0) {
    for (const section of content.additionalSections) {
      sections.push(`## ${section.title}`);
      sections.push("");
      sections.push(section.content);
      sections.push("");
    }
  }

  return sections.join("\n").trim();
}

/**
 * Count words in the generated resume.
 */
export function countResumeWords(content: ResumeContent): number {
  const countWordsInString = (str: string): number =>
    str.split(/\s+/).filter((w) => w.length > 0).length;

  let total = 0;

  // Header
  total += countWordsInString(content.header.name);
  total += countWordsInString(content.header.title);

  // Summary
  total += countWordsInString(content.summary);

  // Skills
  for (const skill of content.skills) {
    total += countWordsInString(skill.category);
    for (const item of skill.items) {
      total += countWordsInString(item);
    }
  }

  // Experience
  for (const exp of content.experience) {
    total += countWordsInString(exp.title);
    total += countWordsInString(exp.company);
    for (const bullet of exp.bullets) {
      total += countWordsInString(bullet);
    }
  }

  // Education
  for (const edu of content.education) {
    total += countWordsInString(edu.degree);
    total += countWordsInString(edu.institution);
    if (edu.details) {
      total += countWordsInString(edu.details);
    }
  }

  // Additional sections
  if (content.additionalSections) {
    for (const section of content.additionalSections) {
      total += countWordsInString(section.title);
      total += countWordsInString(section.content);
    }
  }

  return total;
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
 * Generate a mock resume for E2E testing.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateMockResume(_jobText: string): GeneratedResume {
  console.log("[E2E] Generating mock resume for testing");

  const mockContent: ResumeContent = {
    header: {
      name: "Sam Kirk",
      title: "E2E Test Professional",
      email: "sam@samkirk.com",
      location: "Fremont, CA",
    },
    summary: "[E2E Mock] This is a mock resume generated for E2E testing.",
    skills: [
      {
        category: "Testing",
        items: ["E2E Testing", "Mock Data", "Automated Testing"],
      },
    ],
    experience: [
      {
        title: "Test Engineer",
        company: "Test Company",
        dateRange: "2020 - Present",
        bullets: [
          "[E2E Mock] Developed automated test suites",
          "[E2E Mock] Improved test coverage by 50%",
        ],
      },
    ],
    education: [
      {
        degree: "Test Degree",
        institution: "Test University",
        year: "2020",
      },
    ],
  };

  const mockMarkdown = `# Sam Kirk

**E2E Test Professional**

sam@samkirk.com | Fremont, CA

## Professional Summary

[E2E Mock] This is a mock resume generated for E2E testing.

## Skills

**Testing:** E2E Testing, Mock Data, Automated Testing

## Professional Experience

### Test Engineer — Test Company
*2020 - Present*

- [E2E Mock] Developed automated test suites
- [E2E Mock] Improved test coverage by 50%

## Education

**Test Degree** — Test University, 2020
`;

  const mockHtml = `<!DOCTYPE html>
<html>
<head><title>Resume - Sam Kirk (E2E Mock)</title></head>
<body>
<h1>Sam Kirk</h1>
<p><strong>E2E Test Professional</strong></p>
<p>This is a mock resume generated for E2E testing.</p>
</body>
</html>`;

  return {
    content: mockContent,
    markdown: mockMarkdown,
    html: mockHtml,
    citations: [],
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    estimatedCostUsd: 0,
  };
}

// ============================================================================
// Main Resume Generation
// ============================================================================

/**
 * Generate a complete tailored resume.
 *
 * This function:
 * 1. Loads resume chunks for context
 * 2. Builds the generation prompt
 * 3. Calls the LLM to generate the resume
 * 4. Parses and validates the response
 * 5. Generates markdown and HTML outputs
 * 6. Creates citations
 *
 * @param jobIngestion - The ingested job posting
 * @param jobTitle - Optional extracted job title
 * @param company - Optional extracted company name
 * @returns The complete generated resume
 *
 * @throws ResumeGeneratorError if generation fails
 * @throws SpendCapError if monthly spend cap is exceeded
 */
export async function generateResume(
  jobIngestion: JobIngestionResult,
  jobTitle?: string,
  company?: string
): Promise<GeneratedResume> {
  // 1. Load resume chunks
  const context = await getResumeContext({ format: "detailed" });

  if (context.chunkCount === 0) {
    // In E2E test mode, return a mock resume instead of throwing
    if (isE2ETestingEnabled()) {
      return generateMockResume(jobIngestion.text);
    }
    throw new ResumeGeneratorError(
      "No resume chunks available. Please upload a resume first."
    );
  }

  // 2. Build the prompt
  const prompt = buildResumeGenerationPrompt(
    jobIngestion.text,
    context.usedChunks,
    jobTitle,
    company
  );

  // 3. Call the LLM
  const llmResult = await generateContent(prompt, {
    systemInstruction: RESUME_GENERATION_SYSTEM_PROMPT,
    temperature: 0.4, // Slightly higher than fit analysis for more creative writing
    maxOutputTokens: 4096,
  });

  // 4. Parse the response
  const content = parseResumeResponse(llmResult.text);

  // 5. Validate word count (warn but don't fail)
  const wordCount = countResumeWords(content);
  if (wordCount > TARGET_WORD_COUNT_MAX * 1.2) {
    console.warn(
      `Resume word count (${wordCount}) exceeds target max (${TARGET_WORD_COUNT_MAX})`
    );
  }

  // 6. Generate markdown resume
  const baseMarkdown = generateMarkdownResume(content);

  // 7. Generate citations
  const citations = generateCitationsFromChunks(context.usedChunks);

  // 8. Append citations to markdown
  const markdownWithCitations = appendCitationsToMarkdown(baseMarkdown, citations);

  // 9. Render HTML
  const html = renderMarkdown(markdownWithCitations, {
    fullDocument: true,
    title: `Resume - ${content.header.name}`,
    sanitize: true,
  });

  return {
    content,
    markdown: markdownWithCitations,
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
 * Store resume artifacts to GCS and update the submission.
 *
 * @param submissionId - The submission ID
 * @param resume - The generated resume
 * @param jobIngestion - The original job ingestion result
 */
export async function storeResumeArtifacts(
  submissionId: string,
  resume: GeneratedResume,
  jobIngestion: JobIngestionResult
): Promise<void> {
  const bucket = getPrivateBucket();

  // Store the markdown resume
  const mdPath = PrivatePaths.submissionOutput(submissionId, "resume.md");
  await writeFile(bucket, mdPath, resume.markdown, "text/markdown; charset=utf-8");

  // Store the HTML resume
  const htmlPath = PrivatePaths.submissionOutput(submissionId, "resume.html");
  await writeFile(bucket, htmlPath, resume.html, "text/html; charset=utf-8");

  // Store the job input
  const inputPath = PrivatePaths.submissionInput(submissionId, "job-text.txt");
  await writeFile(bucket, inputPath, jobIngestion.text, "text/plain; charset=utf-8");

  // Store the extracted data (resume content structure)
  const extractedPath = PrivatePaths.submissionExtracted(submissionId);
  await writeFile(
    bucket,
    extractedPath,
    JSON.stringify(
      {
        jobSource: jobIngestion.source,
        jobSourceIdentifier: jobIngestion.sourceIdentifier,
        resumeHeader: resume.content.header,
        resumeSummary: resume.content.summary,
        skillsCount: resume.content.skills.length,
        experienceCount: resume.content.experience.length,
        educationCount: resume.content.education.length,
      },
      null,
      2
    ),
    "application/json; charset=utf-8"
  );

  // Complete the submission
  await completeSubmission(submissionId, {
    extracted: {
      jobSource: jobIngestion.source,
      jobSourceIdentifier: jobIngestion.sourceIdentifier,
      targetTitle: resume.content.header.title,
    },
    outputs: {
      wordCount: countResumeWords(resume.content),
      experienceEntries: resume.content.experience.length,
      skillCategories: resume.content.skills.length,
      resumeMdPath: mdPath,
      resumeHtmlPath: htmlPath,
      inputTokens: resume.usage.inputTokens,
      outputTokens: resume.usage.outputTokens,
      estimatedCostUsd: resume.estimatedCostUsd,
    },
    citations: resume.citations,
  });
}

/**
 * Generate a resume and store all artifacts.
 *
 * This is the main entry point for the resume generation flow.
 * It combines generation with artifact storage.
 *
 * @param submissionId - The submission ID
 * @param jobIngestion - The ingested job posting
 * @param jobTitle - Optional extracted job title
 * @param company - Optional extracted company name
 * @returns The generated resume
 */
export async function generateAndStoreResume(
  submissionId: string,
  jobIngestion: JobIngestionResult,
  jobTitle?: string,
  company?: string
): Promise<GeneratedResume> {
  // Update submission to "generating" status
  await updateSubmission(submissionId, {
    status: "in_progress",
    inputs: {
      jobSource: jobIngestion.source,
      jobSourceIdentifier: jobIngestion.sourceIdentifier,
      jobCharacterCount: jobIngestion.characterCount,
      jobWordCount: jobIngestion.wordCount,
    },
  });

  try {
    // Generate the resume
    const resume = await generateResume(jobIngestion, jobTitle, company);

    // Store artifacts and complete submission
    await storeResumeArtifacts(submissionId, resume, jobIngestion);

    return resume;
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
