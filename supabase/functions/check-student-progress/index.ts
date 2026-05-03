// === check-student-progress Edge Function ===
// Daily lifecycle worker. Sends two branded nudges per (user, course):
//   • day3-nudge:  purchased ≥3 days ago, 0 lessons completed in that course
//   • day7-resume: last activity ≥7 days ago, course not complete
//
// Idempotency is enforced by the lifecycle_emails_sent unique constraint
// on (user_id, course_id, kind) — we attempt to insert FIRST and only send
// if the insert succeeds. That way concurrent cron runs can never
// double-send.
//
// AUTH: cron-only via x-cron-secret OR an authenticated admin.
// Service-role key as request auth is rejected.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SITE_URL = "https://solosuccessacademy.cloud";
const DAY3_THRESHOLD_DAYS = 3;
const DAY7_THRESHOLD_DAYS = 7;
const DRIP_DAY1_HOURS = 24;
const DRIP_DAY7_DAYS = 7;
const DRIP_DAY14_DAYS = 14;

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey!,
    );

    // ── Auth: cron secret OR admin user ────────────────────────────
    const authHeader = req.headers.get("Authorization");
    const apiKeyHeader = req.headers.get("apikey");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;
    const cronJobSecret = Deno.env.get("CRON_JOB_SECRET");
    const isCronCall = !!cronJobSecret && cronSecretHeader === cronJobSecret;

    if (
      !!serviceRoleKey &&
      (bearerToken === serviceRoleKey || apiKeyHeader === serviceRoleKey)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid credential type" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!isCronCall) {
      if (!bearerToken) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: claims, error: claimsError } = await supabase.auth.getUser(bearerToken);
      if (claimsError || !claims.user) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: roleData } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", claims.user.id).eq("role", "admin").single();
      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const now = Date.now();
    const day3Cutoff = new Date(now - DAY3_THRESHOLD_DAYS * 86_400_000);
    const day7Cutoff = new Date(now - DAY7_THRESHOLD_DAYS * 86_400_000);

    // ── Fetch base data in parallel ────────────────────────────────
    const [purchasesRes, coursesRes, lessonsRes] = await Promise.all([
      supabase.from("purchases").select("user_id, course_id, purchased_at"),
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

    if (!purchases.length) {
      return jsonOk({ message: "No enrolled students", sent: 0 }, corsHeaders);
    }

    const userIds = [...new Set(purchases.map((p) => p.user_id))];

    // Profiles (for display name + notification prefs)
    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("id, display_name, email_notifications, course_updates")
      .in("id", userIds);
    if (profilesErr) throw new Error(`profiles: ${profilesErr.message}`);

    // All progress for these users
    const { data: progressData, error: progressErr } = await supabase
      .from("user_progress")
      .select("user_id, lesson_id, completed, updated_at")
      .in("user_id", userIds);
    if (progressErr) throw new Error(`progress: ${progressErr.message}`);
    const progress = progressData ?? [];

    // Group lessons by course (sorted by order_number)
    const lessonsByCourse = new Map<string, Array<{ id: string; title: string; order_number: number }>>();
    for (const l of lessons) {
      const arr = lessonsByCourse.get(l.course_id) ?? [];
      arr.push({ id: l.id, title: l.title, order_number: l.order_number ?? 0 });
      lessonsByCourse.set(l.course_id, arr);
    }
    for (const arr of lessonsByCourse.values()) {
      arr.sort((a, b) => a.order_number - b.order_number);
    }

    let day3Sent = 0;
    let day7Sent = 0;
    let drip1Sent = 0;
    let drip7Sent = 0;
    let drip14Sent = 0;
    let upsellSent = 0;
    const errors: string[] = [];

    // Walk every (user, course) purchase ──────────────────────────────
    for (const purchase of purchases) {
      const profile = profiles?.find((p) => p.id === purchase.user_id);
      // Honor unsubscribe / notification prefs
      if (!profile?.email_notifications || !profile?.course_updates) continue;

      const courseLessons = lessonsByCourse.get(purchase.course_id) ?? [];
      if (!courseLessons.length) continue;

      const course = courses.find((c) => c.id === purchase.course_id);
      const courseTitle = course?.title ?? "your course";
      const purchasedAt = new Date(purchase.purchased_at);

      // Per-course progress slice
      const courseLessonIds = new Set(courseLessons.map((l) => l.id));
      const userCourseProgress = progress.filter(
        (p) => p.user_id === purchase.user_id && courseLessonIds.has(p.lesson_id),
      );
      const completedIds = new Set(
        userCourseProgress.filter((p) => p.completed).map((p) => p.lesson_id),
      );
      const lastActivity = userCourseProgress
        .map((p) => new Date(p.updated_at))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const allComplete = completedIds.size === courseLessons.length;
      if (allComplete) continue; // nothing to nudge about

      // ── DAY-3 NUDGE ──────────────────────────────────────────────
      // Bought ≥3 days ago AND zero lessons completed in this course
      if (purchasedAt < day3Cutoff && completedIds.size === 0) {
        const sent = await tryClaimAndSend(
          supabase,
          {
            user_id: purchase.user_id,
            course_id: purchase.course_id,
            kind: "day3-nudge",
          },
          async (recipientEmail) => {
            const firstLesson = courseLessons[0];
            const resumeUrl = firstLesson
              ? `${SITE_URL}/courses/${purchase.course_id}/lessons/${firstLesson.id}`
              : `${SITE_URL}/courses/${purchase.course_id}`;
            await invokeSendEmail(supabase, {
              templateName: "lifecycle-day3-nudge",
              recipientEmail,
              idempotencyKey: `day3-${purchase.user_id}-${purchase.course_id}`,
              templateData: {
                studentName: profile.display_name ?? undefined,
                courseTitle,
                resumeUrl,
              },
            });
          },
        );
        if (sent === "sent") day3Sent++;
        if (sent === "error") errors.push(`day3 ${purchase.user_id}/${purchase.course_id}`);
        continue; // never send both day3 and day7 in the same run
      }

      // ── DAY-7 RESUME ─────────────────────────────────────────────
      // Last activity ≥7 days ago (and at least 1 lesson done — otherwise
      // it would have been a day-3 case)
      if (
        completedIds.size > 0 &&
        lastActivity &&
        lastActivity < day7Cutoff
      ) {
        const sent = await tryClaimAndSend(
          supabase,
          {
            user_id: purchase.user_id,
            course_id: purchase.course_id,
            kind: "day7-resume",
          },
          async (recipientEmail) => {
            const nextLesson = courseLessons.find((l) => !completedIds.has(l.id));
            const resumeUrl = nextLesson
              ? `${SITE_URL}/courses/${purchase.course_id}/lessons/${nextLesson.id}`
              : `${SITE_URL}/courses/${purchase.course_id}`;
            const daysInactive = Math.floor(
              (now - lastActivity.getTime()) / 86_400_000,
            );
            await invokeSendEmail(supabase, {
              templateName: "lifecycle-day7-resume",
              recipientEmail,
              idempotencyKey: `day7-${purchase.user_id}-${purchase.course_id}-${Math.floor(lastActivity.getTime() / 86_400_000)}`,
              templateData: {
                studentName: profile.display_name ?? undefined,
                courseTitle,
                nextLessonTitle: nextLesson?.title,
                resumeUrl,
                daysInactive,
              },
            });
          },
        );
        if (sent === "sent") day7Sent++;
        if (sent === "error") errors.push(`day7 ${purchase.user_id}/${purchase.course_id}`);
      }

      // ── COURSE COMPLETION UPSELL ─────────────────────────────────
      // (handled below in dedicated loop after computing per-course completion)
    }

    // ── COURSE COMPLETION UPSELL LOOP ──────────────────────────────
    // For every (user, course) where all lessons are completed, send a
    // one-time upsell pointing to the next course in order_number sequence.
    const allCoursesOrdered = [...courses].sort(
      // deno-lint-ignore no-explicit-any
      (a: any, b: any) => (a.order_number ?? 0) - (b.order_number ?? 0),
    );
    for (const purchase of purchases) {
      const profile = profiles?.find((p) => p.id === purchase.user_id);
      if (!profile?.email_notifications || !profile?.course_updates) continue;
      const courseLessons = lessonsByCourse.get(purchase.course_id) ?? [];
      if (!courseLessons.length) continue;
      const userCompleted = new Set(
        progress
          .filter((p) =>
            p.user_id === purchase.user_id &&
            p.completed &&
            courseLessons.some((l) => l.id === p.lesson_id)
          )
          .map((p) => p.lesson_id),
      );
      if (userCompleted.size !== courseLessons.length) continue;

      const completedCourse = courses.find((c) => c.id === purchase.course_id);
      // deno-lint-ignore no-explicit-any
      const completedOrder = (completedCourse as any)?.order_number ?? null;
      // Find next course (purchased only — never upsell something they don't own)
      const userPurchasedIds = new Set(
        purchases.filter((p) => p.user_id === purchase.user_id).map((p) => p.course_id),
      );
      const nextCourse = allCoursesOrdered.find(
        // deno-lint-ignore no-explicit-any
        (c: any) =>
          (c.order_number ?? 0) > (completedOrder ?? 0) &&
          userPurchasedIds.has(c.id),
      );

      const sent = await tryClaimAndSend(
        supabase,
        { user_id: purchase.user_id, course_id: purchase.course_id, kind: "completion-upsell" },
        async (recipientEmail) => {
          await invokeSendEmail(supabase, {
            templateName: "course-completion-upsell",
            recipientEmail,
            idempotencyKey: `upsell-${purchase.user_id}-${purchase.course_id}`,
            templateData: {
              studentName: profile.display_name ?? undefined,
              completedCourseTitle: completedCourse?.title ?? "your course",
              nextCourseTitle: nextCourse?.title,
              nextCourseUrl: nextCourse
                ? `${SITE_URL}/courses/${nextCourse.id}`
                : `${SITE_URL}/dashboard`,
              testimonialUrl: `${SITE_URL}/profile?testimonial=1`,
            },
          });
        },
      );
      if (sent === "sent") upsellSent++;
      if (sent === "error") errors.push(`upsell ${purchase.user_id}/${purchase.course_id}`);
    }

    // ── DRIP CAMPAIGN (NON-BUYERS) ─────────────────────────────────
    // Find all users with NO purchases who signed up at the right cadence.
    const buyerIds = new Set(purchases.map((p) => p.user_id));
    // List users via auth admin (paginated). Most projects fit in <1k users; one page is fine for v1.
    const { data: usersPage, error: usersErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersErr) {
      console.error("[check-student-progress] listUsers failed:", usersErr);
    } else {
      const nowMs = now;
      const nonBuyers = (usersPage?.users ?? []).filter(
        // deno-lint-ignore no-explicit-any
        (u: any) => !buyerIds.has(u.id) && !!u.email_confirmed_at,
      );
      // Pre-fetch their profile prefs in one shot
      const nonBuyerIds = nonBuyers.map((u) => u.id);
      let prefsMap = new Map<string, { display_name: string | null; email_notifications: boolean; course_updates: boolean }>();
      if (nonBuyerIds.length) {
        const { data: prefsRows } = await supabase
          .from("profiles")
          .select("id, display_name, email_notifications, course_updates")
          .in("id", nonBuyerIds);
        for (const r of prefsRows ?? []) prefsMap.set(r.id, r);
      }

      for (const u of nonBuyers) {
        const prefs = prefsMap.get(u.id);
        // Default opt-in if no profile row yet
        if (prefs && (!prefs.email_notifications || !prefs.course_updates)) continue;
        if (!u.email) continue;
        const createdMs = new Date(u.created_at).getTime();
        const ageMs = nowMs - createdMs;
        const ageHours = ageMs / 3_600_000;
        const ageDays = ageMs / 86_400_000;

        const baseData = {
          studentName: prefs?.display_name ?? undefined,
          catalogUrl: `${SITE_URL}/courses`,
        };

        // Day-1
        if (ageHours >= DRIP_DAY1_HOURS && ageDays < DRIP_DAY7_DAYS) {
          const r = await tryClaimAndSend(
            supabase,
            { user_id: u.id, course_id: null as unknown as string, kind: "drip-day1" },
            async () => {
              await invokeSendEmail(supabase, {
                templateName: "drip-day1-welcome",
                recipientEmail: u.email,
                idempotencyKey: `drip1-${u.id}`,
                templateData: baseData,
              });
            },
          );
          if (r === "sent") drip1Sent++;
          if (r === "error") errors.push(`drip1 ${u.id}`);
          continue;
        }
        // Day-7
        if (ageDays >= DRIP_DAY7_DAYS && ageDays < DRIP_DAY14_DAYS) {
          const r = await tryClaimAndSend(
            supabase,
            { user_id: u.id, course_id: null as unknown as string, kind: "drip-day7" },
            async () => {
              await invokeSendEmail(supabase, {
                templateName: "drip-day7-value",
                recipientEmail: u.email,
                idempotencyKey: `drip7-${u.id}`,
                templateData: baseData,
              });
            },
          );
          if (r === "sent") drip7Sent++;
          if (r === "error") errors.push(`drip7 ${u.id}`);
          continue;
        }
        // Day-14
        if (ageDays >= DRIP_DAY14_DAYS) {
          const r = await tryClaimAndSend(
            supabase,
            { user_id: u.id, course_id: null as unknown as string, kind: "drip-day14" },
            async () => {
              await invokeSendEmail(supabase, {
                templateName: "drip-day14-final",
                recipientEmail: u.email,
                idempotencyKey: `drip14-${u.id}`,
                templateData: baseData,
              });
            },
          );
          if (r === "sent") drip14Sent++;
          if (r === "error") errors.push(`drip14 ${u.id}`);
        }
      }
    }

    return jsonOk(
      {
        success: true,
        day3Sent,
        day7Sent,
        drip1Sent,
        drip7Sent,
        drip14Sent,
        upsellSent,
        errors: errors.length ? errors : undefined,
      },
      corsHeaders,
    );
  } catch (error: unknown) {
    console.error("[check-student-progress] error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

function jsonOk(body: unknown, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Atomically claim a (user, course, kind) send slot in lifecycle_emails_sent
 * BEFORE invoking the email. If the insert violates the unique constraint,
 * another worker already handled this slot and we return "skipped".
 *
 * Returns: 'sent' | 'skipped' | 'error'
 */
// deno-lint-ignore no-explicit-any
async function tryClaimAndSend(
  supabase: any,
  claim: { user_id: string; course_id: string; kind: string },
  send: (recipientEmail: string) => Promise<void>,
): Promise<"sent" | "skipped" | "error"> {
  // 1) reserve the slot (unique constraint is the source of truth)
  const { error: insertErr } = await supabase
    .from("lifecycle_emails_sent")
    .insert(claim);

  if (insertErr) {
    // 23505 = unique_violation → already sent
    // deno-lint-ignore no-explicit-any
    if ((insertErr as any).code === "23505") return "skipped";
    console.error("[check-student-progress] claim insert failed:", insertErr);
    return "error";
  }

  // 2) look up the recipient email (auth.users via admin)
  try {
    const { data: userData, error: userErr } = await supabase.auth.admin
      .getUserById(claim.user_id);
    if (userErr || !userData?.user?.email) {
      console.warn("[check-student-progress] no email for", claim.user_id);
      // Don't roll back the claim — re-sending later is more annoying than
      // missing a single email.
      return "error";
    }
    await send(userData.user.email);
    return "sent";
  } catch (err) {
    console.error("[check-student-progress] send failed:", err);
    return "error";
  }
}

// deno-lint-ignore no-explicit-any
async function invokeSendEmail(supabase: any, body: Record<string, unknown>) {
  const res = await supabase.functions.invoke("send-transactional-email", { body });
  if (res.error) {
    throw new Error(`send-transactional-email failed: ${res.error.message ?? res.error}`);
  }
}
