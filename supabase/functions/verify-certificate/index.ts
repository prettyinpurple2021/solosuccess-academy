/**
 * @file verify-certificate/index.ts — Public certificate lookup gated by Cloudflare Turnstile
 *
 * WHY: The public verify endpoint must stay open (no auth), so abusers could
 * brute-force certificate codes without a challenge. Turnstile blocks bots and
 * scripted enumeration before we hit the database.
 *
 * FLOW:
 *   1. Receive { code, turnstileToken } from /verify page
 *   2. Validate token with Cloudflare siteverify (server-side, secret key)
 *   3. On success → call verify_certificate_by_code RPC
 *   4. Return certificate row (or null) — never the secret
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse(req);
  const cors = getCorsHeaders(req);

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const turnstileToken = typeof body?.turnstileToken === "string" ? body.turnstileToken : "";

    if (!code || code.length > 64) {
      return new Response(JSON.stringify({ error: "Invalid verification code" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!turnstileToken) {
      return new Response(JSON.stringify({ error: "Missing challenge token" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!secret) {
      console.error("[verify-certificate] TURNSTILE_SECRET_KEY is not set");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Validate the Turnstile token with Cloudflare
    const remoteIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "";

    const verifyForm = new FormData();
    verifyForm.append("secret", secret);
    verifyForm.append("response", turnstileToken);
    if (remoteIp) verifyForm.append("remoteip", remoteIp);

    const verifyRes = await fetch(SITEVERIFY_URL, { method: "POST", body: verifyForm });
    const verifyJson = await verifyRes.json().catch(() => ({ success: false }));

    if (!verifyJson?.success) {
      console.warn("[verify-certificate] Turnstile rejected token", verifyJson?.["error-codes"]);
      return new Response(
        JSON.stringify({ error: "Challenge failed. Please try again." }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    // Token is valid — look up the certificate via the existing secure RPC
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("verify_certificate_by_code", { code });
    if (error) {
      console.error("[verify-certificate] RPC error", error);
      return new Response(JSON.stringify({ error: "Lookup failed" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const certificate = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return new Response(JSON.stringify({ certificate }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-certificate] Unhandled error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});