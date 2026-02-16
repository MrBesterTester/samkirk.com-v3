# web/src/app/

Next.js App Router — all pages and API routes.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/hire-me` | Interactive hiring toolkit (FIT report, resume, interview) |
| `/dance-menu` | Weekly dance event listings |
| `/song-dedication` | Song dedication feature |
| `/photo-fun` | Photo fun feature |
| `/explorations/*` | Technical explorations (category theory, dance instruction, pocket flow, tensor logic, AI skills) |

## Admin (Protected)

Routes under `/admin/(protected)/` require Google OAuth via NextAuth:

- `/admin/login` — Login page (public)
- `/admin` — Dashboard
- `/admin/resume` — Resume management
- `/admin/dance-menu` — Dance menu admin
- `/admin/submissions` — View all submissions
- `/admin/submissions/[id]` — Individual submission detail

## API Routes

**Tools (primary features):**
- `api/tools/fit/start` — Initiate FIT analysis
- `api/tools/fit/generate` — Generate FIT report
- `api/tools/fit/answer` — Handle follow-up answers
- `api/tools/resume` — Tailored resume generation
- `api/tools/interview` — Interview chat

**Infrastructure:**
- `api/health`, `api/health-check` — Health endpoints
- `api/session/init` — Session initialization
- `api/captcha/verify` — reCAPTCHA verification
- `api/maintenance/retention` — 90-day data cleanup
- `api/auth/[...nextauth]` — NextAuth handlers

**Admin APIs:** `api/admin/resume`, `api/admin/dance-menu` (protected)

## Conventions

- Pages use `page.tsx`, layouts use `layout.tsx`
- API routes use `route.ts` with Next.js route handlers
- Tests are co-located (`page.test.tsx`, `route.test.ts`)
