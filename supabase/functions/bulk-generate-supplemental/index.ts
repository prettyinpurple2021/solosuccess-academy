/**
 * @file bulk-generate-supplemental/index.ts — Batch Supplemental Content Generator
 *
 * PURPOSE: For text-type lessons that already have content but are MISSING
 * quiz_data, worksheet_data, or activity_data, this function generates all
 * three supplemental items per lesson in a single batch call.
 *
 * HOW IT WORKS:
 * 1. Admin triggers the function from the AdminDashboard
 * 2. Finds up to BATCH_SIZE text lessons missing any supplemental data
 * 3. For each lesson, generates quiz + worksheet + activity via AI
 * 4. Saves all three to the lessons table
 * 5. Returns remaining count so the client can loop until done
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Process 1 lesson per call (generates 3 AI requests = 3 total per call) to avoid timeouts
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
      max_tokens: 3000,
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth: verify admin ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = claimsData.claims.sub as string;

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // --- Use service role for DB reads/writes ---
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Find text-type lessons missing supplemental content ---
    // A lesson needs supplemental work if it's missing quiz_data OR worksheet_data OR activity_data
    const { data: lessons, error: lessonsErr } = await serviceClient
      .from("lessons")
      .select("id, title, type, content, course_id, quiz_data, worksheet_data, activity_data")
      .eq("is_published", true)
      .eq("type", "text") // Only target text lessons — quizzes/activities/worksheets are separate types
      .or("quiz_data.is.null,worksheet_data.is.null,activity_data.is.null")
      .limit(BATCH_SIZE);

    if (lessonsErr) throw new Error(lessonsErr.message);

    // Filter to lessons actually missing at least one supplemental item
    const needsSupplemental = (lessons || []).filter(
      (l: any) => !l.quiz_data || !l.worksheet_data || !l.activity_data
    );

    if (needsSupplemental.length === 0) {
      // Count total remaining across all courses
      const { data: allLessons } = await serviceClient
        .from("lessons")
        .select("id, quiz_data, worksheet_data, activity_data")
        .eq("is_published", true)
        .eq("type", "text");

      const remaining = (allLessons || []).filter(
        (l: any) => !l.quiz_data || !l.worksheet_data || !l.activity_data
      ).length;

      return new Response(
        JSON.stringify({ message: "No lessons need supplemental content", processed: 0, remaining }),
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

    for (const lesson of needsSupplemental) {
      const course = courseMap[lesson.course_id] || { title: "SoloSuccess Academy", description: "" };

      // Truncate content to first 1000 chars as context (saves tokens)
      const contentSnippet = (lesson.content || "").substring(0, 1000);

      const updatePayload: any = { updated_at: new Date().toISOString() };
      const generated: string[] = [];

      // --- Generate QUIZ (if missing) ---
      if (!lesson.quiz_data) {
        try {
          const quizText = await callAI(
            LOVABLE_API_KEY,
            `You are an expert educational content creator for SoloSuccess Academy. Generate a quiz as a JSON object with this exact structure:
{"questions":[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correctIndex":0,"explanation":"..."}]}
Include exactly 5 questions. Questions must test practical understanding of the lesson content. Return ONLY valid JSON, no markdown.`,
            `Create a 5-question quiz for the lesson "${lesson.title}" in the course "${course.title}".
Course description: ${course.description}
Lesson content excerpt: ${contentSnippet}
Focus on practical, actionable knowledge for solo entrepreneurs.`
          );
          try {
            updatePayload.quiz_data = extractJSON(quizText);
            generated.push("quiz");
          } catch {
            // Store raw if JSON parse fails — better than nothing
            updatePayload.quiz_data = { raw: quizText };
            generated.push("quiz(raw)");
          }
        } catch (err) {
          console.error(`Quiz generation failed for "${lesson.title}":`, err);
        }
      }

      // Small delay between AI calls to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));

      // --- Generate WORKSHEET (if missing) ---
      if (!lesson.worksheet_data) {
        try {
          const worksheetText = await callAI(
            LOVABLE_API_KEY,
            `You are an expert educational content creator for SoloSuccess Academy. Generate a worksheet as a JSON object with this exact structure:
{"title":"...","instructions":"...","sections":[{"title":"...","description":"...","exercises":[{"type":"text","prompt":"...","hints":"..."}]}]}
Include 2-3 sections, each with 2-3 exercises. Exercises should be practical and help students apply the lesson immediately. Return ONLY valid JSON, no markdown.`,
            `Create a practical worksheet for the lesson "${lesson.title}" in the course "${course.title}".
Course description: ${course.description}
Lesson content excerpt: ${contentSnippet}
Make exercises immediately actionable for a solo entrepreneur.`
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

      // --- Generate ACTIVITY (if missing) ---
      if (!lesson.activity_data) {
        try {
          const activityText = await callAI(
            LOVABLE_API_KEY,
            `You are an expert educational content creator for SoloSuccess Academy. Generate a hands-on activity as a JSON object with this exact structure:
{"title":"...","description":"...","objectives":["..."],"steps":[{"stepNumber":1,"title":"...","instructions":"...","duration":"...","deliverable":"..."}],"reflection":"..."}
Include 3-5 steps. Make it a 30-60 minute hands-on activity a solo founder can complete today. Return ONLY valid JSON, no markdown.`,
            `Create a hands-on activity for the lesson "${lesson.title}" in the course "${course.title}".
Course description: ${course.description}
Lesson content excerpt: ${contentSnippet}
Make it practical and immediately applicable for a solo entrepreneur.`
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
    const { data: allRemaining } = await serviceClient
      .from("lessons")
      .select("id, quiz_data, worksheet_data, activity_data")
      .eq("is_published", true)
      .eq("type", "text");

    const remaining = (allRemaining || []).filter(
      (l: any) => !l.quiz_data || !l.worksheet_data || !l.activity_data
    ).length;

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} lessons`,
        processed: results.length,
        remaining,
        results,
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
