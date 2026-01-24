import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();
    
    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch project with course info
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

    const course = project.courses;

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

    const userPrompt = `Please review this project submission:

---
${project.submission_content}
---

${project.file_urls?.length ? `\nNote: The student has also uploaded ${project.file_urls.length} file(s) as part of their submission.` : ""}`;

    // Call AI API
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

    // Update project with feedback
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
