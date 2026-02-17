/**
 * E2E tests with real Vertex AI for Fit, Resume, and Interview tools.
 *
 * Run with: cd web && npm run test:e2e:real
 *
 * This script:
 * 1. Verifies Vertex AI API is enabled (exits with instructions if not)
 * 2. Auto-seeds resume data if not already present in GCS/Firestore
 * 3. Tests the Fit tool flow with real Vertex AI
 * 4. Tests the Resume tool flow with real Vertex AI
 * 5. Tests the Interview tool flow with real Vertex AI
 * 6. Validates response structures
 * 7. Cleans up test data
 *
 * Note: Incurs real Vertex AI costs (~$0.03-0.15 per run)
 *
 * Prerequisites:
 * - GCP credentials set up (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
 * - web/.env.local file with required environment variables
 * - Vertex AI API enabled (gcloud services enable aiplatform.googleapis.com)
 */

import { config } from "dotenv";
import { resolve } from "path";
import { randomBytes } from "crypto";
import { spawnSync } from "child_process";

// Load .env.local from the web directory
config({ path: resolve(__dirname, "../.env.local") });

import { Firestore, Timestamp } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { VertexAI } from "@google-cloud/vertexai";
import { z } from "zod";

// ============================================================================
// Configuration
// ============================================================================

const RESUME_INDEX_COLLECTION = "resumeIndex";
const RESUME_INDEX_DOC = "current";
const RESUME_CHUNKS_COLLECTION = "resumeChunks";
const SESSIONS_COLLECTION = "sessions";
const SUBMISSIONS_COLLECTION = "submissions";
const TEST_PREFIX = "_e2e_real_";

// Sample job posting for testing
const SAMPLE_JOB_POSTING = `
Senior Software Engineer - AI Platform

Company: TechCorp Inc
Location: Remote (US)

About the Role:
We're looking for a Senior Software Engineer to join our AI Platform team. You'll be 
responsible for building and scaling our machine learning infrastructure.

Requirements:
- 5+ years of software engineering experience
- Strong proficiency in TypeScript and Python
- Experience with cloud platforms (GCP or AWS)
- Familiarity with machine learning frameworks (TensorFlow, PyTorch)
- Experience with containerization (Docker, Kubernetes)

Nice to have:
- Experience with LLMs and RAG systems
- Background in distributed systems
- Contributions to open source projects

What you'll do:
- Design and implement scalable ML pipelines
- Work with data scientists to productionize models
- Build APIs and services for internal teams
- Mentor junior engineers

Benefits:
- Competitive salary and equity
- Full remote work
- Unlimited PTO
- Health, dental, and vision insurance

TechCorp is an equal opportunity employer.
`.trim();

// Environment schema
const envSchema = z.object({
  GCP_PROJECT_ID: z.string().min(1),
  GCS_PRIVATE_BUCKET: z.string().min(1),
  VERTEX_AI_LOCATION: z.string().min(1),
  VERTEX_AI_MODEL: z.string().min(1),
});

// ============================================================================
// Logging
// ============================================================================

function log(message: string, success?: boolean): void {
  const prefix = success === true ? "✓" : success === false ? "✗" : "→";
  console.log(`${prefix} ${message}`);
}

// ============================================================================
// Types
// ============================================================================

interface ResumeChunk {
  chunkId: string;
  title: string;
  sourceRef: string;
  content: string;
}

interface ExtractedJobFields {
  title: string | null;
  company: string | null;
  seniority: string;
  seniorityConfirmed: boolean;
  locationType: string;
  officeLocation: string | null;
  onsiteDaysPerWeek: number | null;
  estimatedCommuteMinutes: number | null;
  locationFitStatus: string;
  locationConfirmed: boolean;
  mustHaveSkills: string[];
  mustHaveSkillsConfirmed: boolean;
  niceToHaveSkills: string[];
}

interface CategoryAnalysis {
  name: string;
  score: string;
  rationale: string;
  citations: string[];
}

interface FitAnalysis {
  overallScore: string;
  recommendation: string;
  categories: CategoryAnalysis[];
  unknowns: string[];
}

