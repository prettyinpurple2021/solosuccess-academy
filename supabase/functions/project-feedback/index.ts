// === project-feedback Edge Function ===
// Generates AI feedback for student project submissions.
// Validates input with Zod, checks auth + rate limits + project ownership.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.25.76";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

// Rate limit: 10 requests per hour per user (project feedback is expensive)
const RATE_LIMIT_CONFIG = {
  endpoint: "project-feedback",
  maxRequests: 10,
  windowMinutes: 60,
};

// --- Zod schema: validates the request body has a valid UUID project ID ---
const projectFeedbackRequestSchema = z.object({
  projectId: z
    .string({ required_error: "Project ID is required" })
    .uuid("projectId must be a valid UUID"),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // 2. Check rate limit
    const rateLimitResult = await checkRateLimit(userId, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders);
    }

    // 3. Parse and validate input with Zod
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parseResult = projectFeedbackRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message ?? "Invalid input";
      return new Response(
        JSON.stringify({ error: firstError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { projectId } = parseResult.data;

    // 4. Set up service-role client for DB operations
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 5. Fetch project with course info
    const { data: project, error: projectError } = await supabase
      .from("course_projects")
      .select(`
        *,
        courses (
          title,
          project_title,
          project_description
        )
      `)
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. CRITICAL: Verify ownership — user must own this project
    if (project.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to access this project" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const course = project.courses;

    // 7. Build AI prompts
    const systemPrompt = `You are an expert business coach and project evaluator for the Solo Founder Academy. 
You're reviewing a student's project submission for the course: "${course.title}".

Project Title: "${course.project_title}"
Project Requirements: "${course.project_description}"

Your role is to provide constructive, actionable feedback that helps the student improve their work and apply the concepts from the course to their business.

Structure your feedback as follows:

## Overall Assessment
Provide a brief 2-3 sentence summary of the submission quality and main strengths.

## What You Did Well ✅
List 3-4 specific things the student did well. Be specific and reference parts of their submission.

## Areas for Improvement 💡
List 2-3 areas where the submission could be stronger. For each:
- Explain what's missing or could be better
- Provide a specific, actionable suggestion
- Give an example if helpful

## Key Recommendations
Provide 2-3 priority actions the student should take to improve this project.

## Score
Rate the submission on a scale of 1-10, where:
- 1-3: Needs significant work
- 4-6: Good foundation, room for improvement
- 7-8: Strong submission
- 9-10: Exceptional work

Be encouraging but honest. The goal is to help them succeed as solo founders.`;

    // Sanitize submission content to a safe max length
    const sanitizedContent = (project.submission_content || "").substring(0, 15000);

    const userPrompt = `Please review this project submission:

---
${sanitizedContent}
---

${project.file_urls?.length ? `\nNote: The student has also uploaded ${project.file_urls.length} file(s) as part of their submission.` : ""}`;

    // 8. Call AI API
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service temporarily unavailable");
    }

    const aiResponse = await response.json();
    const feedback = aiResponse.choices?.[0]?.message?.content;

    if (!feedback) {
      throw new Error("No feedback generated");
    }

    // 9. Update project with feedback
    const { error: updateError } = await supabase
      .from("course_projects")
      .update({
        ai_feedback: feedback,
        ai_feedback_at: new Date().toISOString(),
        status: "reviewed",
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to save feedback");
    }

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Project feedback error:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
