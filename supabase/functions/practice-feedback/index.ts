// === practice-feedback Edge Function ===
// Generates AI feedback for student practice lab submissions.
// Validates input, checks auth + rate limits + ownership.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.25.76";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

// Rate limit: 20 requests per hour per user
const RATE_LIMIT_CONFIG = {
  endpoint: "practice-feedback",
  maxRequests: 20,
  windowMinutes: 60,
};

const requestSchema = z.object({
  submissionId: z
    .string({ required_error: "Submission ID is required" })
    .uuid("submissionId must be a valid UUID"),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsResponse(req);

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

    // 3. Parse input
    let body: unknown;
    try { body = await req.json(); } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: parseResult.error.errors[0]?.message ?? "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { submissionId } = parseResult.data;

    // 4. Service-role client
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 5. Fetch submission with practice lab + lesson + course info
    const { data: submission, error: subError } = await supabase
      .from("practice_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership
    if (submission.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to access this submission" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch practice lab details
    const { data: lab } = await supabase
      .from("practice_labs")
      .select("*, lessons(title, course_id, courses(title))")
      .eq("id", submission.practice_lab_id)
      .single();

    if (!lab) {
      return new Response(JSON.stringify({ error: "Practice lab not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lessonTitle = lab.lessons?.title || "Unknown Lesson";
    const courseTitle = lab.lessons?.courses?.title || "Unknown Course";

    // 6. Build AI prompt
    const systemPrompt = `You are an expert skills evaluator for the Solo Founder Academy.
You're reviewing a student's hands-on practice lab submission.

Course: "${courseTitle}"
Lesson: "${lessonTitle}"
Practice Lab: "${lab.title}"
Exercise Instructions: "${lab.instructions}"
Expected Deliverable: "${lab.deliverable_description}"

Your role is to evaluate HOW WELL the student practiced the skill, not just whether they answered correctly. Focus on:
1. Did they actually DO the exercise (not just describe it)?
2. Is their work practical and applicable to a real business?
3. Does it show understanding of the underlying concept?

Structure your feedback as:

## Assessment Summary
2-3 sentences on overall quality and effort level.

## Strengths ✅
List 2-3 specific things they did well in their practice work.

## Areas to Improve 💡
List 2-3 specific improvements with actionable suggestions.

## Pro Tip 🎯
One practical tip they can apply immediately to their business.

## Score: X/100
- 90-100: Exceptional — ready to apply professionally
- 75-89: Strong work — minor refinements needed
- 60-74: Good effort — revisit key concepts
- 40-59: Needs more practice — re-read the lesson material
- Below 40: Incomplete — try the exercise again

Be encouraging but honest. Grade the QUALITY of their practice, not just completion.`;

    const sanitizedContent = (submission.submission_content || "").substring(0, 10000);

    const userPrompt = `Here is the student's practice lab submission:

---
${sanitizedContent}
---

${submission.file_urls?.length ? `\nThe student also uploaded ${submission.file_urls.length} supporting file(s).` : ""}

Please evaluate their work and provide a score out of 100.`;

    // 7. Call AI
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service temporarily unavailable");
    }

    const aiResponse = await response.json();
    const feedback = aiResponse.choices?.[0]?.message?.content;

    if (!feedback) throw new Error("No feedback generated");

    // 8. Extract score from feedback (look for "Score: XX/100" pattern)
    const scoreMatch = feedback.match(/Score:\s*(\d+)\s*\/\s*100/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    // 9. Update submission with feedback
    const { error: updateError } = await supabase
      .from("practice_submissions")
      .update({
        ai_feedback: feedback,
        ai_feedback_at: new Date().toISOString(),
        score: score,
        status: "graded",
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to save feedback");
    }

    return new Response(JSON.stringify({ feedback, score }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Practice feedback error:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