interface ResumeContent {
  header: {
    name: string;
    title: string;
    email?: string;
    location?: string;
  };
  summary: string;
  skills: Array<{ category: string; items: string[] }>;
  experience: Array<{
    title: string;
    company: string;
    dateRange: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

// ============================================================================
// Job Field Extraction (simplified for E2E test)
// ============================================================================

function extractJobFields(jobText: string): ExtractedJobFields {
  const textLower = jobText.toLowerCase();

  // Extract title (first line that looks like a title)
  const lines = jobText.split("\n").filter((l) => l.trim());
  let title: string | null = null;
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    if (trimmed.length > 10 && trimmed.length < 100 && !trimmed.includes(":")) {
      title = trimmed;
      break;
    }
  }

  // Extract company
  let company: string | null = null;
  const companyMatch = /company:\s*(.+)/i.exec(jobText);
  if (companyMatch) {
    company = companyMatch[1].trim();
  }

  // Detect seniority
  let seniority = "unknown";
  if (/\b(senior|sr\.?)\b/i.test(textLower)) seniority = "senior";
  else if (/\b(staff)\b/i.test(textLower)) seniority = "staff";
  else if (/\b(principal)\b/i.test(textLower)) seniority = "principal";
  else if (/\b(junior|jr\.?)\b/i.test(textLower)) seniority = "entry";
  else if (/\b(mid[-\s]?level)\b/i.test(textLower)) seniority = "mid";

  // Detect location type
  let locationType = "unknown";
  if (/\b(fully\s+remote|100%\s*remote|remote\s*first)\b/i.test(textLower)) {
    locationType = "fully_remote";
  } else if (/\bremote\b/i.test(textLower)) {
    locationType = "fully_remote";
  } else if (/\bhybrid\b/i.test(textLower)) {
    locationType = "hybrid";
  } else if (/\b(on[-\s]?site|in[-\s]?office)\b/i.test(textLower)) {
    locationType = "onsite";
  }

  // Extract skills (simplified)
  const skillsSection = jobText.match(/requirements?:(.+?)(?=nice|what|benefits|$)/is);
  const mustHaveSkills: string[] = [];
  if (skillsSection) {
    const skills = ["TypeScript", "Python", "GCP", "AWS", "TensorFlow", "PyTorch", "Docker", "Kubernetes"];
    for (const skill of skills) {
      if (skillsSection[1].toLowerCase().includes(skill.toLowerCase())) {
        mustHaveSkills.push(skill);
      }
    }
  }

  return {
    title,
    company,
    seniority,
    seniorityConfirmed: false,
    locationType,
    officeLocation: null,
    onsiteDaysPerWeek: null,
    estimatedCommuteMinutes: null,
    locationFitStatus: locationType === "fully_remote" ? "acceptable" : "unknown",
    locationConfirmed: false,
    mustHaveSkills,
    mustHaveSkillsConfirmed: false,
    niceToHaveSkills: [],
  };
}

// ============================================================================
// Fit Tool Test
// ============================================================================

async function testFitTool(
  firestore: Firestore,
  privateBucket: ReturnType<Storage["bucket"]>,
  vertexAI: VertexAI,
  modelName: string,
  resumeChunks: ResumeChunk[],
  cleanupTasks: Array<() => Promise<void>>
): Promise<void> {
  console.log("\n" + "=".repeat(50));
  console.log("=== Testing Fit Tool ===");
  console.log("=".repeat(50) + "\n");

  const testSessionId = `${TEST_PREFIX}fit_session_${randomBytes(8).toString("hex")}`;
  const testSubmissionId = `${TEST_PREFIX}fit_submission_${randomBytes(8).toString("hex")}`;

  // Create test session
  log("Creating test session...");
  const now = Date.now();
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;
  const sessionDocRef = firestore.collection(SESSIONS_COLLECTION).doc(testSessionId);

  await sessionDocRef.set({
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + sessionTtlMs),
    ipHash: "e2e_test_ip_hash",
    captchaPassedAt: Timestamp.fromMillis(now),
  });
  cleanupTasks.push(async () => {
    await sessionDocRef.delete();
    log("Fit test session cleaned up", true);
  });
  log("Test session created", true);

  // Create test submission
  log("Creating test submission...");
  const submissionTtlMs = 90 * 24 * 60 * 60 * 1000;
  const submissionDocRef = firestore.collection(SUBMISSIONS_COLLECTION).doc(testSubmissionId);

