// === manage-api-keys Edge Function ===
// Allows admins to save, retrieve, and delete API keys for external AI providers.
//
// SECURITY:
//  - Only authenticated admin users can call this function (admin role enforced
//    in code AND inside every RPC via has_role()).
//  - Provider API keys are encrypted at rest with pgcrypto pgp_sym_encrypt
//    using the API_KEYS_ENCRYPTION_KEY server-side secret. The plaintext key
//    never leaves the edge function except as a masked preview on read.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    // 1. Verify the caller is an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check admin role using service role client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Route by HTTP method
    const encryptionKey = Deno.env.get("API_KEYS_ENCRYPTION_KEY") ?? "";
    if (!encryptionKey || encryptionKey.length < 16) {
      return new Response(
        JSON.stringify({
          error:
            "Server is missing API_KEYS_ENCRYPTION_KEY (must be at least 16 chars). Add it in project secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "GET") {
      // Fetch via RPC — decryption happens inside the security definer
      // function and only a masked preview is returned over the wire.
      const { data, error } = await supabaseAdmin.rpc("list_admin_api_keys", {
        _passphrase: encryptionKey,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ keys: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      // Save or update an API key
      const body = await req.json();
      const { provider_id, api_key, is_enabled } = body;

      if (!provider_id || typeof provider_id !== "string") {
        return new Response(
          JSON.stringify({ error: "provider_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (api_key !== undefined && (typeof api_key !== "string" || api_key.trim().length < 10)) {
        return new Response(
          JSON.stringify({ error: "API key must be at least 10 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let error;
      if (api_key) {
        // Encrypt + upsert via RPC.
        ({ error } = await supabaseAdmin.rpc("set_admin_api_key", {
          _provider_id: provider_id,
          _api_key: api_key,
          _is_enabled: is_enabled !== undefined ? is_enabled : true,
          _passphrase: encryptionKey,
        }));
      } else {
        // No new key supplied — only toggle is_enabled on an existing row.
        ({ error } = await supabaseAdmin.rpc("set_admin_api_key_enabled", {
          _provider_id: provider_id,
          _is_enabled: is_enabled !== undefined ? is_enabled : true,
        }));
      }
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const body = await req.json();
      const { provider_id } = body;

      if (!provider_id) {
        return new Response(
          JSON.stringify({ error: "provider_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseAdmin
        .from("admin_api_keys")
        .delete()
        .eq("provider_id", provider_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("manage-api-keys error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
