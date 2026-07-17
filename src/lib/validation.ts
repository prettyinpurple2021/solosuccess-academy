/**
 * Client-side validation utilities.
 *
 * These utilities mirror the validation logic used by the Supabase Edge
 * Functions so that invalid data is rejected as early as possible, before
 * it ever reaches the server.
 */

/** UUID v1–v5 format regex. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns true if value is a well-formed UUID. */
export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}

/** Production domains that may call the API. */
const ALLOWED_ORIGINS = new Set([
  "https://solosuccessacademy.app",
  "https://www.solosuccessacademy.app",
  "https://solosuccessacademy.cloud",
  "https://www.solosuccessacademy.cloud",
]);

/** Lovable preview domain pattern. */
const LOVABLE_PATTERN = /^https:\/\/[a-z0-9-]+\.lovable\.app$/i;

/**
 * Returns true if origin is in the production allow-list or is a Lovable
 * preview domain.
 */
export function isSafeOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.has(origin) || LOVABLE_PATTERN.test(origin);
}
