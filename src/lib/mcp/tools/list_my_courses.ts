import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

/**
 * Returns courses the signed-in user has purchased, along with a
 * lightweight progress summary (completed vs total lessons).
 */
function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_my_courses",
  title: "List my courses",
  description:
    "List the SoloSuccess Academy courses the signed-in user has purchased, with completion progress.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const { data: purchases, error: pErr } = await sb
      .from("purchases")
      .select("course_id, created_at, courses!inner(id, title, subtitle, phase, order_number)")
      .eq("user_id", userId);

    if (pErr) {
      return { content: [{ type: "text", text: pErr.message }], isError: true };
    }

    const courseIds = (purchases ?? []).map((p: any) => p.course_id);
    let progressByCourse: Record<string, { completed: number; total: number }> = {};

    if (courseIds.length > 0) {
      const { data: lessons } = await sb
        .from("lessons")
        .select("id, course_id")
        .in("course_id", courseIds)
        .eq("is_published", true);

      const lessonIds = (lessons ?? []).map((l: any) => l.id);
      const lessonToCourse: Record<string, string> = {};
      (lessons ?? []).forEach((l: any) => {
        lessonToCourse[l.id] = l.course_id;
        progressByCourse[l.course_id] ??= { completed: 0, total: 0 };
        progressByCourse[l.course_id].total += 1;
      });

      if (lessonIds.length > 0) {
        const { data: progress } = await sb
          .from("user_progress")
          .select("lesson_id, completed")
          .eq("user_id", userId)
          .in("lesson_id", lessonIds);

        (progress ?? []).forEach((row: any) => {
          if (!row.completed) return;
          const cid = lessonToCourse[row.lesson_id];
          if (cid && progressByCourse[cid]) progressByCourse[cid].completed += 1;
        });
      }
    }

    const items = (purchases ?? []).map((p: any) => {
      const prog = progressByCourse[p.course_id] ?? { completed: 0, total: 0 };
      return {
        course_id: p.course_id,
        title: p.courses?.title,
        subtitle: p.courses?.subtitle,
        phase: p.courses?.phase,
        order_number: p.courses?.order_number,
        purchased_at: p.created_at,
        lessons_completed: prog.completed,
        lessons_total: prog.total,
        percent_complete: prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0,
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { courses: items },
    };
  },
});