  await submissionDocRef.set({
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + submissionTtlMs),
    tool: "fit",
    status: "processing",
    sessionId: testSessionId,
    inputs: {
      mode: "paste",
      sourceIdentifier: "e2e-test-job-posting",
      characterCount: SAMPLE_JOB_POSTING.length,
      wordCount: SAMPLE_JOB_POSTING.split(/\s+/).length,
    },
  });
  cleanupTasks.push(async () => {
    const [files] = await privateBucket.getFiles({ prefix: `submissions/${testSubmissionId}/` });
    for (const file of files) {
      await file.delete();
    }
    await submissionDocRef.delete();
    log("Fit test submission cleaned up", true);
  });
  log("Test submission created", true);

  // Extract job fields
  log("Extracting job fields...");
  const extracted = extractJobFields(SAMPLE_JOB_POSTING);
  log(`  Title: ${extracted.title}`, true);
  log(`  Company: ${extracted.company}`);
  log(`  Seniority: ${extracted.seniority}`);
  log(`  Location: ${extracted.locationType}`);
  log(`  Skills: ${extracted.mustHaveSkills.join(", ") || "none detected"}`);

  // Build the prompt
  log("Building LLM prompt...");
  const resumeContext = resumeChunks
    .map((chunk) => `### ${chunk.title}\n${chunk.content}`)
    .join("\n\n");

  const fitPrompt = `You are an expert career advisor helping Sam Kirk evaluate job fit.

## Sam's Resume
${resumeContext}

## Job Posting
${SAMPLE_JOB_POSTING}

## Extracted Information
- Title: ${extracted.title || "Unknown"}
- Company: ${extracted.company || "Unknown"}
- Seniority: ${extracted.seniority}
- Location Type: ${extracted.locationType}
- Required Skills: ${extracted.mustHaveSkills.join(", ") || "None specified"}

## Task
Analyze how well Sam fits this role. Respond with JSON only (no markdown):

{
  "overallScore": "Well" | "Partial" | "Poor",
  "recommendation": "Brief recommendation in 1-2 sentences",
  "categories": [
    {
      "name": "Technical Skills",
      "score": "Well" | "Partial" | "Poor",
      "rationale": "Explanation",
      "citations": ["chunk titles used"]
    },
    {
      "name": "Experience Level",
      "score": "Well" | "Partial" | "Poor",
      "rationale": "Explanation",
      "citations": ["chunk titles used"]
    },
    {
      "name": "Location Fit",
      "score": "Well" | "Partial" | "Poor",
      "rationale": "Explanation",
      "citations": []
    }
  ],
  "unknowns": ["Any aspects that couldn't be determined"]
}`;

  log(`Prompt: ${fitPrompt.length} characters`, true);

  // Call Vertex AI
  log("Calling Vertex AI (this may take 10-30 seconds)...");
  const model = vertexAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });

  const startTime = Date.now();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fitPrompt }] }],
  });

  const elapsed = Date.now() - startTime;
  log(`Response received in ${elapsed}ms`, true);

  // Parse response
  const response = result.response;
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates in Vertex AI response");
  }

  const responseText = response.candidates[0].content.parts
    .filter((p): p is { text: string } => "text" in p)
    .map((p) => p.text)
    .join("");

  log(`Response: ${responseText.length} characters`);

  // Parse JSON
  log("Parsing response...");
  let cleanJson = responseText.trim();
  if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
  if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
  if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
  cleanJson = cleanJson.trim();

  const analysis: FitAnalysis = JSON.parse(cleanJson);
  log("Response parsed successfully", true);

  // Validate response structure
  log("Validating response structure...");
  if (!["Well", "Partial", "Poor"].includes(analysis.overallScore)) {
    throw new Error(`Invalid overallScore: ${analysis.overallScore}`);
  }
  if (typeof analysis.recommendation !== "string" || analysis.recommendation.length === 0) {
    throw new Error("Missing or invalid recommendation");
  }
  if (!Array.isArray(analysis.categories) || analysis.categories.length === 0) {
    throw new Error("Missing or invalid categories");
  }
  for (const cat of analysis.categories) {
    if (!cat.name || !cat.score || !cat.rationale) {
      throw new Error(`Invalid category: ${JSON.stringify(cat)}`);
    }
    if (!["Well", "Partial", "Poor"].includes(cat.score)) {
      throw new Error(`Invalid category score: ${cat.score}`);
    }
  }
  log("Response structure valid", true);

  // Log usage metadata
  const usageMetadata = response.usageMetadata;
  if (usageMetadata) {
    const inputTokens = usageMetadata.promptTokenCount ?? 0;
    const outputTokens = usageMetadata.candidatesTokenCount ?? 0;
    const estimatedCost = (inputTokens / 1000) * 0.00125 + (outputTokens / 1000) * 0.00375;
    log(`Token usage: ${inputTokens} input, ${outputTokens} output`);
    log(`Estimated cost: $${estimatedCost.toFixed(4)}`);
  }

  // Store report in GCS
  log("Storing report artifacts...");
  const reportMd = `# Fit Analysis Report

## Summary
**Overall Score: ${analysis.overallScore}**

${analysis.recommendation}

## Category Analysis
${analysis.categories.map((cat) => `
### ${cat.name}
**Score: ${cat.score}**

