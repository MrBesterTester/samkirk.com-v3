# web/src/

Application source root for the Next.js site.

## Structure

```
src/
├── app/            # Next.js App Router — pages and API routes
├── components/     # Shared React components (with co-located tests)
├── hooks/          # Custom React hooks (useHireMe)
├── lib/            # Core business logic — 50+ modules
├── test/           # Test setup and utilities
└── proxy.ts        # Admin route protection middleware
```

## Conventions

- **Co-located tests**: Test files sit next to their implementation (`*.test.ts` / `*.test.tsx`)
- **Server-only boundary**: All `lib/` modules use `import "server-only"` to prevent client exposure
- **Barrel exports**: `components/index.ts` and `components/hire-me/index.ts` for clean imports
