/**
 * @file cors.ts — Shared CORS Configuration
 *
 * PURPOSE: Centralizes CORS headers so every edge function uses
 * the same allowed-origins list. In production, only requests from
 * known domains are accepted. During local development the Lovable
 * preview origin is also permitted.
 *
 * HOW IT WORKS:
 * - getCorsHeaders(req) reads the request's Origin header
 * - If the origin matches an allowed domain → reflect it back
 * - If not → return the primary production domain (browser will block)
 * - stripe-webhook is an exception (server-to-server, no CORS needed)
 *
 * TO ADD A NEW DOMAIN: Append it to the ALLOWED_ORIGINS array below.
 */

// Production + preview domains that are allowed to call edge functions
const ALLOWED_ORIGINS: string[] = [
  "https://indie-blossom-lab.lovable.app",                           // Published URL
  "https://id-preview--0ca92332-de07-43b7-a7ba-31271ca1363b.lovable.app", // Preview URL
];

// The default allowed headers for Supabase client requests
const ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

/**
 * Build CORS headers dynamically based on the incoming request origin.
 * If the origin is in our allow-list, reflect it. Otherwise fall back
 * to the primary production domain (the browser will block the request).
 */
export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers?.get("origin") ?? "";

  // Check if the request origin matches any allowed origin
  const matchedOrigin = ALLOWED_ORIGINS.find((allowed) => origin === allowed);

  return {
    "Access-Control-Allow-Origin": matchedOrigin || ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

/**
 * Quick helper for OPTIONS preflight responses.
 * Usage: if (req.method === "OPTIONS") return corsResponse(req);
 */
export function corsResponse(req: Request): Response {
  return new Response(null, { headers: getCorsHeaders(req) });
}
