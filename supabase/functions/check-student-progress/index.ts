import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

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
    to: to,
    subject: subject,
    content: "Please view this email in an HTML-compatible email client.",
    html: html,
  });

  await client.close();
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Create service-role client for data access (used after auth for admin APIs)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey!
    );

    // Authorization:
    // - Allow internal cron/backend calls authenticated with CRON_JOB_SECRET.
    // - Allow manual invocations only for authenticated admin users.
    // This function reads all enrolled students and sends emails.
    const authHeader = req.headers.get("Authorization");
    const apiKeyHeader = req.headers.get("apikey");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;
    const cronJobSecret = Deno.env.get("CRON_JOB_SECRET");
    const isCronCall = !!cronJobSecret && cronSecretHeader === cronJobSecret;

    // Never accept service-role key as request auth material.
    if (
      !!serviceRoleKey &&
      (bearerToken === serviceRoleKey || apiKeyHeader === serviceRoleKey)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid credential type" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isCronCall) {
      if (!bearerToken) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: claims, error: claimsError } = await supabase.auth.getUser(bearerToken);
      if (claimsError || !claims.user) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the caller has admin role
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
    }

    // Configuration
    const INACTIVE_DAYS_THRESHOLD = 7; // Days of inactivity before sending reminder
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_DAYS_THRESHOLD);

    // Get all enrolled students (users with purchases)
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select("user_id, course_id");

    if (purchasesError) {
      throw new Error(`Failed to fetch purchases: ${purchasesError.message}`);
    }

    if (!purchases?.length) {
      return new Response(
        JSON.stringify({ message: "No enrolled students found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = [...new Set(purchases.map(p => p.user_id))];

    // Get user progress with last activity
    const { data: progressData, error: progressError } = await supabase
      .from("user_progress")
      .select("user_id, lesson_id, completed, updated_at")
      .in("user_id", userIds);

    if (progressError) {
      throw new Error(`Failed to fetch progress: ${progressError.message}`);
    }

    // Get courses and lessons for context
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title");

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, course_id, title, order_number");

    // Get profiles for notification preferences
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, email_notifications, course_updates")
      .in("id", userIds);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    const notificationsSent: string[] = [];
    const errors: string[] = [];

    // Check each enrolled student
    for (const userId of userIds) {
      try {
        const profile = profiles?.find(p => p.id === userId);
        
        // Skip if notifications are disabled
        if (!profile?.email_notifications || !profile?.course_updates) {
          continue;
        }

        const userProgress = progressData?.filter(p => p.user_id === userId) || [];
        const userPurchases = purchases.filter(p => p.user_id === userId);

        // Find last activity date
        const lastActivity = userProgress
          .map(p => new Date(p.updated_at))
          .sort((a, b) => b.getTime() - a.getTime())[0];

        // Check if user is inactive
        const isInactive = !lastActivity || lastActivity < cutoffDate;

        if (!isInactive) {
          continue; // User is active, no reminder needed
        }

        // Calculate days inactive
        const daysInactive = lastActivity 
          ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
          : INACTIVE_DAYS_THRESHOLD;

        // Calculate incomplete lessons and find next lesson (first incomplete by order)
        let totalIncomplete = 0;
        let primaryCourseTitle = "";
        let nextLessonTitle: string | null = null;
        let nextLessonCourseId: string | null = null;
        let nextLessonId: string | null = null;

        for (const purchase of userPurchases) {
          const courseLessons = (lessons?.filter(l => l.course_id === purchase.course_id) || [])
            .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0));
          const completedLessonIds = new Set(
            userProgress
              .filter(p => p.completed && courseLessons.some(l => l.id === p.lesson_id))
              .map(p => p.lesson_id)
          );
          const incomplete = courseLessons.length - completedLessonIds.size;
          totalIncomplete += incomplete;

          if (!primaryCourseTitle && incomplete > 0) {
            const course = courses?.find(c => c.id === purchase.course_id);
            primaryCourseTitle = course?.title || "your course";
          }
          // First incomplete lesson in this course is "next lesson"
          if (!nextLessonTitle && incomplete > 0) {
            const firstIncomplete = courseLessons.find(l => !completedLessonIds.has(l.id));
            if (firstIncomplete) {
              nextLessonTitle = (firstIncomplete as { title?: string }).title ?? "Next lesson";
              nextLessonCourseId = purchase.course_id;
              nextLessonId = firstIncomplete.id;
            }
          }
        }

        if (totalIncomplete === 0) {
          continue; // User has completed everything
        }

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        if (!userData?.user?.email) {
          continue;
        }

        const studentName = profile.display_name || userData.user.email.split("@")[0];
        const nextLessonBlurb = nextLessonTitle
          ? `<p><strong>Next lesson:</strong> <span class="stat">${nextLessonTitle}</span> in ${primaryCourseTitle}</p>`
          : "";
        const notificationLink = nextLessonCourseId && nextLessonId
          ? `/courses/${nextLessonCourseId}/lessons/${nextLessonId}`
          : "/courses";
        const notificationMessage = nextLessonTitle
          ? `You haven't been active for ${daysInactive} days. Next up: "${nextLessonTitle}" in ${primaryCourseTitle}.`
          : `You haven't been active for ${daysInactive} days. You have ${totalIncomplete} lesson${totalIncomplete !== 1 ? 's' : ''} waiting in ${primaryCourseTitle}.`;

        // Send reminder email
        const subject = "Don't fall behind - continue your learning journey!";
        const html = `
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
              .cta { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Time to Get Back on Track!</h1>
              </div>
              <div class="content">
                <p>Hi ${studentName},</p>
                <p>We noticed you haven't been active for <span class="stat">${daysInactive} days</span>.</p>
                <p>You have <span class="stat">${totalIncomplete} lesson${totalIncomplete !== 1 ? 's' : ''}</span> waiting for you in <strong>${primaryCourseTitle}</strong>.</p>
                ${nextLessonBlurb}
                <p>Just a few minutes a day can help you reach your goals! 🚀</p>
                <p>Your learning journey is important to us. Pick up where you left off today!</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Create in-app notification
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            type: "progress_reminder",
            title: "Time to get back on track!",
            message: notificationMessage,
            link: notificationLink,
          });

        if (notificationError) {
          console.error("Failed to create in-app notification:", notificationError);
        }

        await sendEmail(userData.user.email, subject, html);
        notificationsSent.push(userData.user.email);
        console.log(`Progress reminder sent to ${userData.user.email}`);
      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : "Unknown error";
        errors.push(`User ${userId}: ${errorMessage}`);
        console.error(`Failed to process user ${userId}:`, userError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notificationsSent.length,
        recipients: notificationsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in check-student-progress:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
