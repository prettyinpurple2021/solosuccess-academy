/**
 * bulk-generate-assessments – Generates final exams AND final essays
 * for ALL courses that don't already have them.
 *
 * WHY: The generate-content function is per-item and requires admin auth
 * from the browser. This function runs server-side with the service role
 * so we can batch-generate all assessments in one call.
 *
 * SECURITY: Admin-only (validates JWT + checks user_roles).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

// The Lovable AI gateway endpoint
const AI_GATEWAY = "https://ai.lovable.dev/api/generate";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsResponse(req);

  try {
    // ── Auth check ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Verify admin role
    const { data: roleData } = await anonClient
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

    // ── Service role client for writes ──────────────────────────
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Load all courses ────────────────────────────────────────
    const { data: courses, error: coursesErr } = await serviceClient
      .from("courses")
      .select("id, title, description")
      .order("order_number");

    if (coursesErr) throw coursesErr;

    // ── Check existing exams & essays ───────────────────────────
    const { data: existingExams } = await serviceClient
      .from("course_final_exams")
      .select("course_id");
    const { data: existingEssays } = await serviceClient
      .from("course_essays")
      .select("course_id");

    const examCourseIds = new Set((existingExams || []).map((e: any) => e.course_id));
    const essayCourseIds = new Set((existingEssays || []).map((e: any) => e.course_id));

    const needExam = (courses || []).filter((c: any) => !examCourseIds.has(c.id));
    const needEssay = (courses || []).filter((c: any) => !essayCourseIds.has(c.id));

    const results: any = { exams: [], essays: [], errors: [] };
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    // ── Helper: call AI ─────────────────────────────────────────
    async function callAI(systemPrompt: string, userPrompt: string): Promise<any> {
      const response = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI error ${response.status}: ${errText}`);
      }

      const result = await response.json();
      let text = result.choices?.[0]?.message?.content || "";

      // Strip markdown code fences
      text = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
      return JSON.parse(text);
    }

    // ── Exam system prompt ──────────────────────────────────────
    const examSystemPrompt = `You are an expert assessment designer for SoloSuccess Academy.
Create a comprehensive mixed-format final exam with three question types:
1. Multiple Choice (MCQ) — ~50% of questions
2. True/False — ~25% of questions
3. Short Answer — ~25% of questions

Generate in JSON format:
{
  "title": "Final Exam: [Course Title]",
  "instructions": "Clear exam instructions explaining all three question types",
  "passingScore": 70,
  "questions": [
    { "id": "q1", "type": "mcq", "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "...", "points": 5 },
    { "id": "q2", "type": "true_false", "question": "...", "options": ["True","False"], "correctBoolean": true, "explanation": "...", "points": 3 },
    { "id": "q3", "type": "short_answer", "question": "...", "correctAnswer": "key concepts expected", "explanation": "...", "points": 10 }
  ]
}
Include 15 questions of varying difficulty covering the breadth of the course material.`;

    // ── Essay system prompt ─────────────────────────────────────
    const essaySystemPrompt = `You are an expert assessment designer for SoloSuccess Academy.
Create a final essay assignment with 3-5 essay topic options and a detailed grading rubric.

Generate in JSON format:
{
  "title": "Final Essay: [Course Title]",
  "wordLimit": 1500,
  "prompts": [
    { "title": "Essay Topic Title", "description": "2-3 sentence description", "guiding_questions": ["Q1","Q2","Q3"] }
  ],
  "rubric": {
    "totalPoints": 100,
    "criteria": [
      { "name": "Thesis & Argument", "description": "...", "maxPoints": 25 },
      { "name": "Critical Thinking", "description": "...", "maxPoints": 25 },
      { "name": "Practical Application", "description": "...", "maxPoints": 20 },
      { "name": "Structure & Organization", "description": "...", "maxPoints": 15 },
      { "name": "Writing Quality", "description": "...", "maxPoints": 15 }
    ]
  }
}
Create essay topics that require students to synthesize course concepts and apply them to their own entrepreneurial journey.`;

    // ── Generate exams sequentially (to avoid rate limits) ──────
    for (const course of needExam) {
      try {
        const userPrompt = `Create a 15-question mixed-format final exam for the course "${course.title}". Course description: ${course.description || "N/A"}`;
        const examData = await callAI(examSystemPrompt, userPrompt);

        const { error: upsertErr } = await serviceClient
          .from("course_final_exams")
          .upsert(
            {
              course_id: course.id,
              title: examData.title || `Final Exam: ${course.title}`,
              instructions: examData.instructions || "Answer all questions to the best of your ability.",
              passing_score: examData.passingScore || 70,
              question_count: examData.questions?.length || 15,
              questions: examData.questions || [],
            },
            { onConflict: "course_id" }
          );

        if (upsertErr) throw upsertErr;
        results.exams.push({ courseId: course.id, title: course.title, questionCount: examData.questions?.length });
      } catch (err: any) {
        results.errors.push({ type: "exam", courseId: course.id, title: course.title, error: err.message });
      }
    }

    // ── Generate essays sequentially ────────────────────────────
    for (const course of needEssay) {
      try {
        const userPrompt = `Create a final essay assignment for the course "${course.title}". Course description: ${course.description || "N/A"}`;
        const essayData = await callAI(essaySystemPrompt, userPrompt);

        const { error: upsertErr } = await serviceClient
          .from("course_essays")
          .upsert(
            {
              course_id: course.id,
              title: essayData.title || `Final Essay: ${course.title}`,
              prompts: essayData.prompts || [],
              rubric: essayData.rubric || { criteria: [], totalPoints: 100 },
              word_limit: essayData.wordLimit || 1500,
            },
            { onConflict: "course_id" }
          );

        if (upsertErr) throw upsertErr;
        results.essays.push({ courseId: course.id, title: course.title, promptCount: essayData.prompts?.length });
      } catch (err: any) {
        results.errors.push({ type: "essay", courseId: course.id, title: course.title, error: err.message });
      }
    }

    // ── Summary ─────────────────────────────────────────────────
    const skippedExams = (courses || []).length - needExam.length;
    const skippedEssays = (courses || []).length - needEssay.length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          examsGenerated: results.exams.length,
          examsSkipped: skippedExams,
          essaysGenerated: results.essays.length,
          essaysSkipped: skippedEssays,
          errors: results.errors.length,
        },
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
