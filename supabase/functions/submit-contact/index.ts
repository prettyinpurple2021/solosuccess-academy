/**
 * @file submit-contact Edge Function
 *
 * Receives contact form submissions from the Contact Us and Help Center pages,
 * validates the input, and stores them in the contact_submissions table using
 * the service role (bypassing RLS). This keeps the insert policy locked down
 * so nobody can write directly from the client.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    // ── 1. Parse & validate input ────────────────────────────────────
    const body = await req.json();
    const { name, email, subject, message, source } = body;

    // Basic required-field validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Name is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "A valid email is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Length limits to prevent abuse
    if (name.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: "Name must be under 100 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (email.trim().length > 255) {
      return new Response(
        JSON.stringify({ error: "Email must be under 255 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (message.trim().length > 5000) {
      return new Response(
        JSON.stringify({ error: "Message must be under 5000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine source label
    const validSources = ["contact", "help-center"];
    const sanitizedSource = validSources.includes(source) ? source : "contact";

    // ── 2. Insert using service role (bypasses RLS) ──────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await supabaseAdmin
      .from("contact_submissions")
      .insert({
        name: name.trim(),
        email: email.trim(),
        subject: subject ? String(subject).trim().slice(0, 200) : null,
        message: message.trim(),
        source: sanitizedSource,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save your message. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3. Success ───────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
