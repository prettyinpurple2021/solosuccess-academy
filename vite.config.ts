import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
const BUILD_TIME = new Date().toISOString();
const BUILD_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  process.env.GITHUB_SHA?.slice(0, 7) ||
  process.env.COMMIT_REF?.slice(0, 7) ||
  `dev-${BUILD_TIME.slice(0, 10)}`;

export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mcpPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting — pulls heavy libraries into their own
         * lazy-loaded files so the main bundle stays small and fast.
         */
        manualChunks: {
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf'],
          'vendor-motion': ['framer-motion'],
          'vendor-pageflip': ['react-pageflip'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
}));