${cat.rationale}
${cat.citations.length > 0 ? `\nCitations: ${cat.citations.join(", ")}` : ""}
`).join("\n")}

## Unknowns
${analysis.unknowns.length > 0 ? analysis.unknowns.map((u) => `- ${u}`).join("\n") : "None"}

---
Generated by E2E test at ${new Date().toISOString()}
`;

  const artifactPrefix = `submissions/${testSubmissionId}/`;
  await privateBucket.file(`${artifactPrefix}output/report.md`).save(reportMd, {
    contentType: "text/markdown; charset=utf-8",
    resumable: false,
  });
  await privateBucket.file(`${artifactPrefix}output/analysis.json`).save(JSON.stringify(analysis, null, 2), {
    contentType: "application/json; charset=utf-8",
    resumable: false,
  });
  log("Report artifacts stored", true);

  // Update submission status
  await submissionDocRef.update({
    status: "complete",
    extracted: {
      seniority: extracted.seniority,
      location: extracted.locationType,
      mustHaves: extracted.mustHaveSkills,
    },
    outputs: {
      fitScore: analysis.overallScore,
      rationale: analysis.recommendation,
      reportPath: `${artifactPrefix}output/report.md`,
    },
    completedAt: Timestamp.now(),
  });
  log("Submission updated to complete", true);

  // Print results
  console.log("\n--- Fit Analysis Results ---\n");
  console.log(`Overall Score: ${analysis.overallScore}`);
  console.log(`Recommendation: ${analysis.recommendation}`);
  console.log("\nCategories:");
  for (const cat of analysis.categories) {
    console.log(`  ${cat.name}: ${cat.score}`);
    console.log(`    ${cat.rationale}`);
  }
  if (analysis.unknowns.length > 0) {
    console.log("\nUnknowns:");
    for (const unknown of analysis.unknowns) {
      console.log(`  - ${unknown}`);
    }
  }

  log("\nFit tool test passed!", true);
}

// ============================================================================
// Resume Tool Test
// ============================================================================

async function testResumeTool(
  firestore: Firestore,
  privateBucket: ReturnType<Storage["bucket"]>,
  vertexAI: VertexAI,
  modelName: string,
  resumeChunks: ResumeChunk[],
  cleanupTasks: Array<() => Promise<void>>
): Promise<void> {
  console.log("\n" + "=".repeat(50));
  console.log("=== Testing Resume Tool ===");
  console.log("=".repeat(50) + "\n");

  const testSessionId = `${TEST_PREFIX}resume_session_${randomBytes(8).toString("hex")}`;
  const testSubmissionId = `${TEST_PREFIX}resume_submission_${randomBytes(8).toString("hex")}`;

  // Create test session
  log("Creating test session...");
  const now = Date.now();
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;
  const sessionDocRef = firestore.collection(SESSIONS_COLLECTION).doc(testSessionId);

  await sessionDocRef.set({
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + sessionTtlMs),
    ipHash: "e2e_test_ip_hash",
    captchaPassedAt: Timestamp.fromMillis(now),
  });
  cleanupTasks.push(async () => {
    await sessionDocRef.delete();
    log("Resume test session cleaned up", true);
  });
  log("Test session created", true);

  // Create test submission
  log("Creating test submission...");
  const submissionTtlMs = 90 * 24 * 60 * 60 * 1000;
  const submissionDocRef = firestore.collection(SUBMISSIONS_COLLECTION).doc(testSubmissionId);

  await submissionDocRef.set({
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + submissionTtlMs),
    tool: "resume",
    status: "processing",
    sessionId: testSessionId,
    inputs: {
      mode: "paste",
      sourceIdentifier: "e2e-test-job-posting",
      characterCount: SAMPLE_JOB_POSTING.length,
      wordCount: SAMPLE_JOB_POSTING.split(/\s+/).length,
    },
  });
  cleanupTasks.push(async () => {
    const [files] = await privateBucket.getFiles({ prefix: `submissions/${testSubmissionId}/` });
    for (const file of files) {
      await file.delete();
    }
    await submissionDocRef.delete();
    log("Resume test submission cleaned up", true);
  });
  log("Test submission created", true);

  // Build the prompt (matching resume-generator.ts system prompt)
  log("Building LLM prompt...");
  const resumeContext = resumeChunks
    .map((chunk, i) => `[CHUNK ${i + 1}: ${chunk.title}]\n${chunk.content}`)
    .join("\n\n---\n\n");

  const resumePrompt = `You are an expert resume writer creating a tailored 2-page professional resume for Sam Kirk.

## CRITICAL CONSTRAINTS

### 1. FACTUAL ACCURACY - NEVER INVENT
- You MUST ONLY use information explicitly present in the resume context provided
- If a skill, experience, or achievement is NOT in the context, DO NOT include it
- If asked about something not in the context, OMIT that section rather than fabricate
- Every claim must be traceable to the resume context chunks

### 2. LENGTH CONSTRAINT - 2 PAGES MAXIMUM
- Target 600-900 total words
- Maximum 250 words per section
- Maximum 5 bullet points per job
- Be concise but impactful - quality over quantity

### 3. TAILORING
- Prioritize experience and skills that match the job requirements
- Reorder sections to highlight most relevant qualifications
- Adjust bullet points to emphasize relevant achievements
- Use keywords from the job posting where they match actual experience

## OUTPUT FORMAT

You MUST respond with valid JSON only (no markdown code fences):
{
  "header": {
    "name": "Sam Kirk",
    "title": "Professional title tailored to job",
    "email": "sam@samkirk.com",
    "location": "Fremont, CA"
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
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "year": "YYYY"
    }
  ]
}

## Job Posting
${SAMPLE_JOB_POSTING}

## Sam's Resume Context (SOURCE OF TRUTH)
Use ONLY information from these sections. Do NOT invent or assume anything not explicitly stated here.

${resumeContext}

## Instructions
Generate a tailored 2-page professional resume as specified. Remember:
1. ONLY use facts from the resume context above
2. Keep total content to 600-900 words
3. Prioritize content most relevant to this specific job
4. Return valid JSON matching the specified structure`;

  log(`Prompt: ${resumePrompt.length} characters`, true);

  // Call Vertex AI
  log("Calling Vertex AI (this may take 10-30 seconds)...");
  const model = vertexAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  });

  const startTime = Date.now();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: resumePrompt }] }],
  });

  const elapsed = Date.now() - startTime;
  log(`Response received in ${elapsed}ms`, true);

  // Parse response
  const response = result.response;
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates in Vertex AI response");
  }

  const responseText = response.candidates[0].content.parts
    .filter((p): p is { text: string } => "text" in p)
    .map((p) => p.text)
    .join("");

  log(`Response: ${responseText.length} characters`);

  // Parse JSON
  log("Parsing response...");
  let cleanJson = responseText.trim();
  if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
  if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
  if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
  cleanJson = cleanJson.trim();

  const resumeContent: ResumeContent = JSON.parse(cleanJson);
  log("Response parsed successfully", true);

  // Validate response structure
  log("Validating response structure...");
  if (!resumeContent.header || typeof resumeContent.header.name !== "string") {
    throw new Error("Missing or invalid header");
  }
  if (typeof resumeContent.summary !== "string" || resumeContent.summary.length === 0) {
    throw new Error("Missing or invalid summary");
  }
  if (!Array.isArray(resumeContent.skills)) {
    throw new Error("Missing or invalid skills");
  }
  if (!Array.isArray(resumeContent.experience) || resumeContent.experience.length === 0) {
    throw new Error("Missing or invalid experience");
  }
  for (const exp of resumeContent.experience) {
    if (!exp.title || !exp.company || !exp.dateRange || !Array.isArray(exp.bullets)) {
      throw new Error(`Invalid experience entry: ${JSON.stringify(exp)}`);
    }
  }
  if (!Array.isArray(resumeContent.education)) {
    throw new Error("Missing or invalid education");
  }
  log("Response structure valid", true);

  // Log usage metadata
  const usageMetadata = response.usageMetadata;
  if (usageMetadata) {
    const inputTokens = usageMetadata.promptTokenCount ?? 0;
    const outputTokens = usageMetadata.candidatesTokenCount ?? 0;
    const estimatedCost = (inputTokens / 1000) * 0.00125 + (outputTokens / 1000) * 0.00375;
    log(`Token usage: ${inputTokens} input, ${outputTokens} output`);
    log(`Estimated cost: $${estimatedCost.toFixed(4)}`);
  }

  // Generate markdown resume
  const resumeMd = `# ${resumeContent.header.name}

**${resumeContent.header.title}**

${resumeContent.header.email || ""} | ${resumeContent.header.location || ""}

## Professional Summary

${resumeContent.summary}

## Skills

${resumeContent.skills.map((s) => `**${s.category}:** ${s.items.join(", ")}`).join("\n")}

## Professional Experience

${resumeContent.experience.map((exp) => `### ${exp.title} — ${exp.company}
*${exp.dateRange}*

