/**
 * milestone-feedback Edge Function
 * 
 * Generates AI feedback for a single milestone submission.
 * Also produces rubric scores per category and stores them.
 * 
 * Flow:
 * 1. Auth + rate limit check
 * 2. Validate submissionId
 * 3. Fetch submission → milestone → course + rubric categories
 * 4. Build AI prompt that asks for structured rubric JSON + prose feedback
 * 5. Parse AI response, store rubric scores + feedback
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.25.76";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const RATE_LIMIT_CONFIG = {
  endpoint: "milestone-feedback",
  maxRequests: 20,
  windowMinutes: 60,
};

const requestSchema = z.object({
  submissionId: z.string().uuid("submissionId must be a valid UUID"),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsResponse(req);

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // 2. Rate limit
    const rl = await checkRateLimit(userId, RATE_LIMIT_CONFIG);
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

    // 3. Parse body
    let body: unknown;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.errors[0]?.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { submissionId } = parsed.data;

    // 4. Setup service client
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing env vars");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 5. Fetch submission
    const { data: submission, error: subErr } = await supabase
      .from("project_milestone_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();
    if (subErr || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Ownership check
    if (submission.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Fetch milestone + course
    const { data: milestone } = await supabase
      .from("project_milestones")
      .select("*, courses(title, project_title)")
      .eq("id", submission.milestone_id)
      .single();
    if (!milestone) {
      return new Response(JSON.stringify({ error: "Milestone not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Fetch rubric categories for this course
    const { data: rubricCats } = await supabase
      .from("project_rubric_categories")
      .select("*")
      .eq("course_id", milestone.course_id)
      .order("order_number", { ascending: true });

    const categories = rubricCats || [];

    // 8. Build AI prompt
    const rubricSection = categories.length > 0
      ? `\n\nRubric Categories (score each 0-${categories[0]?.max_points ?? 10}):\n${categories.map((c: any) => `- ${c.name} (max ${c.max_points}): ${c.description}`).join("\n")}`
      : "";

    const rubricJsonInstruction = categories.length > 0
      ? `\n\nIMPORTANT: End your response with a JSON block on its own line wrapped in \`\`\`json ... \`\`\` containing rubric scores. Format:
\`\`\`json
{
  "rubric_scores": [
    ${categories.map((c: any) => `{ "category_id": "${c.id}", "score": <number 0-${c.max_points}>, "feedback": "<one sentence>" }`).join(",\n    ")}
  ]
}
\`\`\``
      : "";

    const systemPrompt = `You are an expert project coach for the Solo Founder Academy.
You're reviewing Milestone ${milestone.order_number}: "${milestone.title}" for the course "${milestone.courses?.title}".

Milestone Description: ${milestone.description}
Deliverable Prompt: ${milestone.deliverable_prompt}
${rubricSection}

Provide constructive feedback structured as:

## Milestone Assessment
2-3 sentence summary.

## Strengths ✅
List 2-3 specific things done well.

## Improvements 💡
List 1-2 actionable improvements.

## Next Steps
1-2 recommendations for the next milestone.
${rubricJsonInstruction}`;

    const sanitizedContent = (submission.submission_content || "").substring(0, 10000);
    const userPrompt = `Student submission:\n---\n${sanitizedContent}\n---${
      submission.file_urls?.length ? `\n(${submission.file_urls.length} file(s) attached)` : ""
    }`;

    // 9. Call AI
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service unavailable");
    }

    const aiData = await aiResp.json();
    const fullFeedback = aiData.choices?.[0]?.message?.content;
    if (!fullFeedback) throw new Error("No feedback generated");

    // 10. Parse rubric scores from JSON block
    let rubricScores: Array<{ category_id: string; score: number; feedback: string }> = [];
    const jsonMatch = fullFeedback.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        rubricScores = parsed.rubric_scores || [];
      } catch (e) {
        console.error("Failed to parse rubric JSON:", e);
      }
    }

    // Strip the JSON block from visible feedback
    const cleanFeedback = fullFeedback.replace(/```json[\s\S]*?```/, "").trim();

    // 11. Update submission with feedback
    const { error: updateErr } = await supabase
      .from("project_milestone_submissions")
      .update({
        ai_feedback: cleanFeedback,
        ai_feedback_at: new Date().toISOString(),
        status: "reviewed",
      })
      .eq("id", submissionId);
    if (updateErr) throw new Error("Failed to save feedback");

    // 12. Upsert rubric scores (delete old ones first for resubmissions)
    if (rubricScores.length > 0) {
      await supabase
        .from("project_rubric_scores")
        .delete()
        .eq("submission_id", submissionId);

      const scoreRows = rubricScores.map((rs) => ({
        submission_id: submissionId,
        category_id: rs.category_id,
        score: Math.max(0, Math.min(rs.score, categories.find((c: any) => c.id === rs.category_id)?.max_points ?? 10)),
        feedback: rs.feedback || null,
      }));

      const { error: scoreErr } = await supabase
        .from("project_rubric_scores")
        .insert(scoreRows);
      if (scoreErr) console.error("Rubric score insert error:", scoreErr);
    }

    return new Response(JSON.stringify({ feedback: cleanFeedback, rubricScores }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("milestone-feedback error:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
