/**
 * @file rateLimit.ts — Generic edge-function rate limiter
 *
 * Counts requests per `(identifier, endpoint)` window in the
 * `api_rate_limits` table. Works for any caller — authenticated users
 * (identifier = user id) or anonymous traffic (identifier = hashed IP).
 *
 * NOTE (platform): The backend does not have first-class rate limiting
 * primitives yet. This is an ad-hoc helper; failures are non-fatal and
 * default to allowing the request rather than blocking it.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

export type RateLimitIdentifierType = "user" | "ip";

export interface CheckRateLimitOptions {
  /** Unique key for the caller: a user id (uuid string) or an opaque ip hash. */
  identifier: string;
  /** Defaults to "user" for backward compatibility. */
  identifierType?: RateLimitIdentifierType;
  /** Logical endpoint name, e.g. "ai-tutor" — scopes the counter. */
  endpoint: string;
  /** Maximum number of allowed requests inside the window. */
  maxRequests: number;
  /** Window length in minutes. */
  windowMinutes: number;
}

/** Legacy shape kept so existing call sites compile unchanged. */
export interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowMinutes: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Hash an IP address with a salted SHA-256 so we never persist raw IPs.
 * Returns a hex digest suitable for use as an `identifier` of type "ip".
 */
export async function hashIp(ip: string): Promise<string> {
  const salt = Deno.env.get("RATE_LIMIT_IP_SALT") ?? "ssa-rate-limit";
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build the admin Supabase client lazily so module import has no side effects. */
function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/**
 * checkRateLimit — primary signature.
 *
 * Usage:
 *   await checkRateLimit({ identifier: userId, endpoint: "ai-tutor",
 *                          maxRequests: 30, windowMinutes: 10 });
 *
 *   const ip = await hashIp(req.headers.get("cf-connecting-ip") ?? "");
 *   await checkRateLimit({ identifier: ip, identifierType: "ip",
 *                          endpoint: "submit-contact",
 *                          maxRequests: 5, windowMinutes: 60 });
 *
 * Backward-compat: `checkRateLimit(userId, { endpoint, maxRequests, windowMinutes })`
 * still works and is treated as `{ identifier: userId, identifierType: "user" }`.
 */
export function checkRateLimit(opts: CheckRateLimitOptions): Promise<RateLimitResult>;
export function checkRateLimit(userId: string, config: RateLimitConfig): Promise<RateLimitResult>;
export function checkRateLimit(
  a: CheckRateLimitOptions | string,
  b?: RateLimitConfig,
): Promise<RateLimitResult> {
  const opts: CheckRateLimitOptions =
    typeof a === "string"
      ? {
          identifier: a,
          identifierType: "user",
          endpoint: b!.endpoint,
          maxRequests: b!.maxRequests,
          windowMinutes: b!.windowMinutes,
        }
      : { identifierType: "user", ...a };

  return runCheck(opts);
}

async function runCheck(opts: CheckRateLimitOptions): Promise<RateLimitResult> {
  const { identifier, identifierType = "user", endpoint, maxRequests, windowMinutes } = opts;

  if (!identifier) {
    // Fail-open: missing identifier should never block a legitimate request,
    // but log it so we notice misconfiguration.
    console.warn(`[rateLimit] missing identifier for endpoint=${endpoint}`);
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + windowMinutes * 60 * 1000),
    };
  }

  const supabaseAdmin = getAdminClient();
  const defaultResetAt = new Date(Date.now() + windowMinutes * 60 * 1000);

  // Single atomic round-trip: increment-or-insert and return current state.
  // The RPC is service-role only and uses a unique index on
  // (identifier, endpoint, window_start) to prevent burst bypass.
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    _identifier: identifier,
    _identifier_type: identifierType,
    _endpoint: endpoint,
    _max_requests: maxRequests,
    _window_minutes: windowMinutes,
  });

  if (error || !data) {
    // Fail-open on infrastructure errors so a DB hiccup doesn't lock users out.
    // Callers that must fail-closed should check `error` themselves via a wrapper.
    console.error("[rateLimit] consume_rate_limit error", error);
    return { allowed: true, remaining: maxRequests, resetAt: defaultResetAt };
  }

  const payload = data as {
    allowed: boolean;
    remaining: number;
    reset_at: string;
  };

  return {
    allowed: payload.allowed,
    remaining: payload.remaining ?? 0,
    resetAt: new Date(payload.reset_at),
  };
}

export function rateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>) {
  const retryAfterSeconds = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded. Please try again later.",
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    }
  );
}
