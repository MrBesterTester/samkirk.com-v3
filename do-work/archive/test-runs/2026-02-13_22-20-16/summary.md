---
timestamp: 2026-02-13T22:20:16-08:00
gcp_available: true
suites_run: [unit, e2e, e2e-real, smoke]
overall: pass
---

# Test Run: 2026-02-13 22:20:16 PST

## Summary

| Suite | Status | Passed | Failed | Skipped | Duration |
|-------|--------|--------|--------|---------|----------|
| Unit Tests | PASSED | 1232 | 0 | 0 | 11s |
| E2E Tests | PASSED | 49 | 0 | 0 | 29s |
| E2E Real LLM | PASSED | 39 | 0 | 0 | 17s |
| GCP Smoke | PASSED | 108 | 0 | 0 | 39s |
| **Total** | | **1428** | **0** | **0** | **1m 38s** |

## Test Index

| File | Describe Blocks |
|------|-----------------|
| src/app/api/public/[...path]/route.test.ts | Public Proxy API Integration, Public Proxy API – Security (unit) |
| src/app/explorations/category-theory/page.test.tsx | Category Theory page |
| src/app/explorations/dance-instruction/page.test.tsx | Dance Instruction page |
| src/app/explorations/page.test.tsx | Explorations hub page |
| src/app/explorations/pocket-flow/page.test.tsx | Pocket Flow page |
| src/app/explorations/uber-level-ai-skills/page.test.tsx | Uber Level AI Skills page |
| src/app/page.test.tsx | Home page |
| src/app/song-dedication/page.test.tsx | Song Dedication page |
| src/components/Footer.test.tsx | Footer |
| src/components/Header.test.tsx | Header |
| src/components/ReCaptcha.test.tsx | ReCaptcha, CaptchaGate |
| src/components/StaticHtmlViewer.test.tsx | StaticHtmlViewer |
| src/components/ToolGate.test.tsx | ToolGate |
| src/components/ToolPreview.test.tsx | ToolPreview |
| src/lib/api-errors.test.ts | ERROR_STATUS_CODES, generateCorrelationId, getCorrelationId, CORRELATION_ID_HEADER, createErrorResponse, serializeErrorForResponse, containsSensitiveData, redactSensitiveData, sanitizeErrorForLogging, logError, logWarning, AppError, toJSON(), toResponse(), sessionError, captchaRequiredError, validationError, internalError, isAppError, hasErrorCode, hasToResponse, hasToJSON, Integration Scenarios |
| src/lib/artifact-bundler.test.ts | artifact-bundler, createBundle, getExpectedBundleFiles, validateBundleFiles, bundle structure for different tool types |
| src/lib/auth.test.ts | isEmailAllowed |
| src/lib/captcha.test.ts | captcha, buildVerifyRequestBody, mapRecaptchaErrorCodes |
| src/lib/dance-menu-upload.test.ts | dance-menu-upload, getFileExtension, isAllowedExtension, validateFileMetadata, validateFileContent, validateBundle, getFormatDisplayName, constants |
| src/lib/env.test.ts | parseEnv |
| src/lib/firestore.test.ts | firestore path helpers, Collections, sessionDocPath, rateLimitDocPath, spendMonthlyDocPath, getCurrentMonthKey, resumeIndexDocPath, resumeChunkDocPath, submissionDocPath |
| src/lib/fit-flow.test.ts | fit-flow constants, createInitialExtractedFields, createInitialFitFlowState, extractSeniority, extractLocationType, evaluateLocationFit, onsite positions, hybrid positions, applyWorstCaseLocation, generateNextQuestion, nextQuestion, follow-up counting, processAnswer, applyAnswerToExtracted, location answers, onsite frequency answers, seniority answers, skills answers, estimateCommuteFromLocation, initializeFitFlow, finalizeForReport, isReadyForReport, getUnknownFields, full flow scenarios, extractJobTitle, extractCompanyName, extractMustHaveSkills, analyzeJobText |
| src/lib/fit-report.test.ts | FIT_ANALYSIS_SYSTEM_PROMPT, formatExtractedFields, buildFitAnalysisPrompt, parseFitAnalysisResponse, generateMarkdownReport, generateCitations, FitReportError |
| src/lib/interview-chat.test.ts | Constants, buildInterviewSystemPrompt, generateTranscript, processMessage, validation, turn limit, guardrails, successful message processing, error handling, citations handling, getOrCreateConversation, InterviewChatError |
| src/lib/interview-guardrails.test.ts | interview-guardrails constants, classifyTopic - allowed topics, work_history, projects, skills, education, availability, location_remote, compensation, career_goals, interview_meta, classifyTopic - disallowed topics, personal_life, politics, medical, religion, financial_private, general_assistant, prompt_injection, inappropriate, classifyTopic - edge cases, checkGuardrails, generateRedirectResponse, generateGenericRedirectResponse, generatePersistentOffTopicResponse, isPersistentlyOffTopic, buildClassificationPrompt, parseLlmClassificationResponse, getAllowedTopicCategories, getDisallowedTopicCategories, confidence levels, real-world interview questions, prompt injection resistance, general assistant rejection, TopicClassificationResult structure, GuardrailResult structure |
| src/lib/job-ingestion.test.ts | job-ingestion constants, JobIngestionError, getFileExtension, isAllowedExtension, normalizeText, countWords, createIngestionResult, ingestFromPaste, decodeHtmlEntities, extractTextFromHtml, ingestFromUrl, validateJobFileMetadata, extractTextFromTextFile, ingestFromFile, ingestJob, edge cases, real-world HTML examples |
| src/lib/markdown-renderer.test.ts | markdown-renderer, renderMarkdown, renderMarkdown with fullDocument option, renderMarkdownSync, sanitizeHtml, escapeHtml, wrapInDocument, renderCitationsHtml, renderCitationsMarkdown, appendCitationsToMarkdown, renderMarkdownWithCitations, DEFAULT_MARKDOWN_CSS |
| src/lib/rate-limit.test.ts | rate-limit module, constants, RateLimitError, getClientIp, deriveRateLimitKey, createRateLimitWindow, createRateLimitWindowFromDate, isWindowExpired, getWindowRemainingMs, rate limit window behavior, integration: key derivation and window management, counter increment simulation, error message formatting |
| src/lib/resume-chunker.test.ts | parseLines, extractHeadings, parseIntoSections, generateChunkId, hashContent, generateTitle, generateSourceRef, splitLargeSection, chunkMarkdown, Chunk ID stability, Edge cases |
| src/lib/resume-context.test.ts | formatChunkForContext, detailed format (default), compact format, minimal format, assembleContextFromChunks, basic assembly, maxChunks option, format options, characterCount accuracy, getResumeContext, generateCitationsFromChunks, generateCitationsForReferencedChunks, createCitationMap, getContextSummary, isResumeContextAvailable, getResumeContextSize, Context and Citation Integration, Edge Cases |
| src/lib/resume-generator.test.ts | Constants, RESUME_GENERATION_SYSTEM_PROMPT, buildResumeGenerationPrompt, parseResumeResponse, generateMarkdownResume, countResumeWords, ResumeGeneratorError, Type definitions |
| src/lib/resume-upload.test.ts | resume-upload, constants, isAllowedResumeExtension, isAllowedResumeSize, validateResumeFileMetadata, validateResumeContent, createUploadError |
| src/lib/retention.test.ts | retention module, constants, isExpired, isValidSubmissionPrefix, extractSubmissionIdFromPrefix, buildCleanupSummary, ExpiredSubmission type, DeletionResult type, RetentionCleanupResult type, retention policy edge cases, idempotency scenarios, security considerations |
| src/lib/session.test.ts | session module, generateSessionId, isValidSessionId, getSessionCookieOptions, createSessionTimestamps, hashIp, constants |
| src/lib/spend-cap.test.ts | spend-cap module, constants, SpendCapError, getMonthKeyForDate, parseMonthKey, getNextMonthKey, estimateLlmCost, estimateTokensFromText, createSpendMonthlyDoc, isSpendCapExceeded, getRemainingBudget, month boundary scenarios, cost estimation scenarios, integration scenarios |
| src/lib/storage.test.ts | storage path helpers, PrivatePaths, masterResume, resumeIndex, submissionPrefix, submissionInput, submissionExtracted, submissionOutput, submissionBundle, PublicPaths, danceMenuCurrent, danceMenuFile, danceMenuVersioned |
| src/lib/submission.test.ts | submission module, constants, generateSubmissionId, isValidSubmissionId, createSubmissionTimestamps, createSubmissionTimestampsFromDate, calculateExpiresAt, isSubmissionExpired, buildArtifactGcsPrefix, isValidTool, isValidStatus, isValidCitation, isValidCitationsArray, TTL computation edge cases, ListSubmissionsOptions, SubmissionWithId type |
| src/lib/vertex-ai.test.ts | ContentBlockedError, GenerationError, isSpendCapError, isContentBlockedError, isGenerationError, Error inheritance |
| e2e/fit-tool.spec.ts | Fit Tool Happy Path, Fit Tool Error Handling |
| e2e/full-app.spec.ts | Public Pages - Render Correctly, Exploration Pages - Render Correctly, Admin Pages - Authentication Required, Navigation - Links Work, API Endpoints - Basic Health, Error Handling - 404 Pages, Accessibility - Basic Checks |
| e2e/interview-tool.spec.ts | Interview Tool - UI, Interview Tool - Input Behavior, Interview Tool - Conversation |
| e2e/resume-tool.spec.ts | Resume Tool Happy Path, Resume Tool Error Handling |

## Fixture Updates

| File | Suite | Type |
|------|-------|------|
| interview-chat/e2e-downloaded-bundle.zip | E2E Tests | updated |
| interview-chat/e2e-real-llm-transcript.md | E2E Real LLM | updated |

_2 fixture(s) updated during this run._

## Manual Verifications (informational -- not gated)

- [ ] VER-001: Visual inspect resume PDF layout
- [ ] VER-002: OAuth flow in fresh browser session
- [ ] VER-003: Cloud Run deployment serves traffic

## Cross-references

- Raw logs: unit-tests.log, e2e-tests.log, e2e-real-llm.log, gcp-smoke.log (gitignored, local only)
