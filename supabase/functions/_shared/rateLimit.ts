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

  const now = new Date();
  const windowCutoff = new Date(now.getTime() - windowMinutes * 60 * 1000);
  const defaultResetAt = new Date(now.getTime() + windowMinutes * 60 * 1000);

  // Find the latest counter row that still falls inside the window
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from("api_rate_limits")
    .select("id, request_count, window_start")
    .eq("identifier", identifier)
    .eq("endpoint", endpoint)
    .gte("window_start", windowCutoff.toISOString())
    .order("window_start", { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error("[rateLimit] fetch error", fetchError);
    return { allowed: true, remaining: maxRequests, resetAt: defaultResetAt };
  }

  if (rows && rows.length > 0) {
    const row = rows[0];
    const currentCount = row.request_count;
    const windowResetAt = new Date(
      new Date(row.window_start).getTime() + windowMinutes * 60 * 1000,
    );

    if (currentCount >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: windowResetAt };
    }

    const { error: updateError } = await supabaseAdmin
      .from("api_rate_limits")
      .update({ request_count: currentCount + 1 })
      .eq("id", row.id);

    if (updateError) console.error("[rateLimit] update error", updateError);

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - currentCount - 1),
      resetAt: windowResetAt,
    };
  }

  // No active window — start a new one. user_id is only set when the
  // identifier represents an authenticated user (table constraint).
  const insertPayload: Record<string, unknown> = {
    identifier,
    identifier_type: identifierType,
    endpoint,
    request_count: 1,
    window_start: now.toISOString(),
    user_id: identifierType === "user" ? identifier : null,
  };

  const { error: insertError } = await supabaseAdmin
    .from("api_rate_limits")
    .insert(insertPayload);

  if (insertError) console.error("[rateLimit] insert error", insertError);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - 1),
    resetAt: defaultResetAt,
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
