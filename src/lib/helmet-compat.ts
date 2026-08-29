/**
 * react-helmet-async ships as CommonJS, which breaks named imports during
 * SSR module evaluation. This shim imports the CJS default and re-exports
 * the pieces the app uses, working in both server and browser bundles.
 */
import pkg from "react-helmet-async";

type HelmetModule = typeof import("react-helmet-async");

// CJS/ESM interop: under SSR the default export IS the module namespace.
const mod = (pkg as unknown as { default?: HelmetModule }).default
  ? ((pkg as unknown as { default: HelmetModule }).default)
  : (pkg as unknown as HelmetModule);

export const Helmet = mod.Helmet;
export const HelmetProvider = mod.HelmetProvider;
