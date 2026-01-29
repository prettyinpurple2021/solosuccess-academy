import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  badgeCount: number;
  level: number;
}

export function useXPLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', 'xp', limit],
    queryFn: async () => {
      // Get gamification data with profiles
      const { data: gamificationData, error: gamError } = await supabase
        .from('user_gamification')
        .select('user_id, total_xp, current_streak, longest_streak')
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (gamError) throw gamError;
      if (!gamificationData || gamificationData.length === 0) return [];

      // Get profiles for these users using public view
      const userIds = gamificationData.map(g => g.user_id);
      const { data: profiles, error: profError } = await supabase
        .from('profiles_public' as any)
        .select('id, display_name, avatar_url')
        .in('id', userIds) as { data: { id: string; display_name: string | null; avatar_url: string | null }[] | null; error: any };

      if (profError) throw profError;

      // Get badge counts for each user
      const { data: badgeCounts, error: badgeError } = await supabase
        .from('user_badges')
        .select('user_id')
        .in('user_id', userIds);

      if (badgeError) throw badgeError;

      // Count badges per user
      const badgeCountMap: Record<string, number> = {};
      badgeCounts?.forEach(b => {
        badgeCountMap[b.user_id] = (badgeCountMap[b.user_id] || 0) + 1;
      });

      // Map profiles by id for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combine data
      const entries: LeaderboardEntry[] = gamificationData.map(g => {
        const profile = profileMap.get(g.user_id);
        return {
          userId: g.user_id,
          displayName: profile?.display_name || 'Anonymous',
          avatarUrl: profile?.avatar_url || null,
          totalXp: g.total_xp,
          currentStreak: g.current_streak,
          longestStreak: g.longest_streak,
          badgeCount: badgeCountMap[g.user_id] || 0,
          level: Math.floor(g.total_xp / 500) + 1,
        };
      });

      return entries;
    },
  });
}

export function useStreakLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', 'streak', limit],
    queryFn: async () => {
      const { data: gamificationData, error: gamError } = await supabase
        .from('user_gamification')
        .select('user_id, total_xp, current_streak, longest_streak')
        .order('longest_streak', { ascending: false })
        .limit(limit);

      if (gamError) throw gamError;
      if (!gamificationData || gamificationData.length === 0) return [];

      const userIds = gamificationData.map(g => g.user_id);
      const { data: profiles, error: profError } = await supabase
        .from('profiles_public' as any)
        .select('id, display_name, avatar_url')
        .in('id', userIds) as { data: { id: string; display_name: string | null; avatar_url: string | null }[] | null; error: any };

      if (profError) throw profError;

      const { data: badgeCounts, error: badgeError } = await supabase
        .from('user_badges')
        .select('user_id')
        .in('user_id', userIds);

      if (badgeError) throw badgeError;

      const badgeCountMap: Record<string, number> = {};
      badgeCounts?.forEach(b => {
        badgeCountMap[b.user_id] = (badgeCountMap[b.user_id] || 0) + 1;
      });

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const entries: LeaderboardEntry[] = gamificationData.map(g => {
        const profile = profileMap.get(g.user_id);
        return {
          userId: g.user_id,
          displayName: profile?.display_name || 'Anonymous',
          avatarUrl: profile?.avatar_url || null,
          totalXp: g.total_xp,
          currentStreak: g.current_streak,
          longestStreak: g.longest_streak,
          badgeCount: badgeCountMap[g.user_id] || 0,
          level: Math.floor(g.total_xp / 500) + 1,
        };
      });

      return entries;
    },
  });
}

export function useBadgeLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', 'badges', limit],
    queryFn: async () => {
      // First get badge counts per user
      const { data: badgeData, error: badgeError } = await supabase
        .from('user_badges')
        .select('user_id');

      if (badgeError) throw badgeError;

      // Count badges per user
      const badgeCountMap: Record<string, number> = {};
      badgeData?.forEach(b => {
        badgeCountMap[b.user_id] = (badgeCountMap[b.user_id] || 0) + 1;
      });

      // Sort users by badge count and get top N
      const sortedUsers = Object.entries(badgeCountMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

      if (sortedUsers.length === 0) return [];

      const userIds = sortedUsers.map(([userId]) => userId);

      // Get profiles using public view
      const { data: profiles, error: profError } = await supabase
        .from('profiles_public' as any)
        .select('id, display_name, avatar_url')
        .in('id', userIds) as { data: { id: string; display_name: string | null; avatar_url: string | null }[] | null; error: any };

      if (profError) throw profError;

      // Get gamification data
      const { data: gamificationData, error: gamError } = await supabase
        .from('user_gamification')
        .select('user_id, total_xp, current_streak, longest_streak')
        .in('user_id', userIds);

      if (gamError) throw gamError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const gamMap = new Map(gamificationData?.map(g => [g.user_id, g]) || []);

      const entries: LeaderboardEntry[] = sortedUsers.map(([userId, badgeCount]) => {
        const profile = profileMap.get(userId);
        const gam = gamMap.get(userId);
        return {
          userId,
          displayName: profile?.display_name || 'Anonymous',
          avatarUrl: profile?.avatar_url || null,
          totalXp: gam?.total_xp || 0,
          currentStreak: gam?.current_streak || 0,
          longestStreak: gam?.longest_streak || 0,
          badgeCount,
          level: Math.floor((gam?.total_xp || 0) / 500) + 1,
        };
      });

      return entries;
    },
  });
}
