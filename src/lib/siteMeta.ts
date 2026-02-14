/**
 * @file siteMeta.ts — SEO & Social Sharing Constants
 * 
 * Centralized metadata used by the <PageMeta> component for:
 * - HTML <title> tags
 * - <meta> description tags
 * - Open Graph (Facebook/LinkedIn) sharing metadata
 * - Twitter Card metadata
 * 
 * WHY THIS FILE EXISTS:
 * Instead of hardcoding SEO strings in every page, we define defaults here.
 * Individual pages can override these via the <PageMeta> component.
 * 
 * PRODUCTION TODO:
 * - Set VITE_SITE_URL in your production .env for correct canonical URLs
 * - Add a public/og-image.png (1200×630px) for social media sharing
 * - Update TWITTER_HANDLE to your real Twitter/X handle
 */

/** The name of the application — used in titles like "Page | SoloSuccess Academy" */
export const SITE_NAME = "SoloSuccess Academy";

/** Default <title> tag — shown when no page-specific title is set */
export const DEFAULT_TITLE = `${SITE_NAME} - AI-Powered Learning for Solo Founders`;

/** Default meta description — shown in Google search results (keep under 160 chars) */
export const DEFAULT_DESCRIPTION =
  "Master entrepreneurship with 10 AI-powered courses designed for solo founders. From mindset to pitch, build your business one course at a time.";

/** Twitter handle for Twitter Card meta tags */
export const TWITTER_HANDLE = "@SoloSuccessAcad";

/**
 * Get the absolute base URL for the site.
 * Used for canonical tags and og:image absolute URLs.
 * 
 * Priority: window.location.origin > VITE_SITE_URL env var > empty string
 * 
 * @returns The absolute base URL (e.g., "https://solosuccess.academy")
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return import.meta.env.VITE_SITE_URL ?? "";
}

/**
 * Build a full absolute URL for an Open Graph share image.
 * 
 * @param path - Relative path to the image (default: "/og-image.png")
 * @returns Absolute URL like "https://solosuccess.academy/og-image.png"
 */
export function getOgImageUrl(path = "/og-image.png"): string {
  const base = getSiteUrl();
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
