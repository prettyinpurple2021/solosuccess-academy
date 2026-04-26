/**
 * @file main.tsx — Application Entry Point
 * 
 * This is the very first file that runs when the app loads.
 * It mounts the root React component (<App />) into the HTML element with id="root"
 * (defined in index.html).
 * 
 * KEY CONCEPTS FOR NEW DEVELOPERS:
 * - `createRoot` is React 18's way of initializing a React app (replaces ReactDOM.render).
 * - The `!` after `getElementById("root")` is TypeScript's "non-null assertion" — it tells
 *   TypeScript "trust me, this element exists." If it doesn't, the app will crash.
 * - `./index.css` is imported for global styles (Tailwind + custom design system).
 * 
 * PRODUCTION TODO:
 * - Consider adding React.StrictMode wrapper for catching bugs in dev:
 *   `<React.StrictMode><App /></React.StrictMode>`
 * - Add global error reporting (e.g., Sentry) before createRoot for uncaught errors.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initReducedMotion } from "./lib/initReducedMotion";

// Set data-reduce-motion on <html> BEFORE React mounts so decorative
// backgrounds (nebula, starfield) never flash in for users who prefer
// reduced motion. See src/hooks/useReducedMotion.ts for the runtime hook.
initReducedMotion();


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
