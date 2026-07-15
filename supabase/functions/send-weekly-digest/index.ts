// === send-weekly-digest Edge Function ===
// Weekly progress digest. For each active enrolled student who has
// email notifications enabled, sends a Monday recap of the previous
// 7 days: XP earned, lessons completed, current streak, and the
// next unfinished lesson across their courses.
//
// Idempotency: one row per (user_id, week_start) in
// lifecycle_emails_sent with kind = 'weekly-digest-YYYY-MM-DD'.
// Concurrent runs cannot double-send.
//
// AUTH: cron-only via x-cron-secret OR authenticated admin.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SITE_URL = "https://solosuccessacademy.app";

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsResponse(req);

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // ── Auth ────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    const apiKeyHeader = req.headers.get("apikey");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;
    const cronJobSecret = Deno.env.get("CRON_JOB_SECRET");
    const isCronCall = !!cronJobSecret && cronSecretHeader === cronJobSecret;

    if (bearerToken === serviceRoleKey || apiKeyHeader === serviceRoleKey) {
      return json({ error: "Invalid credential type" }, 401, corsHeaders);
    }
    if (!isCronCall) {
      if (!bearerToken) return json({ error: "Unauthorized" }, 401, corsHeaders);
      const { data: claims, error: claimsErr } = await supabase.auth.getUser(bearerToken);
      if (claimsErr || !claims.user) return json({ error: "Invalid token" }, 401, corsHeaders);
      const { data: roleData } = await supabase.from("user_roles")
        .select("role").eq("user_id", claims.user.id).eq("role", "admin").single();
      if (!roleData) return json({ error: "Admin access required" }, 403, corsHeaders);
    }

    // ── Compute the week window (previous Mon 00:00 UTC → Sun 23:59 UTC) ─
    const now = new Date();
    const dow = now.getUTCDay(); // 0=Sun..6=Sat
    // Days since previous Monday (start of last week)
    const daysSinceMonday = ((dow + 6) % 7) + 7;
    const weekStart = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday,
    ));
    const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
    const weekStartIso = weekStart.toISOString().slice(0, 10);
    const kind = `weekly-digest-${weekStartIso}`;
    const weekLabel = formatWeekLabel(weekStart, new Date(weekEnd.getTime() - 86_400_000));

    // ── Base data ───────────────────────────────────────────────────
    const [purchasesRes, coursesRes, lessonsRes] = await Promise.all([
      supabase.from("purchases").select("user_id, course_id"),
      supabase.from("courses").select("id, title, order_number"),
      supabase.from("lessons")
        .select("id, course_id, title, order_number, is_published")
        .eq("is_published", true),
    ]);
    if (purchasesRes.error) throw new Error(`purchases: ${purchasesRes.error.message}`);
    if (coursesRes.error) throw new Error(`courses: ${coursesRes.error.message}`);
    if (lessonsRes.error) throw new Error(`lessons: ${lessonsRes.error.message}`);

    const purchases = purchasesRes.data ?? [];
    const courses = coursesRes.data ?? [];
    const lessons = lessonsRes.data ?? [];
    if (!purchases.length) return jsonOk({ sent: 0, message: "No enrolled students" }, corsHeaders);

    const userIds = [...new Set(purchases.map((p) => p.user_id))];

    const [profilesRes, progressRes, gamificationRes, activityRes] = await Promise.all([
      supabase.from("profiles")
        .select("id, display_name, email_notifications, course_updates")
        .in("id", userIds),
      supabase.from("user_progress")
        .select("user_id, lesson_id, completed, updated_at")
        .in("user_id", userIds),
      supabase.from("user_gamification")
        .select("user_id, total_xp, current_streak")
        .in("user_id", userIds),
      supabase.from("user_activity_days")
        .select("user_id, activity_date, xp_earned")
        .in("user_id", userIds)
        .gte("activity_date", weekStartIso)
        .lt("activity_date", weekEnd.toISOString().slice(0, 10)),
    ]);
    if (profilesRes.error) throw new Error(`profiles: ${profilesRes.error.message}`);

    const profiles = profilesRes.data ?? [];
    const progress = progressRes.data ?? [];
    const gamification = gamificationRes.data ?? [];
    const activity = activityRes.data ?? [];

    // Lessons by course, sorted
    const lessonsByCourse = new Map<string, Array<{ id: string; title: string; order_number: number }>>();
    for (const l of lessons) {
      const arr = lessonsByCourse.get(l.course_id) ?? [];
      arr.push({ id: l.id, title: l.title, order_number: l.order_number ?? 0 });
      lessonsByCourse.set(l.course_id, arr);
    }
    for (const arr of lessonsByCourse.values()) arr.sort((a, b) => a.order_number - b.order_number);

    // Purchases by user
    const purchasesByUser = new Map<string, string[]>();
    for (const p of purchases) {
      const arr = purchasesByUser.get(p.user_id) ?? [];
      arr.push(p.course_id);
      purchasesByUser.set(p.user_id, arr);
    }

    let sent = 0, skipped = 0, errors: string[] = [];

    for (const uid of userIds) {
      const profile = profiles.find((p) => p.id === uid);
      if (!profile) continue;
      if (!profile.email_notifications || !profile.course_updates) { skipped++; continue; }

      // XP earned during the window
      const xpEarned = activity
        .filter((a) => a.user_id === uid)
        .reduce((s, a) => s + (a.xp_earned ?? 0), 0);

      // Lessons completed during the window
      const userProgress = progress.filter((p) => p.user_id === uid);
      const lessonsCompleted = userProgress.filter((p) =>
        p.completed &&
        new Date(p.updated_at) >= weekStart &&
        new Date(p.updated_at) < weekEnd
      ).length;

      const g = gamification.find((x) => x.user_id === uid);
      const currentStreak = g?.current_streak ?? 0;
      const totalXp = g?.total_xp ?? 0;

      // Next unfinished lesson across purchased courses (lowest course order,
      // then lowest lesson order)
      const completedSet = new Set(userProgress.filter((p) => p.completed).map((p) => p.lesson_id));
      const userCourseIds = purchasesByUser.get(uid) ?? [];
      const orderedCourses = courses
        .filter((c) => userCourseIds.includes(c.id))
        // deno-lint-ignore no-explicit-any
        .sort((a: any, b: any) => (a.order_number ?? 0) - (b.order_number ?? 0));

      let nextLesson: { id: string; title: string } | null = null;
      let nextCourse: { id: string; title: string } | null = null;
      for (const c of orderedCourses) {
        const cl = lessonsByCourse.get(c.id) ?? [];
        const nxt = cl.find((l) => !completedSet.has(l.id));
        if (nxt) {
          nextLesson = { id: nxt.id, title: nxt.title };
          nextCourse = { id: c.id, title: (c as { title: string }).title };
          break;
        }
      }

      const resumeUrl = nextLesson && nextCourse
        ? `${SITE_URL}/courses/${nextCourse.id}/lessons/${nextLesson.id}`
        : `${SITE_URL}/dashboard`;

      // Claim slot
      const { error: claimErr } = await supabase
        .from("lifecycle_emails_sent")
        .insert({ user_id: uid, course_id: nextCourse?.id ?? null, kind });
      if (claimErr) {
        // deno-lint-ignore no-explicit-any
        if ((claimErr as any).code === "23505") { skipped++; continue; }
        errors.push(`claim ${uid}: ${claimErr.message}`);
        continue;
      }

      try {
        const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(uid);
        if (userErr || !userData?.user?.email) { errors.push(`no email ${uid}`); continue; }

        const res = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "weekly-progress-digest",
            recipientEmail: userData.user.email,
            idempotencyKey: `weekly-${uid}-${weekStartIso}`,
            templateData: {
              studentName: profile.display_name ?? undefined,
              xpEarned,
              lessonsCompleted,
              currentStreak,
              totalXp,
              nextLessonTitle: nextLesson?.title,
              nextCourseTitle: nextCourse?.title,
              resumeUrl,
              weekLabel,
            },
          },
        });
        if (res.error) throw new Error(res.error.message ?? String(res.error));
        sent++;
      } catch (err) {
        console.error("[send-weekly-digest] send failed:", err);
        errors.push(`send ${uid}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return jsonOk({
      success: true,
      weekStart: weekStartIso,
      sent, skipped,
      errors: errors.length ? errors.slice(0, 20) : undefined,
    }, corsHeaders);
  } catch (error) {
    console.error("[send-weekly-digest] error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
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
function jsonOk(body: unknown, corsHeaders: Record<string, string>) {
  return json(body, 200, corsHeaders);
}
function formatWeekLabel(start: Date, end: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  });
  return `Week of ${fmt(start)} – ${fmt(end)}`;
}