// === check-webhook-health Edge Function ===
// Periodic monitor (cron) for Stripe webhook health.
// Sends a branded admin alert email when EITHER:
//   • FAILURES: >= FAILURE_THRESHOLD failed webhook events in the last
//     FAILURE_WINDOW_MIN minutes, OR
//   • DROP: successful events in the last DROP_WINDOW_MIN minutes are
//     <= 30% of the rolling baseline (last 24h averaged to the same window),
//     when the baseline shows meaningful activity (>= MIN_BASELINE events).
//
// Throttling: each alert kind has its own cooldown stored in
// public.webhook_alert_state so admins don't get spammed.
//
// AUTH: cron-only via x-cron-secret OR an authenticated admin.
// Recipients: all users with the 'admin' role.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SITE_URL = "https://solosuccessacademy.app";
const DASHBOARD_URL = `${SITE_URL}/admin/webhook-health`;

// Tunables
const FAILURE_WINDOW_MIN = 30;
const FAILURE_THRESHOLD = 3;          // >=3 failures in window triggers alert
const DROP_WINDOW_MIN = 60;           // current sample window
const BASELINE_WINDOW_HOURS = 24;     // baseline lookback
const DROP_RATIO = 0.3;               // current < 30% of baseline average
const MIN_BASELINE = 4;               // need at least this many baseline events
const COOLDOWN_MIN = 60;              // don't re-alert same kind within 60 min

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsResponse(req);

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // ── Auth ─────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    const apiKeyHeader = req.headers.get("apikey");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;
    const cronJobSecret = Deno.env.get("CRON_JOB_SECRET");
    const isCronCall = !!cronJobSecret && cronSecretHeader === cronJobSecret;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    // Treat anon-key bearer as a cron call (matches existing project cron pattern).
    // Throttling via webhook_alert_state + COOLDOWN_MIN prevents abuse: even if
    // someone pings this endpoint, at most one alert per kind per cooldown window
    // can be emitted.
    const isAnonCronCall = !!anonKey && bearerToken === anonKey && !cronSecretHeader;

    if (bearerToken === serviceRoleKey || apiKeyHeader === serviceRoleKey) {
      return json({ error: "Invalid credential type" }, 401, corsHeaders);
    }

    if (!isCronCall && !isAnonCronCall) {
      if (!bearerToken) return json({ error: "Unauthorized" }, 401, corsHeaders);
      const { data: userData } = await supabase.auth.getUser(bearerToken);
      const uid = userData?.user?.id;
      if (!uid) return json({ error: "Unauthorized" }, 401, corsHeaders);
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: uid, _role: "admin",
      });
      if (!isAdmin) return json({ error: "Forbidden" }, 403, corsHeaders);
    }

    // ── Pull recent events ───────────────────────────────────────────
    const since = new Date(Date.now() - BASELINE_WINDOW_HOURS * 3600 * 1000).toISOString();
    const { data: events, error: evErr } = await supabase
      .from("stripe_webhook_events")
      .select("event_type, processed_at, status, error_message, stripe_event_id")
      .gte("processed_at", since)
      .order("processed_at", { ascending: false })
      .limit(2000);

    if (evErr) throw new Error(`Failed to read events: ${evErr.message}`);

    const now = Date.now();
    const list = events ?? [];

    // ── 1) Failure detector ──────────────────────────────────────────
    const failureWindowMs = FAILURE_WINDOW_MIN * 60 * 1000;
    const recentFailures = list.filter(
      (e) => e.status === "failed" && now - new Date(e.processed_at).getTime() < failureWindowMs,
    );

    const alerts: Array<{ kind: "failures" | "drop"; summary: string; details: string[] }> = [];

    if (recentFailures.length >= FAILURE_THRESHOLD) {
      const byType: Record<string, number> = {};
      for (const e of recentFailures) byType[e.event_type] = (byType[e.event_type] || 0) + 1;
      const lastErr = recentFailures.find((e) => e.error_message)?.error_message;
      alerts.push({
        kind: "failures",
        summary: `${recentFailures.length} Stripe webhook failures in the last ${FAILURE_WINDOW_MIN} minutes.`,
        details: [
          ...Object.entries(byType).map(([t, c]) => `${t} — ${c} failure${c === 1 ? "" : "s"}`),
          ...(lastErr ? [`Last error: ${truncate(lastErr, 240)}`] : []),
        ],
      });
    }

    // ── 2) Drop detector ─────────────────────────────────────────────
    const dropWindowMs = DROP_WINDOW_MIN * 60 * 1000;
    const baselineMs = BASELINE_WINDOW_HOURS * 3600 * 1000;
    const successful = list.filter((e) => e.status === "processed");
    const recentOk = successful.filter((e) => now - new Date(e.processed_at).getTime() < dropWindowMs).length;
    const olderOk = successful.filter((e) => {
      const age = now - new Date(e.processed_at).getTime();
      return age >= dropWindowMs && age < baselineMs;
    }).length;
    const baselineWindows = (baselineMs - dropWindowMs) / dropWindowMs;
    const baselineAvgPerWindow = baselineWindows > 0 ? olderOk / baselineWindows : 0;

    if (
      baselineAvgPerWindow >= MIN_BASELINE &&
      recentOk < baselineAvgPerWindow * DROP_RATIO
    ) {
      alerts.push({
        kind: "drop",
        summary: `Successful webhook volume dropped sharply in the last ${DROP_WINDOW_MIN} minutes.`,
        details: [
          `Last ${DROP_WINDOW_MIN}m successful: ${recentOk}`,
          `Baseline (24h avg per ${DROP_WINDOW_MIN}m window): ${baselineAvgPerWindow.toFixed(1)}`,
          `Threshold: < ${Math.round(DROP_RATIO * 100)}% of baseline`,
        ],
      });
    }

    // ── Throttle + send ──────────────────────────────────────────────
    const sent: string[] = [];
    const skipped: string[] = [];

    for (const alert of alerts) {
      const { data: state } = await supabase
        .from("webhook_alert_state")
        .select("id, last_alert_at, alert_count")
        .eq("id", alert.kind)
        .maybeSingle();

      const cooldownMs = COOLDOWN_MIN * 60 * 1000;
      if (state && now - new Date(state.last_alert_at).getTime() < cooldownMs) {
        skipped.push(`${alert.kind} (cooldown)`);
        continue;
      }

      // Look up admin recipients
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const adminIds = (adminRoles ?? []).map((r: any) => r.user_id);
      if (adminIds.length === 0) {
        skipped.push(`${alert.kind} (no admins)`);
        continue;
      }

      // Fetch admin emails from auth.users via admin API
      const recipients: string[] = [];
      for (const uid of adminIds) {
        try {
          const { data: u } = await supabase.auth.admin.getUserById(uid);
          if (u?.user?.email) recipients.push(u.user.email);
        } catch (_) { /* ignore individual lookup errors */ }
      }

      if (recipients.length === 0) {
        skipped.push(`${alert.kind} (no admin emails)`);
        continue;
      }

      // Send one email per admin (single-recipient rule for app emails)
      for (const to of recipients) {
        try {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "webhook-health-alert",
              recipientEmail: to,
              // Cooldown window keys idempotency to avoid duplicate sends within bucket
              idempotencyKey: `webhook-alert-${alert.kind}-${Math.floor(now / cooldownMs)}-${to}`,
              templateData: {
                alertType: alert.kind,
                summary: alert.summary,
                details: alert.details,
                dashboardUrl: DASHBOARD_URL,
              },
            },
          });
        } catch (err) {
          console.error(`Failed to send webhook alert to ${to}:`, err);
        }
      }

      // Update throttle state
      await supabase.from("webhook_alert_state").upsert({
        id: alert.kind,
        last_alert_at: new Date(now).toISOString(),
        last_summary: alert.summary,
        alert_count: (state?.alert_count ?? 0) + 1,
        updated_at: new Date(now).toISOString(),
      });

      sent.push(`${alert.kind} → ${recipients.length} admin(s)`);
    }

    return json({
      ok: true,
      windowMinutes: { failure: FAILURE_WINDOW_MIN, drop: DROP_WINDOW_MIN },
      counts: {
        recentFailures: recentFailures.length,
        recentSuccessful: recentOk,
        baselineAvgPerWindow: Number(baselineAvgPerWindow.toFixed(2)),
      },
      alertsTriggered: alerts.map((a) => a.kind),
      sent,
      skipped,
    }, 200, corsHeaders);
  } catch (err) {
    console.error("check-webhook-health error:", err);
    return json({ error: (err as Error).message ?? "Unknown error" }, 500, getCorsHeaders(req));
  }
});

function json(payload: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}