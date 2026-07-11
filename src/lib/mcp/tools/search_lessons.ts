import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_lessons",
  title: "Search my lessons",
  description:
    "Search published lesson titles and descriptions across the courses the signed-in user has purchased.",
  inputSchema: {
    query: z.string().min(1).describe("Keyword or phrase to search lesson titles and descriptions for."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum results to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const max = limit ?? 20;

    const { data: purchases } = await sb
      .from("purchases")
      .select("course_id")
      .eq("user_id", ctx.getUserId());
    const courseIds = (purchases ?? []).map((p: any) => p.course_id);
    if (courseIds.length === 0) {
      return {
        content: [{ type: "text", text: "You have not purchased any courses yet." }],
        structuredContent: { lessons: [] },
      };
    }

    const like = `%${query.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    const { data, error } = await sb
      .from("lessons")
      .select("id, course_id, title, description, type, order_number, duration_minutes")
      .in("course_id", courseIds)
      .eq("is_published", true)
      .or(`title.ilike.${like},description.ilike.${like}`)
      .order("order_number", { ascending: true })
      .limit(max);

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { lessons: data ?? [] },
    };
  },
});