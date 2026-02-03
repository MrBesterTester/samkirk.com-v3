/**
 * E2E test with real Vertex AI for the Fit tool flow.
 *
 * Run with: cd web && npm run test:e2e:real
 *
 * This script:
 * 1. Requires seeded resume data in GCS/Firestore (run npm run seed:resume first)
 * 2. Creates a test submission and session
 * 3. Runs the full fit analysis flow with real Vertex AI
 * 4. Validates the response structure
 * 5. Cleans up test data
 *
 * Note: Incurs real Vertex AI costs (~$0.01-0.05 per run)
 *
 * Prerequisites:
 * - GCP credentials set up (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
 * - web/.env.local file with required environment variables
 * - Seeded resume data (npm run seed:resume)
 */

import { config } from "dotenv";
import { resolve } from "path";
import { randomBytes } from "crypto";

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
// Types (inlined from fit-flow.ts and fit-report.ts to avoid server-only)
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

interface FitFlowState {
  flowId: string;
  status: string;
  jobText: string;
  sourceIdentifier: string;
  characterCount: number;
  wordCount: number;
  extracted: ExtractedJobFields;
  followUpAnswers: unknown[];
  followUpsAsked: number;
  pendingQuestion: unknown | null;
  createdAt: Date;
  updatedAt: Date;
  errorMessage: string | null;
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
// Main Test
// ============================================================================

async function main(): Promise<void> {
  console.log("\n=== E2E Test with Real Vertex AI ===\n");

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

  // Track test data for cleanup
  const testSessionId = `${TEST_PREFIX}session_${randomBytes(8).toString("hex")}`;
  const testSubmissionId = `${TEST_PREFIX}submission_${randomBytes(8).toString("hex")}`;
  const cleanupTasks: Array<() => Promise<void>> = [];

  try {
    // Step 2: Verify resume is seeded
    log("Checking for seeded resume data...");
    const resumeIndexRef = firestore.collection(RESUME_INDEX_COLLECTION).doc(RESUME_INDEX_DOC);
    const resumeIndex = await resumeIndexRef.get();

    if (!resumeIndex.exists) {
      log("Resume not seeded. Run 'npm run seed:resume' first.", false);
      process.exit(1);
    }

    const indexData = resumeIndex.data();
    const resumeVersion = indexData?.version ?? 0;
    const chunkCount = indexData?.chunkCount ?? 0;

    if (chunkCount === 0) {
      log("No resume chunks found. Run 'npm run seed:resume' first.", false);
      process.exit(1);
    }

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

    // Step 3: Create test session
    log("Creating test session...");
    const now = Date.now();
    const sessionTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionDocRef = firestore.collection(SESSIONS_COLLECTION).doc(testSessionId);

    await sessionDocRef.set({
      createdAt: Timestamp.fromMillis(now),
      expiresAt: Timestamp.fromMillis(now + sessionTtlMs),
      ipHash: "e2e_test_ip_hash",
      captchaPassedAt: Timestamp.fromMillis(now), // Pre-pass captcha for test
    });
    cleanupTasks.push(async () => {
      await sessionDocRef.delete();
      log("Test session cleaned up", true);
    });
    log("Test session created", true);

    // Step 4: Create test submission
    log("Creating test submission...");
    const submissionTtlMs = 90 * 24 * 60 * 60 * 1000; // 90 days
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
      // Delete submission artifacts from GCS
      const [files] = await privateBucket.getFiles({ prefix: `submissions/${testSubmissionId}/` });
      for (const file of files) {
        await file.delete();
      }
      await submissionDocRef.delete();
      log("Test submission cleaned up", true);
    });
    log("Test submission created", true);

    // Step 5: Extract job fields
    log("Extracting job fields...");
    const extracted = extractJobFields(SAMPLE_JOB_POSTING);
    log(`  Title: ${extracted.title}`, true);
    log(`  Company: ${extracted.company}`);
    log(`  Seniority: ${extracted.seniority}`);
    log(`  Location: ${extracted.locationType}`);
    log(`  Skills: ${extracted.mustHaveSkills.join(", ") || "none detected"}`);

    // Step 6: Create flow state
    log("Creating flow state...");
    const flowId = randomBytes(16).toString("base64url");
    const flowState: FitFlowState = {
      flowId,
      status: "ready",
      jobText: SAMPLE_JOB_POSTING,
      sourceIdentifier: "e2e-test-job-posting",
      characterCount: SAMPLE_JOB_POSTING.length,
      wordCount: SAMPLE_JOB_POSTING.split(/\s+/).length,
      extracted,
      followUpAnswers: [],
      followUpsAsked: 0,
      pendingQuestion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      errorMessage: null,
    };
    log("Flow state created", true);

    // Step 7: Initialize Vertex AI and generate report
    log("Initializing Vertex AI...");
    const vertexAI = new VertexAI({
      project: env.GCP_PROJECT_ID,
      location: env.VERTEX_AI_LOCATION,
    });

    const model = vertexAI.getGenerativeModel({
      model: env.VERTEX_AI_MODEL,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    });
    log("Vertex AI initialized", true);

    // Build the prompt
    log("Building LLM prompt...");
    const resumeContext = resumeChunks
      .map((chunk) => `### ${chunk.title}\n${chunk.content}`)
      .join("\n\n");

    const prompt = `You are an expert career advisor helping Sam Kirk evaluate job fit.

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

    log(`Prompt: ${prompt.length} characters`, true);

    // Call Vertex AI
    log("Calling Vertex AI (this may take 10-30 seconds)...");
    const startTime = Date.now();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
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

    // Step 8: Store report in GCS
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
    console.log("\n--- Analysis Results ---\n");
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

    // Success!
    console.log("\n=== E2E Test Passed ===\n");
    log("Full fit analysis flow completed successfully!", true);

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
