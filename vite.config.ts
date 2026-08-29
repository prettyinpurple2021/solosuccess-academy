// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
// MCP server plugin — serves the app's agent-integration (MCP) endpoint in dev.
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// Build metadata injected at compile time — consumed by the /status page.
const BUILD_TIME = new Date().toISOString();
const BUILD_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  process.env.GITHUB_SHA?.slice(0, 7) ||
  process.env.COMMIT_REF?.slice(0, 7) ||
  `dev-${BUILD_TIME.slice(0, 10)}`;

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      __BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
      __BUILD_TIME__: JSON.stringify(BUILD_TIME),
    },
    plugins: [mcpPlugin()],
  },
});
