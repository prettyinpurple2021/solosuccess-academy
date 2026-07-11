import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_my_certificates",
  title: "List my certificates",
  description:
    "List certificates the signed-in user has earned, including course title, issue date, and verification code.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);

    const { data, error } = await sb
      .from("certificates")
      .select("id, course_id, course_title, student_name, issued_at, verification_code, revoked_at")
      .eq("user_id", ctx.getUserId())
      .order("issued_at", { ascending: false });

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    const items = (data ?? []).map((c: any) => ({
      ...c,
      verify_url: `https://solosuccessacademy.app/verify/${c.verification_code}`,
      status: c.revoked_at ? "revoked" : "valid",
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { certificates: items },
    };
  },
});