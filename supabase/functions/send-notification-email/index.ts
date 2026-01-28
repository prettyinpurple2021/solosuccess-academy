import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailRequest): Promise<void> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");

  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error("SMTP credentials not configured");
  }

  // Use Deno's native SMTP via fetch to a mail service endpoint
  // Since Deno doesn't have native SMTP, we'll use the denopkg smtp library
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
    to: to,
    subject: subject,
    content: "Please view this email in an HTML-compatible email client.",
    html: html,
  });

  await client.close();
}

interface NotificationPayload {
  type: "grade_review" | "progress_reminder";
  userId: string;
  data: {
    studentName?: string;
    lessonTitle?: string;
    courseTitle?: string;
    score?: number;
    adminNotes?: string;
    daysInactive?: number;
    incompleteCount?: number;
  };
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claims.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: NotificationPayload = await req.json();
    const { type, userId, data } = payload;

    // Fetch user email and notification preferences
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    if (!userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email_notifications, course_updates")
      .eq("id", userId)
      .single();

    // Check notification preferences
    if (!profile?.email_notifications) {
      return new Response(
        JSON.stringify({ message: "User has disabled email notifications" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "grade_review" && !profile?.course_updates) {
      return new Response(
        JSON.stringify({ message: "User has disabled course update notifications" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const studentName = profile?.display_name || userData.user.email.split("@")[0];
    let subject = "";
    let html = "";

    if (type === "grade_review") {
      subject = `Your ${data.lessonTitle} has been graded`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .score { font-size: 36px; font-weight: bold; color: #8B5CF6; }
            .notes { background: white; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #8B5CF6; }
            .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Grade Update</h1>
            </div>
            <div class="content">
              <p>Hi ${studentName},</p>
              <p>Your work on <strong>${data.lessonTitle}</strong> in <strong>${data.courseTitle}</strong> has been reviewed!</p>
              <p>Your score: <span class="score">${data.score}%</span></p>
              ${data.adminNotes ? `
                <div class="notes">
                  <strong>Instructor Feedback:</strong>
                  <p>${data.adminNotes}</p>
                </div>
              ` : ""}
              <p>Keep up the great work! 🎉</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === "progress_reminder") {
      subject = "Don't fall behind - continue your learning journey!";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #F59E0B, #EF4444); padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .stat { font-size: 24px; font-weight: bold; color: #F59E0B; }
            .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Time to Get Back on Track!</h1>
            </div>
            <div class="content">
              <p>Hi ${studentName},</p>
              <p>We noticed you haven't been active for <span class="stat">${data.daysInactive} days</span>.</p>
              <p>You have <span class="stat">${data.incompleteCount} lessons</span> waiting for you in <strong>${data.courseTitle}</strong>.</p>
              <p>Just a few minutes a day can help you reach your goals! 🚀</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    await sendEmail({
      to: userData.user.email,
      subject,
      html,
    });

    console.log(`Notification email sent to ${userData.user.email} for type: ${type}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending notification email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
