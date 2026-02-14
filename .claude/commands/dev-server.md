Rebuild and start the Next.js dev server on localhost:3000.

1. Kill any existing process on port 3000: `lsof -ti:3000 | xargs kill -9 2>/dev/null || true`
2. Clear the `.next` build cache: `rm -rf web/.next`
3. Start the dev server in the background: `cd web && npm run dev`

Run step 3 using `run_in_background: true` so the user can keep working while the server starts.