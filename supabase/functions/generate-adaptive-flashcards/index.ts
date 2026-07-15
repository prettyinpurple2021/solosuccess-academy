// === generate-adaptive-flashcards Edge Function ===
// Adaptive review: when a student's best quiz score for a lesson is
// below the passing threshold (< 70%), auto-generate 3-5 flashcards
// from that lesson's content + the specific questions they missed.
// Idempotent per (user, lesson) via user_flashcards.source_lesson_id.
//
// AUTH: student-authenticated (verify_jwt=false; we validate the JWT
// manually so we can reject anon calls and enforce course ownership).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { requestAiGatewayChatCompletion } from "../_shared/aiGateway.ts";

const AI_MODEL = "google/gemini-3-flash-preview";
const PASSING_THRESHOLD = 70;
const MAX_CARDS = 5;

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsResponse(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401, corsHeaders);
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Invalid token" }, 401, corsHeaders);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const lessonId = String(body?.lessonId ?? "").trim();
    if (!lessonId) return json({ error: "lessonId required" }, 400, corsHeaders);

    // 1) Fetch the lesson (course_id, title, content, quiz_data)
    const { data: lesson, error: lessonErr } = await admin
      .from("lessons")
      .select("id, course_id, title, content, quiz_data")
      .eq("id", lessonId)
      .single();
    if (lessonErr || !lesson) {
      return json({ error: "Lesson not found" }, 404, corsHeaders);
    }

    // 2) Enforce course ownership
    const { data: purchase } = await admin
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", lesson.course_id)
      .maybeSingle();
    if (!purchase) {
      const { data: adminRole } = await admin
        .from("user_roles").select("role")
        .eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (!adminRole) return json({ error: "Not enrolled" }, 403, corsHeaders);
    }

    // 3) Verify the student actually struggled on this lesson
    const { data: progress } = await admin
      .from("user_progress")
      .select("quiz_score")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const score = progress?.quiz_score ?? null;
    if (score === null || score >= PASSING_THRESHOLD) {
      return json({
        skipped: true,
        reason: score === null
          ? "No quiz score recorded"
          : `Score ${score}% is above threshold`,
      }, 200, corsHeaders);
    }

    // 4) Idempotency: don't regenerate if we already made cards for this lesson
    const { count: existingCount } = await admin
      .from("user_flashcards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source_lesson_id", lessonId);
    if ((existingCount ?? 0) > 0) {
      return json({
        skipped: true,
        reason: "Adaptive cards already exist for this lesson",
        existing: existingCount,
      }, 200, corsHeaders);
    }

    // 5) Build the prompt
    const quizData = (lesson.quiz_data as unknown) as
      | { questions?: Array<{ question?: string; options?: string[]; correctAnswer?: number; explanation?: string }> }
      | null;
    const questions = quizData?.questions ?? [];

    const lessonExcerpt = String(lesson.content ?? "").slice(0, 4000);
    const quizSummary = questions.slice(0, 10).map((q, i) => {
      const correct = typeof q.correctAnswer === "number" && q.options
        ? q.options[q.correctAnswer] : "";
      return `Q${i + 1}: ${q.question ?? ""}\nCorrect: ${correct}\n${q.explanation ? `Explanation: ${q.explanation}` : ""}`;
    }).join("\n\n");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500, corsHeaders);

    const systemPrompt = `You are a spaced-repetition coach for SoloSuccess Academy. You create short, high-signal flashcards from lesson material that a student just struggled with. Every card must be answerable from the lesson content alone. Fronts are questions or prompts (max 140 chars). Backs are concise answers or explanations (max 300 chars). Return ONLY a JSON object matching the schema — no prose, no markdown fences.`;

    const userPrompt = `Lesson: "${lesson.title}"

The student scored ${score}% on this lesson's quiz (passing is ${PASSING_THRESHOLD}%). Focus the flashcards on the concepts they most likely missed based on the quiz below.

=== LESSON CONTENT ===
${lessonExcerpt}

=== QUIZ QUESTIONS (with correct answers) ===
${quizSummary || "(no quiz questions available)"}

Return a JSON object with a "cards" array of 3 to ${MAX_CARDS} flashcards:
{
  "cards": [
    { "front": "short question or prompt", "back": "concise answer/explanation" }
  ]
}`;

    const aiRes = await requestAiGatewayChatCompletion({
      apiKey,
      model: AI_MODEL,
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 1500,
    });
    if (!aiRes.ok) {
      console.error("[generate-adaptive-flashcards] AI failed", aiRes);
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 502;
      return json({ error: "AI generation failed", detail: aiRes.errorText?.slice(0, 300) }, status, corsHeaders);
    }

    const raw = aiRes.data?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    const cards: Array<{ front?: unknown; back?: unknown }> = Array.isArray(parsed?.cards) ? parsed.cards : [];
    const cleaned = cards
      .map((c) => ({
        front_text: String(c?.front ?? "").trim().slice(0, 280),
        back_text: String(c?.back ?? "").trim().slice(0, 600),
      }))
      .filter((c) => c.front_text.length > 0 && c.back_text.length > 0)
      .slice(0, MAX_CARDS);

    if (!cleaned.length) {
      return json({ error: "AI returned no usable cards" }, 502, corsHeaders);
    }

    // 6) Insert cards (service role — bypasses RLS but user_id is trusted)
    const rows = cleaned.map((c) => ({
      user_id: userId,
      course_id: lesson.course_id,
      source_lesson_id: lessonId,
      front_text: c.front_text,
      back_text: c.back_text,
    }));

    const { error: insertErr } = await admin.from("user_flashcards").insert(rows);
    if (insertErr) {
      console.error("[generate-adaptive-flashcards] insert failed", insertErr);
      return json({ error: "Failed to save flashcards" }, 500, corsHeaders);
    }

    // 7) Best-effort in-app notification
    await admin.from("notifications").insert({
      user_id: userId,
      type: "adaptive_flashcards_ready",
      title: `${cleaned.length} review cards ready`,
      message: `We created ${cleaned.length} flashcards from "${lesson.title}" to help you master what you missed.`,
      link: `/courses/${lesson.course_id}/flashcards`,
    }).then(() => null, (e) => console.warn("notify failed", e));

    return json({ success: true, created: cleaned.length }, 200, corsHeaders);
  } catch (err) {
    console.error("[generate-adaptive-flashcards] error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Extract JSON even if the model wrapped it in ```json fences.
function extractJson(raw: string): any {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  try { return JSON.parse(candidate); } catch { /* fall through */ }
  // Try to extract the first {...} block
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(candidate.slice(first, last + 1)); } catch { /* ignore */ }
  }
  return null;
}