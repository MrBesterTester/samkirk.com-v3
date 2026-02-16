# web/src/lib/

Core business logic — 50+ modules powering the application backend. All modules use `import "server-only"` to prevent accidental client exposure.

## Modules by Category

### LLM & AI
- `vertex-ai.ts` — Vertex AI Gemini client with cost tracking
- `interview-chat.ts` — Interview conversation logic
- `interview-guardrails.ts` — Topic classification and off-topic detection

### Job Analysis & FIT Flow
- `fit-flow.ts` — FIT analysis orchestration (fit scores, commute checks)
- `fit-report.ts` — FIT report generation (HTML/markdown)
- `job-ingestion.ts` — Parse job postings (title, company, location, salary, seniority)

### Resume Processing
- `resume-context.ts` — Build RAG context from resume chunks
- `resume-chunker.ts` — Split resume into semantic chunks
- `resume-generator.ts` — Generate tailored resumes
- `resume-upload.ts` — Validate resume file metadata

### Storage & Artifacts
- `storage.ts` — Google Cloud Storage client (public/private buckets)
- `artifact-bundler.ts` — Create .zip artifacts with job, resume, analysis, citations
- `dance-menu-upload.ts` — Validate dance menu bundles

### Database & Persistence
- `firestore.ts` — Firestore client and type-safe schema
- `submission.ts` — Create/update/complete submission records
- `session.ts` — Session ID generation and cookie management

### Authentication
- `auth.ts` — NextAuth configuration (Google OAuth + email allowlist)
- `admin-allowlist.ts` — Admin email checking
- `admin-auth.ts` — `requireAdminAuth()` and `getAdminSession()` helpers

### Security & Rate Limiting
- `captcha.ts` — reCAPTCHA v3 verification
- `rate-limit.ts` — Sliding window rate limiting (10 req/10 min per session+IP)

### Infrastructure
- `spend-cap.ts` — Monthly spend cap ($20 USD) with token-based cost estimation
- `retention.ts` — 90-day submission cleanup via Cloud Scheduler
- `markdown-renderer.ts` — Markdown to HTML with citation support
- `pdf-renderer.tsx` — React component for PDF generation
- `env.ts` — Zod-validated environment variables
- `api-errors.ts` — Centralized error codes and response builders

## Conventions

- Every module has a co-located test file (`*.test.ts`)
- Domain modules grouped by feature (fit-*, resume-*, interview-*)
- Zod schemas for validation at system boundaries
- GCP integration: Firestore (database), Cloud Storage (files), Vertex AI (LLM)
