/**
 * @file rateLimitConfig.ts — Centralised per-endpoint rate limit tiers
 *
 * One place to tune every edge function's request budget. Each entry maps a
 * logical endpoint name to `{ maxRequests, windowMinutes }`. The endpoint
 * string is also persisted in `api_rate_limits.endpoint` so it must stay
 * stable across deploys (renaming resets the counter).
 *
 * Add new endpoints here, then import via `getRateLimit("endpoint-name")`
 * inside the edge function.
 */

export interface RateLimitTier {
  endpoint: string;
  maxRequests: number;
  windowMinutes: number;
}

/**
 * Per-user, per-hour budgets. Tuned per workload cost.
 * Lower numbers for expensive AI generations, higher for cheap notifications.
 */
export const RATE_LIMITS = {
  // --- Student-facing AI (per-user, hourly) ---
  "ai-tutor":              { maxRequests: 30,  windowMinutes: 60 },
  "explain-text":          { maxRequests: 30,  windowMinutes: 60 },
  "practice-feedback":     { maxRequests: 20,  windowMinutes: 60 },
  "milestone-feedback":    { maxRequests: 20,  windowMinutes: 60 },
  "project-feedback":      { maxRequests: 10,  windowMinutes: 60 },
  "generate-voice":        { maxRequests: 20,  windowMinutes: 60 },
  "generate-image":        { maxRequests: 10,  windowMinutes: 60 },

  // --- Admin content generation (per-user, hourly) ---
  "generate-content":              { maxRequests: 20,  windowMinutes: 60 },
  "generate-content:practice_lab": { maxRequests: 120, windowMinutes: 60 },

  // --- System / notifications ---
  "notify-discussion-reply": { maxRequests: 50, windowMinutes: 60 },
} as const satisfies Record<string, Omit<RateLimitTier, "endpoint">>;

export type RateLimitEndpoint = keyof typeof RATE_LIMITS;

/**
 * Resolve the tier for an endpoint. Returns a complete `RateLimitTier`
 * (including the endpoint name) ready to pass to `checkRateLimit`.
 */
export function getRateLimit(endpoint: RateLimitEndpoint): RateLimitTier {
  return { endpoint, ...RATE_LIMITS[endpoint] };
}