/**
 * @file useLeaderboard.ts — Leaderboard Data Hooks
 *
 * PURPOSE: Fetches ranked student data from the get-leaderboard edge function.
 * Supports XP-based and badge-count-based leaderboards.
 *
 * SECURITY: Requires authenticated session. The edge function validates JWT
 * and queries only public profile data (display name, avatar) — no PII exposed.
 *
 * CACHING: Uses 2-minute stale time to reduce edge function calls.
 * Leaderboard data changes infrequently (only when students earn XP).
 *
 * NOTE: Streak leaderboard was intentionally removed for privacy reasons
 * (it exposed user activity patterns). XP and badges are sufficient.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  badgeCount: number;
  level: number;
}

async function fetchLeaderboard(type: 'xp' | 'badges', limit: number): Promise<LeaderboardEntry[]> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-leaderboard?type=${type}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch leaderboard' }));
    throw new Error(error.error || 'Failed to fetch leaderboard');
  }

  return response.json();
}

export function useXPLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', 'xp', limit],
    queryFn: () => fetchLeaderboard('xp', limit),
    staleTime: 2 * 60 * 1000, // 2 minutes — leaderboard changes infrequently
  });
}

export function useBadgeLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', 'badges', limit],
    queryFn: () => fetchLeaderboard('badges', limit),
    staleTime: 2 * 60 * 1000,
  });
}
