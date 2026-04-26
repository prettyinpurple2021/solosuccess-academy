/**
 * delete-user-account
 *
 * Hard-purges a user's account immediately. Called by the user from the Settings
 * page AFTER they've confirmed the 30-day soft delete OR if they want to skip
 * the grace period entirely.
 *
 * Flow:
 *  1. Verify the caller's JWT and resolve their user ID.
 *  2. If `delete_content` flag set on their pending deletion request, wipe their
 *     discussions, comments, votes, and notes. Otherwise just anonymize.
 *  3. Delete the auth user — this cascades through ON DELETE rules.
 *
 * Note: most domain tables don't have FK to auth.users (per project convention)
 * so we cleanup explicitly here.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userRes.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Look up their pending request to honor the delete_content choice
    const { data: req_, error: reqErr } = await admin
      .from("account_deletion_requests")
      .select("delete_content, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (reqErr) throw reqErr;

    const deleteContent = req_?.delete_content ?? false;

    if (deleteContent) {
      // Cascade-delete user's public content
      await admin.from("discussion_votes").delete().eq("user_id", userId);
      await admin.from("discussion_comments").delete().eq("user_id", userId);
      await admin.from("discussions").delete().eq("user_id", userId);
      await admin.from("textbook_comments").delete().eq("user_id", userId);
      await admin.from("student_notes").delete().eq("user_id", userId);
    }
    // If user chose to keep content, posts remain — they reference user_id but
    // once auth.users is deleted, joins to profiles will return null and the UI
    // already shows "Anonymous" for missing profiles.

    // Cleanup user-scoped tables that don't have FK cascades
    const tables = [
      "user_progress",
      "user_gamification",
      "user_badges",
      "user_flashcards",
      "user_textbook_highlights",
      "user_textbook_bookmarks",
      "user_objective_progress",
      "ai_chat_sessions",
      "certificates",
      "purchases",
      "course_projects",
      "practice_submissions",
      "project_milestone_submissions",
      "student_essay_submissions",
      "student_exam_attempts",
      "portfolio_entries",
      "reading_sessions",
      "continue_later",
      "notifications",
      "user_roles",
      "profiles",
    ];
    for (const t of tables) {
      const { error } = await admin.from(t).delete().eq("user_id", userId);
      if (error) console.warn(`cleanup ${t}:`, error.message);
    }
    // profiles uses id, not user_id — handled above by mistake; do explicit:
    await admin.from("profiles").delete().eq("id", userId);

    // Mark request as purged (best effort)
    await admin
      .from("account_deletion_requests")
      .update({ status: "purged", purged_at: new Date().toISOString() })
      .eq("user_id", userId);

    // Finally, delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-user-account error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