${exp.bullets.map((b) => `- ${b}`).join("\n")}
`).join("\n")}

## Education

${resumeContent.education.map((edu) => `**${edu.degree}** — ${edu.institution}, ${edu.year}`).join("\n")}

---
Generated by E2E test at ${new Date().toISOString()}
`;

  // Store resume in GCS
  log("Storing resume artifacts...");
  const artifactPrefix = `submissions/${testSubmissionId}/`;
  await privateBucket.file(`${artifactPrefix}output/resume.md`).save(resumeMd, {
    contentType: "text/markdown; charset=utf-8",
    resumable: false,
  });
  await privateBucket.file(`${artifactPrefix}output/resume.json`).save(JSON.stringify(resumeContent, null, 2), {
    contentType: "application/json; charset=utf-8",
    resumable: false,
  });
  log("Resume artifacts stored", true);

  // Update submission status
  await submissionDocRef.update({
    status: "complete",
    extracted: {
      targetTitle: resumeContent.header.title,
    },
    outputs: {
      experienceCount: resumeContent.experience.length,
      skillsCount: resumeContent.skills.length,
      resumePath: `${artifactPrefix}output/resume.md`,
    },
    completedAt: Timestamp.now(),
  });
  log("Submission updated to complete", true);

  // Count words
  const wordCount = resumeMd.split(/\s+/).filter((w) => w.length > 0).length;

  // Print results
  console.log("\n--- Resume Generation Results ---\n");
  console.log(`Name: ${resumeContent.header.name}`);
  console.log(`Title: ${resumeContent.header.title}`);
  console.log(`Summary: ${resumeContent.summary.slice(0, 100)}...`);
  console.log(`\nSkill Categories: ${resumeContent.skills.length}`);
  for (const skill of resumeContent.skills) {
    console.log(`  ${skill.category}: ${skill.items.length} items`);
  }
  console.log(`\nExperience Entries: ${resumeContent.experience.length}`);
  for (const exp of resumeContent.experience) {
    console.log(`  ${exp.title} at ${exp.company} (${exp.bullets.length} bullets)`);
  }
  console.log(`\nEducation Entries: ${resumeContent.education.length}`);
  console.log(`\nTotal Word Count: ~${wordCount} words`);

  log("\nResume tool test passed!", true);
}

