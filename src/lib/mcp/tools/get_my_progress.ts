import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_my_progress",
  title: "Get my learning progress",
  description:
    "Get the signed-in user's total XP, current learning streak, longest streak, and profile display name.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [gamRes, profileRes] = await Promise.all([
      sb
        .from("user_gamification")
        .select("total_xp, current_streak, longest_streak, last_activity_date")
        .eq("user_id", userId)
        .maybeSingle(),
      sb.from("profiles").select("display_name, full_name").eq("id", userId).maybeSingle(),
    ]);

    const summary = {
      user_id: userId,
      email: ctx.getUserEmail?.() ?? null,
      display_name:
        (profileRes.data as any)?.display_name ?? (profileRes.data as any)?.full_name ?? null,
      total_xp: gamRes.data?.total_xp ?? 0,
      current_streak_days: gamRes.data?.current_streak ?? 0,
      longest_streak_days: gamRes.data?.longest_streak ?? 0,
      last_activity_date: gamRes.data?.last_activity_date ?? null,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});