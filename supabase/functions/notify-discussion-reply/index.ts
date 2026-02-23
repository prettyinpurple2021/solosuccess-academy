import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");
  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error("SMTP credentials not configured");
  }
  const { SmtpClient } = await import("https://deno.land/x/smtp@v0.7.0/mod.ts");
  const client = new SmtpClient();
  await client.connectTLS({
    hostname: smtpHost,
    port: smtpPort,
    username: smtpUser,
    password: smtpPassword,
  });
  await client.send({
    from: smtpUser,
    to,
    subject,
    content: "Please view this email in an HTML-compatible email client.",
    html,
  });
  await client.close();
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const claimsData = { claims: { sub: userData.user.id } };

    const body = await req.json() as { discussionId: string; commentId: string };
    const { discussionId, commentId } = body;
    if (!discussionId || !commentId) {
      return new Response(
        JSON.stringify({ error: "discussionId and commentId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: discussion, error: discError } = await supabase
      .from("discussions")
      .select("id, user_id, title, course_id")
      .eq("id", discussionId)
      .single();
    if (discError || !discussion) {
      return new Response(
        JSON.stringify({ error: "Discussion not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const commenterId = claimsData.claims.sub as string;
    const authorId = discussion.user_id as string;
    if (authorId === commenterId) {
      return new Response(
        JSON.stringify({ message: "No self-notification" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: comment, error: commentError } = await supabase
      .from("discussion_comments")
      .select("id, content, user_id")
      .eq("id", commentId)
      .single();
    if (commentError || !comment) {
      return new Response(
        JSON.stringify({ error: "Comment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: commenterProfile } = await supabase
      .from("profiles_public" as any)
      .select("display_name")
      .eq("id", commenterId)
      .single() as { data: { display_name: string | null } | null };
    const commenterName = commenterProfile?.display_name || "Someone";
    const preview = (comment.content as string).slice(0, 120);
    const link = `/courses/${discussion.course_id}/discussions/${discussionId}`;
    const title = `New reply on "${discussion.title}"`;
    const message = `${commenterName} replied: ${preview}${preview.length >= 120 ? "…" : ""}`;

    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: authorId,
      type: "discussion_reply",
      title,
      message,
      link,
    });
    if (notifError) {
      console.error("Failed to create in-app notification:", notifError);
    }

    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("display_name, email_notifications, discussion_replies")
      .eq("id", authorId)
      .single();
    if (authorProfile?.email_notifications && authorProfile?.discussion_replies) {
      const { data: authorUser } = await supabase.auth.admin.getUserById(authorId);
      if (authorUser?.user?.email) {
        const authorName = authorProfile.display_name || authorUser.user.email.split("@")[0];
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B5CF6, #06B6D4); padding: 20px; border-radius: 8px 8px 0 0; }
              .header h1 { color: white; margin: 0; font-size: 22px; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
              .quote { background: white; padding: 12px; border-left: 4px solid #8B5CF6; margin: 12px 0; border-radius: 0 4px 4px 0; }
              .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💬 New reply on your discussion</h1>
              </div>
              <div class="content">
                <p>Hi ${authorName},</p>
                <p><strong>${commenterName}</strong> replied to your discussion <strong>${discussion.title}</strong>.</p>
                <div class="quote">${preview}${preview.length >= 120 ? "…" : ""}</div>
                <a href="${Deno.env.get("SITE_URL") || "https://solosuccess.academy"}${link}" class="button">View reply</a>
              </div>
            </div>
          </body>
          </html>
        `;
        try {
          await sendEmail(authorUser.user.email, title, html);
        } catch (e) {
          console.error("Failed to send discussion reply email:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in notify-discussion-reply:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
