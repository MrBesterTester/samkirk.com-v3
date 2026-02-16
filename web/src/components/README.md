# web/src/components/

Shared React components with co-located tests.

## Structure

```
components/
├── Header.tsx              # Navigation header
├── Footer.tsx              # Page footer
├── AdminSignOut.tsx        # Admin logout button
├── ReCaptcha.tsx           # reCAPTCHA widget and gate
├── ToolGate.tsx            # Feature access control wrapper
├── ToolPreview.tsx         # Tool preview card
├── StaticHtmlViewer.tsx    # Renders sanitized HTML content
├── index.ts                # Barrel export
└── hire-me/                # Domain-specific hiring tool components
    ├── ChatStream.tsx      # Chat messages with streaming
    ├── ChatInput.tsx       # User input field
    ├── JobContextBar.tsx   # Job posting input (text/URL/file)
    ├── FitQuestionCard.tsx # FIT analysis question card
    ├── FitReportCard.tsx   # FIT report display
    ├── ResumePreviewCard.tsx # Resume preview card
    └── index.ts            # Barrel export with shared types
```

## Conventions

- Tests are co-located: `Component.tsx` + `Component.test.tsx`
- Shared types exported from `hire-me/index.ts` (`InputMode`, `JobInputData`, `ChatMessage`)
- Top-level components are general-purpose; `hire-me/` components are feature-specific
