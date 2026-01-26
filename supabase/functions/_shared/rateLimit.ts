import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

  // Get current request count in the window
  const { data: existingRecords, error: fetchError } = await supabaseAdmin
    .from("api_rate_limits")
    .select("id, request_count, window_start")
    .eq("user_id", userId)
    .eq("endpoint", config.endpoint)
    .gte("window_start", windowStart.toISOString())
    .order("window_start", { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error("Rate limit fetch error:", fetchError);
    // On error, allow the request but log it
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date() };
  }

  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowMinutes * 60 * 1000);

  if (existingRecords && existingRecords.length > 0) {
    const record = existingRecords[0];
    const currentCount = record.request_count;

    if (currentCount >= config.maxRequests) {
      // Rate limit exceeded
      const windowResetAt = new Date(record.window_start);
      windowResetAt.setMinutes(windowResetAt.getMinutes() + config.windowMinutes);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowResetAt,
      };
    }

    // Increment the counter
    const { error: updateError } = await supabaseAdmin
      .from("api_rate_limits")
      .update({ request_count: currentCount + 1 })
      .eq("id", record.id);

    if (updateError) {
      console.error("Rate limit update error:", updateError);
    }

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetAt,
    };
  }

  // No existing record, create new one
  const { error: insertError } = await supabaseAdmin
    .from("api_rate_limits")
    .insert({
      user_id: userId,
      endpoint: config.endpoint,
      request_count: 1,
      window_start: now.toISOString(),
    });

  if (insertError) {
    console.error("Rate limit insert error:", insertError);
  }

  return {
    allowed: true,
    remaining: config.maxRequests - 1,
    resetAt,
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
