/**
 * @file bulk-generate-supplemental/index.ts — Batch Supplemental Content Generator
 *
 * PURPOSE: For lessons that are MISSING quiz_data, worksheet_data, or activity_data,
 * this function generates all three supplemental items per lesson in a single batch call.
 * Supports a "force" flag to regenerate existing content with richer quality.
 *
 * HOW IT WORKS:
 * 1. Admin triggers the function from the AdminDashboard
 * 2. Finds up to BATCH_SIZE lessons missing any supplemental data (or all if force=true)
 * 3. For each lesson, generates quiz + worksheet + activity via AI
 * 4. Saves all three to the lessons table
 * 5. Returns remaining count so the client can loop until done
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

// Process 1 lesson per call (generates 3 AI requests) to avoid timeouts
const BATCH_SIZE = 1;

/** Call the Lovable AI gateway and return the raw text response */
async function callAI(apiKey: string, system: string, user: string): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No content returned from AI");
  return text;
}

/** Extract JSON from a response that may be wrapped in markdown code blocks */
function extractJSON(text: string): any {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;
  return JSON.parse(jsonStr.trim());
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // --- Parse request body ---
    const body = await req.json().catch(() => ({}));
    const force = body.force === true;
    // Track already-processed lesson IDs to avoid re-processing in the same loop
    const processedIds: string[] = body.processedIds || [];

    // --- Use service role for DB reads/writes ---
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Find lessons needing supplemental content ---
    let query = serviceClient
      .from("lessons")
      .select("id, title, type, content, course_id, quiz_data, worksheet_data, activity_data")
      .eq("is_published", true);

    // In normal mode, only find lessons missing supplemental data
    if (!force) {
      query = query.or("quiz_data.is.null,worksheet_data.is.null,activity_data.is.null");
    }

    // Exclude already-processed IDs so the loop makes progress
    if (processedIds.length > 0) {
      query = query.not("id", "in", `(${processedIds.join(",")})`);
    }

    const { data: lessons, error: lessonsErr } = await query.limit(BATCH_SIZE);
    if (lessonsErr) throw new Error(lessonsErr.message);

    // Filter to lessons that actually need work
    const needsSupplemental = (lessons || []).filter((l: any) =>
      force ? true : (!l.quiz_data || !l.worksheet_data || !l.activity_data)
    );

    if (needsSupplemental.length === 0) {
      return new Response(
        JSON.stringify({ message: "No lessons need supplemental content", processed: 0, remaining: 0, processedIds }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Fetch course context for each lesson ---
    const courseIds = [...new Set(needsSupplemental.map((l: any) => l.course_id))];
    const { data: courses } = await serviceClient
      .from("courses")
      .select("id, title, description")
      .in("id", courseIds);

    const courseMap = Object.fromEntries((courses || []).map((c: any) => [c.id, c]));

    const results: any[] = [];
    const newProcessedIds = [...processedIds];

    for (const lesson of needsSupplemental) {
      const course = courseMap[lesson.course_id] || { title: "SoloSuccess Academy", description: "" };

      // Truncate content to first 1500 chars as context
      const contentSnippet = (lesson.content || "").substring(0, 1500);

      const updatePayload: any = { updated_at: new Date().toISOString() };
      const generated: string[] = [];

      // --- Generate QUIZ (if missing or force mode) ---
      if (!lesson.quiz_data || force) {
        try {
          const quizText = await callAI(
            LOVABLE_API_KEY,
            `You are an expert educational content creator for SoloSuccess Academy. Generate a high-quality quiz that tests practical understanding.

IMPORTANT: Create engaging, scenario-based questions that go beyond simple recall. Include real-world situations a solo entrepreneur would face.

Return ONLY valid JSON in this exact structure:
{
  "questions": [
    {
      "question": "Scenario-based question that tests applied knowledge...",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of WHY this is correct, with a practical tip the student can use immediately."
    }
  ]
}

RULES:
- Exactly 5 questions
- Mix question types: 2 scenario-based, 1 "which is NOT", 1 best-practice, 1 definition/concept
- Explanations should be 2-3 sentences with actionable insight
- Options should be plausible — avoid obviously wrong answers
- Return ONLY valid JSON, no markdown wrapping`,
            `Create a 5-question quiz for the lesson "${lesson.title}" in the course "${course.title}".
Course description: ${course.description}
Lesson content excerpt: ${contentSnippet}

Make questions test APPLIED knowledge — what would a solo founder actually DO with this information?`
          );
          try {
            updatePayload.quiz_data = extractJSON(quizText);
            generated.push("quiz");
          } catch {
            updatePayload.quiz_data = { raw: quizText };
            generated.push("quiz(raw)");
          }
        } catch (err) {
          console.error(`Quiz generation failed for "${lesson.title}":`, err);
        }
      }

      // Small delay between AI calls to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));

      // --- Generate WORKSHEET (if missing or force mode) ---
      if (!lesson.worksheet_data || force) {
        try {
          const worksheetText = await callAI(
            LOVABLE_API_KEY,
            `You are an expert educational content creator for SoloSuccess Academy. Generate a rich, practical worksheet.

Return ONLY valid JSON in this exact structure:
{
  "title": "Worksheet title related to the lesson",
  "instructions": "Clear 2-3 sentence overview of what the student will accomplish. Include a motivating statement.",
  "sections": [
    {
      "title": "Section Title (action-oriented, e.g. 'Map Your Target Audience')",
      "description": "Brief explanation of why this section matters and what they'll create.",
      "exercises": [
        {
          "type": "text",
          "prompt": "Detailed, specific prompt that guides the student step-by-step. Include an example of what a good answer looks like.",
          "hints": "💡 Pro tip or helpful hint to get started"
        }
      ]
    }
  ]
}

RULES:
- 3 sections, each with 2-3 exercises
- Each exercise prompt should be 2-4 sentences with specific guidance
- Include at least one exercise per section that asks the student to create something tangible (a list, a draft, a plan)
- Hints should include emoji for visual appeal (💡, 🎯, 📌, ✅)
- Section titles should be action verbs: "Define...", "Build...", "Analyze...", "Create..."
- Return ONLY valid JSON, no markdown`,
            `Create a hands-on worksheet for the lesson "${lesson.title}" in the course "${course.title}".
Course description: ${course.description}
Lesson content excerpt: ${contentSnippet}

The worksheet should help a solo entrepreneur BUILD something real — not just answer questions. Each exercise should produce a tangible output they can use in their business.`
          );
          try {
            updatePayload.worksheet_data = extractJSON(worksheetText);
            generated.push("worksheet");
          } catch {
            updatePayload.worksheet_data = { raw: worksheetText };
            generated.push("worksheet(raw)");
          }
        } catch (err) {
          console.error(`Worksheet generation failed for "${lesson.title}":`, err);
        }
      }

      await new Promise(r => setTimeout(r, 500));

      // --- Generate ACTIVITY (if missing or force mode) ---
      if (!lesson.activity_data || force) {
        try {
          const activityText = await callAI(
            LOVABLE_API_KEY,
            `You are an expert educational content creator for SoloSuccess Academy. Generate an engaging, hands-on activity.

Return ONLY valid JSON in this exact structure:
{
  "title": "Engaging activity title (action-oriented)",
  "description": "2-3 sentence overview of what the student will accomplish. Be motivating and specific about the outcome.",
  "objectives": [
    "By the end, you'll have [specific tangible outcome]",
    "You'll understand [key concept] well enough to [apply it]",
    "You'll create [deliverable] you can use immediately"
  ],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Action-Oriented Step Title",
      "instructions": "Detailed 3-5 sentence instructions. Be specific about WHAT to do, HOW to do it, and what a good result looks like. Include an example if helpful.",
      "duration": "10 minutes",
      "deliverable": "What the student should have after completing this step"
    }
  ],
  "reflection": "2-3 thoughtful reflection questions that help the student connect this activity to their business goals. Format as: 1) Question one? 2) Question two? 3) Question three?"
}

RULES:
- 4-5 steps, building progressively (each step builds on the previous)
- Total duration: 30-60 minutes
- Each step should produce something tangible
- Include specific examples or templates in the instructions
- The final step should be about putting it all together
- Objectives should use measurable language
- Return ONLY valid JSON, no markdown`,
            `Create an immersive hands-on activity for the lesson "${lesson.title}" in the course "${course.title}".
Course description: ${course.description}
Lesson content excerpt: ${contentSnippet}

This should be a REAL business exercise, not a theoretical one. The student should walk away with something they can use in their solo business TODAY.`
          );
          try {
            updatePayload.activity_data = extractJSON(activityText);
            generated.push("activity");
          } catch {
            updatePayload.activity_data = { raw: activityText };
            generated.push("activity(raw)");
          }
        } catch (err) {
          console.error(`Activity generation failed for "${lesson.title}":`, err);
        }
      }

      // --- Save all generated data to DB ---
      const { error: updateErr } = await serviceClient
        .from("lessons")
        .update(updatePayload)
        .eq("id", lesson.id);

      newProcessedIds.push(lesson.id);

      if (updateErr) {
        results.push({ id: lesson.id, title: lesson.title, status: "error", error: updateErr.message });
      } else {
        results.push({
          id: lesson.id,
          title: lesson.title,
          status: "success",
          generated,
        });
      }
    }

    // --- Count remaining lessons that still need supplemental content ---
    let remainingCount = 0;
    if (force) {
      // In force mode, count total published lessons minus processed ones
      const { count } = await serviceClient
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .not("id", "in", `(${newProcessedIds.join(",")})`);
      remainingCount = count || 0;
    } else {
      const { data: allRemaining } = await serviceClient
        .from("lessons")
        .select("id, quiz_data, worksheet_data, activity_data")
        .eq("is_published", true);
      remainingCount = (allRemaining || []).filter(
        (l: any) => !l.quiz_data || !l.worksheet_data || !l.activity_data
      ).length;
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} lessons`,
        processed: results.length,
        remaining: remainingCount,
        results,
        processedIds: newProcessedIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("bulk-generate-supplemental error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