// ============================================================================
// Interview Tool Test
// ============================================================================

async function testInterviewTool(
  firestore: Firestore,
  privateBucket: ReturnType<Storage["bucket"]>,
  vertexAI: VertexAI,
  modelName: string,
  resumeChunks: ResumeChunk[],
  cleanupTasks: Array<() => Promise<void>>
): Promise<void> {
  console.log("\n" + "=".repeat(50));
  console.log("=== Testing Interview Tool ===");
  console.log("=".repeat(50) + "\n");

  const testSessionId = `${TEST_PREFIX}interview_session_${randomBytes(8).toString("hex")}`;
  const testSubmissionId = `${TEST_PREFIX}interview_submission_${randomBytes(8).toString("hex")}`;
  const testConversationId = `${TEST_PREFIX}conv_${randomBytes(8).toString("hex")}`;

  // Create test session
  log("Creating test session...");
  const now = Date.now();
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;
  const sessionDocRef = firestore.collection(SESSIONS_COLLECTION).doc(testSessionId);

  await sessionDocRef.set({
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + sessionTtlMs),
    ipHash: "e2e_test_ip_hash",
    captchaPassedAt: Timestamp.fromMillis(now),
  });
  cleanupTasks.push(async () => {
    await sessionDocRef.delete();
    log("Interview test session cleaned up", true);
  });
  log("Test session created", true);

  // Create test submission
  log("Creating test submission...");
  const submissionTtlMs = 90 * 24 * 60 * 60 * 1000;
  const submissionDocRef = firestore.collection(SUBMISSIONS_COLLECTION).doc(testSubmissionId);

  await submissionDocRef.set({
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + submissionTtlMs),
    tool: "interview",
    status: "processing",
    sessionId: testSessionId,
    inputs: {
      conversationId: testConversationId,
      startedAt: new Date().toISOString(),
    },
  });
  cleanupTasks.push(async () => {
    const [files] = await privateBucket.getFiles({ prefix: `submissions/${testSubmissionId}/` });
    for (const file of files) {
      await file.delete();
    }
    await submissionDocRef.delete();
    log("Interview test submission cleaned up", true);
  });
  log("Test submission created", true);

  // Build interview system prompt
  log("Building interview system prompt...");
  const resumeContext = resumeChunks
    .map((chunk) => `### ${chunk.title}\n${chunk.content}`)
    .join("\n\n");

  const systemPrompt = `You are a professional career interview assistant representing Sam Kirk. Your role is to answer questions about Sam Kirk's career, skills, experience, and professional background.

## YOUR KNOWLEDGE BASE

You have access to Sam Kirk's resume and professional information:

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

6. **First-Person Perspective**: When discussing Sam Kirk's experience, speak as if you ARE Sam Kirk (use "I", "my", etc.).`;

  log(`System prompt: ${systemPrompt.length} characters`, true);

  // Simulate a multi-turn conversation
  const conversation: Array<{ role: "user" | "model"; text: string }> = [];
  const testQuestions = [
    "What programming languages do you know?",
    "Tell me about your most recent role.",
  ];

  const model = vertexAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
    systemInstruction: systemPrompt,
  });

  const responses: string[] = [];

  for (const question of testQuestions) {
    log(`\nSending question: "${question}"`);

    // Build conversation history for the model
    const contents = conversation.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // Add current question
    contents.push({
      role: "user",
      parts: [{ text: question }],
    });

    // Call Vertex AI
    log("Calling Vertex AI...");
    const startTime = Date.now();
    const result = await model.generateContent({ contents });
    const elapsed = Date.now() - startTime;
    log(`Response received in ${elapsed}ms`, true);

    // Parse response
    const response = result.response;
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates in Vertex AI response");
    }

    const responseText = response.candidates[0].content.parts
      .filter((p): p is { text: string } => "text" in p)
      .map((p) => p.text)
      .join("");

    log(`Response: ${responseText.length} characters`);
    responses.push(responseText);

    // Add to conversation history
    conversation.push({ role: "user", text: question });
    conversation.push({ role: "model", text: responseText });

    // Log usage
    const usageMetadata = response.usageMetadata;
    if (usageMetadata) {
      const inputTokens = usageMetadata.promptTokenCount ?? 0;
      const outputTokens = usageMetadata.candidatesTokenCount ?? 0;
      log(`Token usage: ${inputTokens} input, ${outputTokens} output`);
    }
  }

  // Generate transcript
  log("\nGenerating transcript...");
  const transcriptLines: string[] = [];
  transcriptLines.push("# Interview Transcript");
  transcriptLines.push("");
  transcriptLines.push("**Candidate:** Sam Kirk");
  transcriptLines.push(`**Date:** ${new Date().toLocaleDateString()}`);
  transcriptLines.push(`**Total Messages:** ${conversation.length}`);
  transcriptLines.push("");
  transcriptLines.push("---");
  transcriptLines.push("");

  for (let i = 0; i < conversation.length; i++) {
    const msg = conversation[i];
    const roleLabel = msg.role === "user" ? "**Interviewer:**" : "**Sam Kirk:**";
    const timestamp = new Date().toLocaleTimeString();

    transcriptLines.push(`${roleLabel} *(${timestamp})*`);
    transcriptLines.push("");
    transcriptLines.push(msg.text);
    transcriptLines.push("");
    transcriptLines.push("---");
    transcriptLines.push("");
  }

  transcriptLines.push("---");
  transcriptLines.push("");
  transcriptLines.push("*Generated by samkirk.com Interview Tool*");
  transcriptLines.push("*Contact: sam@samkirk.com*");

  const transcriptMd = transcriptLines.join("\n");

  // Store transcript in GCS
  log("Storing transcript artifacts...");
  const artifactPrefix = `submissions/${testSubmissionId}/`;
  await privateBucket.file(`${artifactPrefix}output/transcript.md`).save(transcriptMd, {
    contentType: "text/markdown; charset=utf-8",
    resumable: false,
  });
  await privateBucket.file(`${artifactPrefix}output/conversation.json`).save(
    JSON.stringify({ conversationId: testConversationId, messages: conversation }, null, 2),
    {
      contentType: "application/json; charset=utf-8",
      resumable: false,
    }
  );
  log("Transcript artifacts stored", true);

  // Update submission status
  await submissionDocRef.update({
    status: "complete",
    extracted: {
      messageCount: conversation.length,
      turnCount: Math.ceil(conversation.length / 2),
    },
    outputs: {
      transcriptPath: `${artifactPrefix}output/transcript.md`,
      lastMessageAt: new Date().toISOString(),
    },
    completedAt: Timestamp.now(),
  });
  log("Submission updated to complete", true);

  // Save transcript to test fixtures
  const fixturesDir = resolve(__dirname, "../test-fixtures/interview-chat");
  const fs = await import("fs/promises");
  await fs.writeFile(
    resolve(fixturesDir, "e2e-real-llm-transcript.md"),
    transcriptMd,
    "utf-8"
  );
  log("Transcript saved to test-fixtures/interview-chat/e2e-real-llm-transcript.md", true);

  // Print results
  console.log("\n--- Interview Results ---\n");
  console.log(`Questions asked: ${testQuestions.length}`);
  console.log(`Total messages: ${conversation.length}`);
  for (let i = 0; i < testQuestions.length; i++) {
    console.log(`\nQ${i + 1}: ${testQuestions[i]}`);
    console.log(`A${i + 1}: ${responses[i].slice(0, 200)}...`);
  }

  log("\nInterview tool test passed!", true);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(70));
  console.log("=== E2E Tests with Real Vertex AI (Fit + Resume + Interview Tools) ===");
  console.log("=".repeat(70) + "\n");

  // Step 1: Validate environment
  log("Checking environment variables...");
  const envResult = envSchema.safeParse(process.env);

  if (!envResult.success) {
    const missing = envResult.error.issues.map((issue) => issue.path.join(".")).join(", ");
    log(`Missing or invalid environment variables: ${missing}`, false);
    console.log("\nMake sure the following are set in web/.env.local:");
    console.log("  - GCP_PROJECT_ID");
    console.log("  - GCS_PRIVATE_BUCKET");
    console.log("  - VERTEX_AI_LOCATION");
    console.log("  - VERTEX_AI_MODEL");
    process.exit(1);
  }

  const env = envResult.data;
  log("Environment validated", true);
  log(`  Project: ${env.GCP_PROJECT_ID}`);
  log(`  Model: ${env.VERTEX_AI_MODEL}`);

  // Initialize clients
  const firestore = new Firestore({ projectId: env.GCP_PROJECT_ID });
  const storage = new Storage({ projectId: env.GCP_PROJECT_ID });
  const privateBucket = storage.bucket(env.GCS_PRIVATE_BUCKET);
  const vertexAI = new VertexAI({
    project: env.GCP_PROJECT_ID,
    location: env.VERTEX_AI_LOCATION,
  });

  // Step 2: Verify Vertex AI API is accessible
  log("Verifying Vertex AI API access...");
  async function checkVertexAI(): Promise<void> {
    const testModel = vertexAI.getGenerativeModel({ model: env.VERTEX_AI_MODEL });
    await testModel.countTokens({ contents: [{ role: "user", parts: [{ text: "test" }] }] });
  }

  function isApiDisabledError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes("PERMISSION_DENIED") ||
      message.includes("SERVICE_DISABLED") ||
      message.includes("is disabled") ||
      message.includes("has not been used") ||
      message.includes("aiplatform.googleapis.com")
    );
  }

  function waitForEnter(prompt: string): Promise<void> {
    return new Promise((resolve) => {
      process.stdout.write(prompt);
      process.stdin.setEncoding("utf-8");
      process.stdin.once("data", () => resolve());
      process.stdin.resume();
    });
  }

  try {
    await checkVertexAI();
    log("Vertex AI API is accessible", true);
  } catch (error) {
    if (!isApiDisabledError(error)) throw error;

    log("Vertex AI API is not enabled for this project.", false);
    console.log("\nTo enable it, run this in another terminal:");
    console.log(`  gcloud services enable aiplatform.googleapis.com --project=${env.GCP_PROJECT_ID}`);

    await waitForEnter("\nPress Enter after enabling the API to retry...");

    try {
      log("Retrying Vertex AI API check...");
      await checkVertexAI();
      log("Vertex AI API is accessible", true);
    } catch (retryError) {
      if (isApiDisabledError(retryError)) {
        log("Vertex AI API is still not accessible.", false);
        process.exit(1);
      }
      throw retryError;
    }
  }

  // Track test data for cleanup
  const cleanupTasks: Array<() => Promise<void>> = [];

  try {
    // Step 3: Verify resume is seeded (auto-seed if missing)
    log("Checking for seeded resume data...");
    const resumeIndexRef = firestore.collection(RESUME_INDEX_COLLECTION).doc(RESUME_INDEX_DOC);
    let resumeIndex = await resumeIndexRef.get();

    if (!resumeIndex.exists || (resumeIndex.data()?.chunkCount ?? 0) === 0) {
      log("Resume not seeded — auto-seeding now...");
      const seedResult = spawnSync("npx", ["tsx", "scripts/seed-resume.ts"], {
        cwd: resolve(__dirname, ".."),
        stdio: "inherit",
        env: process.env,
      });
      if (seedResult.status !== 0) {
        log("Auto-seeding failed. Run 'npm run seed:resume' manually.", false);
        process.exit(1);
      }
      // Re-check after seeding
      resumeIndex = await resumeIndexRef.get();
      if (!resumeIndex.exists || (resumeIndex.data()?.chunkCount ?? 0) === 0) {
        log("Resume still not found after seeding.", false);
        process.exit(1);
      }
    }

    const indexData = resumeIndex.data();
    const resumeVersion = indexData?.version ?? 0;
    const chunkCount = indexData?.chunkCount ?? 0;

    log(`Found resume version ${resumeVersion} with ${chunkCount} chunks`, true);

    // Fetch resume chunks
    log("Loading resume chunks...");
    const chunksSnapshot = await firestore
      .collection(RESUME_CHUNKS_COLLECTION)
      .where("version", "==", resumeVersion)
      .get();

    const resumeChunks: ResumeChunk[] = chunksSnapshot.docs.map((doc) => ({
      chunkId: doc.id,
      title: doc.data().title,
      sourceRef: doc.data().sourceRef,
      content: doc.data().content,
    }));

    log(`Loaded ${resumeChunks.length} chunks`, true);

    // Run tests
    await testFitTool(firestore, privateBucket, vertexAI, env.VERTEX_AI_MODEL, resumeChunks, cleanupTasks);
    await testResumeTool(firestore, privateBucket, vertexAI, env.VERTEX_AI_MODEL, resumeChunks, cleanupTasks);
    await testInterviewTool(firestore, privateBucket, vertexAI, env.VERTEX_AI_MODEL, resumeChunks, cleanupTasks);

    // Success!
    console.log("\n" + "=".repeat(60));
    console.log("=== All E2E Tests Passed ===");
    console.log("=".repeat(60) + "\n");
    log("All three tool flows (Fit, Resume, Interview) completed successfully!", true);

  } finally {
    // Cleanup
    console.log("\n--- Cleanup ---\n");
    for (const cleanup of cleanupTasks.reverse()) {
      try {
        await cleanup();
      } catch (error) {
        log(`Cleanup warning: ${error instanceof Error ? error.message : error}`, false);
      }
    }
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
