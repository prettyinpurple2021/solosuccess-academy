// === manage-api-keys Edge Function ===
// Allows admins to save, retrieve, and delete API keys for external AI providers.
// Keys are stored in the admin_api_keys table (accessible only to admins via RLS).
//
// SECURITY: Only authenticated admin users can access this function.
// The API keys are stored as-is in the database (RLS ensures only admins can read them).
// For production self-hosting, consider adding encryption at rest.

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
    if (req.method === "GET") {
      // Fetch all stored API keys (return provider_id and is_enabled, mask the key)
      const { data, error } = await supabaseAdmin
        .from("admin_api_keys")
        .select("provider_id, is_enabled, updated_at, api_key_encrypted")
        .order("provider_id");

      if (error) throw error;

      // Return keys with masked values so admin knows a key is set
      const masked = (data || []).map((row) => ({
        provider_id: row.provider_id,
        is_enabled: row.is_enabled,
        updated_at: row.updated_at,
        // Show first 4 and last 4 chars, mask the rest
        key_preview: row.api_key_encrypted.length > 8
          ? row.api_key_encrypted.slice(0, 4) + "••••••••" + row.api_key_encrypted.slice(-4)
          : "••••••••",
      }));

      return new Response(JSON.stringify({ keys: masked }), {
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

      // Upsert: insert or update on conflict
      const upsertData: Record<string, unknown> = {
        provider_id,
        is_enabled: is_enabled !== undefined ? is_enabled : true,
      };

      // Only update the key if a new one is provided
      if (api_key) {
        upsertData.api_key_encrypted = api_key.trim();
      }

      // Check if record exists
      const { data: existing } = await supabaseAdmin
        .from("admin_api_keys")
        .select("id")
        .eq("provider_id", provider_id)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing — only update fields that were provided
        const updates: Record<string, unknown> = { is_enabled: upsertData.is_enabled };
        if (api_key) updates.api_key_encrypted = upsertData.api_key_encrypted;
        ({ error } = await supabaseAdmin
          .from("admin_api_keys")
          .update(updates)
          .eq("provider_id", provider_id));
      } else {
        if (!api_key) {
          return new Response(
            JSON.stringify({ error: "API key is required for new providers" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        ({ error } = await supabaseAdmin
          .from("admin_api_keys")
          .insert(upsertData));
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
