# Vite Migration

This branch contains the complete migration from Next.js to Vite with all the improvements from PR #6.

## Changes Applied

1. **.gitignore** - Added package-lock.json to ignore list
2. **README.md** - Updated port from 8080 to 3000, reorganized scripts documentation
3. **eslint.config.js** - Changed no-unused-vars from "off" to "warn" with ignore patterns
4. **package.json** - Updated name, reorganized scripts, removed lovable-tagger, updated dependencies
5. **pnpm-lock.yaml** - Added pnpm lock file (replacing npm)
6. **src/integrations/supabase/client.ts** - Added environment variable validation with error throwing
7. **tailwind.config.ts** - Changed from require() to ESM import for tailwindcss-animate
8. **tsconfig.json** - Cleaned up compiler options, removed overly permissive settings
9. **vite.config.ts** - Updated port to 3000, removed lovable-tagger, use process.cwd() for path resolution
10. **vitest.config.ts** - Use process.cwd() for path resolution
11. **Removed**: bun.lockb, package-lock.json

## Target Branch

This PR should be merged directly into `main` to avoid the merge conflicts in PR #6.
