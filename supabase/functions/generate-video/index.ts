/**
 * @file generate-video/index.ts — AI Video Generation (Async)
 *
 * PURPOSE: Submits video generation task to Runway and returns the task ID
 * immediately. The client polls via check-video-status for completion.
 * This avoids the 60-second Edge Function timeout.
 *
 * AUTH: Requires admin role.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");
    if (!RUNWAY_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "RUNWAY_API_KEY is not configured. Please add your Runway API key in AI Settings.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { prompt, duration, aspectRatio, imageUrl } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Submitting video generation task to Runway`);
    console.log(`Prompt: ${prompt}`);
    console.log(`Duration: ${duration || 5}s, Aspect Ratio: ${aspectRatio || "16:9"}`);

    // Submit the task — do NOT poll here (Edge Functions have 60s limit)
    const createResponse = await fetch("https://api.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptText: prompt,
        ...(imageUrl && { promptImage: imageUrl }),
        duration: duration || 5,
        ratio: aspectRatio || "16:9",
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Runway API error:", createResponse.status, errorText);

      if (createResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid Runway API key. Please check your API key in AI Settings." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (createResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Runway rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to start video generation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const taskData = await createResponse.json();
    const taskId = taskData.id;

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "No task ID returned from Runway" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return immediately with the task ID — client will poll check-video-status
    return new Response(
      JSON.stringify({
        taskId,
        status: "PENDING",
        message: "Video generation started. Poll check-video-status for progress.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-video error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
