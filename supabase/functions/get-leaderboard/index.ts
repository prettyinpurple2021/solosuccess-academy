import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user is authenticated using getClaims
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for leaderboard queries (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "xp";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    let entries: any[] = [];

    if (type === "xp") {
      const { data: gamData, error: gamError } = await supabase
        .from("user_gamification")
        .select("user_id, total_xp")
        .order("total_xp", { ascending: false })
        .limit(limit);

      if (gamError) throw gamError;
      if (!gamData || gamData.length === 0) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userIds = gamData.map((g) => g.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const { data: badges } = await supabase
        .from("user_badges")
        .select("user_id")
        .in("user_id", userIds);

      const badgeCountMap: Record<string, number> = {};
      badges?.forEach((b) => {
        badgeCountMap[b.user_id] = (badgeCountMap[b.user_id] || 0) + 1;
      });

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      entries = gamData.map((g) => {
        const profile = profileMap.get(g.user_id);
        return {
          userId: g.user_id,
          displayName: profile?.display_name || "Anonymous",
          avatarUrl: profile?.avatar_url || null,
          totalXp: g.total_xp,
          badgeCount: badgeCountMap[g.user_id] || 0,
          level: Math.floor(g.total_xp / 500) + 1,
        };
      });
    } else if (type === "badges") {
      const { data: badgeData } = await supabase
        .from("user_badges")
        .select("user_id");

      if (!badgeData || badgeData.length === 0) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const badgeCountMap: Record<string, number> = {};
      badgeData.forEach((b) => {
        badgeCountMap[b.user_id] = (badgeCountMap[b.user_id] || 0) + 1;
      });

      const sortedUsers = Object.entries(badgeCountMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

      const userIds = sortedUsers.map(([userId]) => userId);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const { data: gamData } = await supabase
        .from("user_gamification")
        .select("user_id, total_xp")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      const gamMap = new Map(gamData?.map((g) => [g.user_id, g]) || []);

      entries = sortedUsers.map(([userId, badgeCount]) => {
        const profile = profileMap.get(userId);
        const gam = gamMap.get(userId);
        return {
          userId,
          displayName: profile?.display_name || "Anonymous",
          avatarUrl: profile?.avatar_url || null,
          totalXp: gam?.total_xp || 0,
          badgeCount,
          level: Math.floor((gam?.total_xp || 0) / 500) + 1,
        };
      });
    }

    return new Response(JSON.stringify(entries), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-leaderboard error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
