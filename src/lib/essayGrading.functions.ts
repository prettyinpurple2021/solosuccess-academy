/**
 * Server-side essay grading.
 *
 * WHY THIS EXISTS (security):
 * Grading columns on `student_essay_submissions` (ai_score, ai_feedback,
 * ai_rubric_scores, admin_score, ...) are locked down by a database trigger so
 * a student can never write their own grade from the browser. Grading therefore
 * has to happen here, on the server, where we:
 *   1. verify the caller is signed in (requireSupabaseAuth),
 *   2. verify they own the submission (or are an admin),
 *   3. read the prompt/rubric/essay text from the database (never from the client),
 *   4. ask the AI for a score, clamp it, and save it with the privileged client.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Only the submission id is accepted from the client — everything else is trusted server data. */
const inputSchema = z.object({
  submissionId: z.string().uuid(),
});

export const gradeEssaySubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Privileged client is imported inside the handler so it never reaches the browser bundle
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const userId = context.userId;

    // 1. Load the submission
    const { data: submission, error: subError } = await supabaseAdmin
      .from("student_essay_submissions" as any)
      .select("*")
      .eq("id", data.submissionId)
      .maybeSingle();

    if (subError) throw new Error("Could not load the submission");
    if (!submission) throw new Error("Submission not found");

    const row = submission as any;

    // 2. Ownership check — students grade only their own work; admins may grade any
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role" as any, {
      _user_id: userId,
      _role: "admin",
    });

    if (row.user_id !== userId && !isAdmin) {
      throw new Error("Not authorized to grade this submission");
    }

    // 3. Load the trusted prompt + rubric
    const { data: essay } = await supabaseAdmin
      .from("course_essays" as any)
      .select("*")
      .eq("id", row.essay_id)
      .maybeSingle();

    if (!essay) throw new Error("Essay configuration not found");

    const essayRow = essay as any;
    const prompts = (essayRow.prompts ?? []) as Array<{ title: string; description: string }>;
    const prompt = prompts[row.selected_prompt_index ?? 0] ?? prompts[0];
    const rubric = (essayRow.rubric ?? { criteria: [], totalPoints: 100 }) as {
      criteria: Array<{ name: string; description: string; maxPoints: number }>;
      totalPoints: number;
    };

    const essayContent = String(row.content ?? "").slice(0, 20000);

    // 4. Ask the AI for a rubric-based assessment
    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    if (!LOVABLE_API_KEY) throw new Error("AI service is not configured");

    const userPrompt = `Grade the following student essay.

ESSAY PROMPT: "${prompt?.title ?? "Final essay"}" — ${prompt?.description ?? ""}

RUBRIC CRITERIA:
${rubric.criteria.map((c) => `- ${c.name} (${c.maxPoints} pts): ${c.description}`).join("\n")}

Total possible points: ${rubric.totalPoints}

STUDENT ESSAY:
---
${essayContent}
---

Return JSON only:
{
  "totalScore": <number out of ${rubric.totalPoints}>,
  "percentage": <0-100>,
  "criteriaScores": [{ "name": "<criterion>", "score": <number>, "maxScore": <number>, "feedback": "<feedback>" }],
  "overallFeedback": "<2-3 paragraphs of constructive feedback>",
  "strengths": ["..."],
  "improvements": ["..."]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a strict but encouraging academic grader. Respond with valid JSON only.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error", response.status);
      throw new Error(
        response.status === 429
          ? "Too many grading requests right now. Please try again shortly."
          : "The grading service is temporarily unavailable",
      );
    }

    const aiResponse: any = await response.json();
    const raw: string = aiResponse?.choices?.[0]?.message?.content ?? "";
    // Models sometimes wrap JSON in a markdown fence — strip it before parsing
    const jsonText = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

    let grade: any;
    try {
      grade = JSON.parse(jsonText);
    } catch {
      console.error("Malformed AI grading response");
      throw new Error("The grading service returned an unreadable result");
    }

    // 5. Clamp the score server-side so a bad model response can't inflate it
    const percentage = Math.max(
      0,
      Math.min(100, Math.round(Number(grade.percentage ?? grade.totalScore ?? 0))),
    );

    const { error: updateError } = await supabaseAdmin
      .from("student_essay_submissions" as any)
      .update({
        ai_score: percentage,
        ai_feedback: grade.overallFeedback ?? null,
        ai_rubric_scores: grade,
        ai_graded_at: new Date().toISOString(),
      } as any)
      .eq("id", data.submissionId);

    if (updateError) {
      console.error("Failed to save essay grade", updateError);
      throw new Error("Could not save the grade");
    }

    return { ...grade, percentage };
  });
