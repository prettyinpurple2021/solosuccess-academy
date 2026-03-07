/**
 * @file useGamification.ts — XP, Streaks, Badges & Leaderboard Hooks
 * 
 * Implements the full gamification system including:
 * - XP (experience points) tracking via atomic DB function
 * - Daily login streaks (computed server-side for accuracy)
 * - Achievement badges (earned by meeting criteria thresholds)
 * - XP config from database (admin-tunable)
 * - Real-time updates via Supabase Realtime subscriptions
 * - Leaderboard data fetching
 * 
 * GAMIFICATION ARCHITECTURE:
 * ┌─────────────────────────────────────┐
 * │ user_gamification (1 row per user)  │
 * │ - total_xp, current_streak, etc.   │
 * ├─────────────────────────────────────┤
 * │ xp_config (admin-tunable XP values) │
 * │ - action_key, xp_amount, label     │
 * ├─────────────────────────────────────┤
 * │ achievement_badges (badge catalog)  │
 * │ - criteria_type, criteria_value     │
 * ├─────────────────────────────────────┤
 * │ user_badges (many-to-many join)     │
 * │ - user_id, badge_id, earned_at     │
 * └─────────────────────────────────────┘
 * 
 * XP AWARDING:
 * - Uses the `award_xp` Postgres function with row-level locking
 *   to prevent race conditions and ensure atomicity
 * - Streak calculation happens server-side (no client date issues)
 * 
 * XP CONFIG:
 * - XP values are stored in the `xp_config` table
 * - Admins can change values via the admin panel
 * - Falls back to hardcoded defaults if DB config not loaded yet
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

// ──────────────────────────────────────────────
// TYPE DEFINITIONS
// ──────────────────────────────────────────────

/** Shape of the user_gamification table row */
export interface UserGamification {
  id: string;
  user_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Shape of the achievement_badges catalog table */
export interface AchievementBadge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  criteria_type: string;
  criteria_value: number;
  created_at: string;
}

/** Shape of the user_badges join table (includes nested badge data) */
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: AchievementBadge;
}

// ──────────────────────────────────────────────
// XP CONFIG — loaded from the database
// ──────────────────────────────────────────────

/**
 * Hardcoded fallback XP values.
 * Used while DB config is still loading, or if the query fails.
 */
const XP_DEFAULTS: Record<string, number> = {
  LESSON_COMPLETE: 25,
  QUIZ_PASS: 50,
  QUIZ_PERFECT: 100,
  PROJECT_SUBMIT: 75,
  PROJECT_FEEDBACK: 25,
  DISCUSSION_START: 15,
  COMMENT_POST: 10,
};

/**
 * Exported constant for backwards compatibility.
 * Components that reference XP_VALUES still work, but the
 * GamificationProvider now uses DB values when available.
 */
export const XP_VALUES = XP_DEFAULTS;

/**
 * Fetch XP config from the `xp_config` table.
 * Returns a map of action_key → xp_amount.
 * Cached for 10 minutes since these rarely change.
 */
export function useXPConfig() {
  return useQuery({
    queryKey: ['xp-config'],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('xp_config' as any)
        .select('action_key, xp_amount');

      if (error) throw error;

      // Build a lookup map from the DB rows
      const config: Record<string, number> = { ...XP_DEFAULTS };
      for (const row of (data as any[]) || []) {
        config[row.action_key] = row.xp_amount;
      }
      return config;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

// ──────────────────────────────────────────────
// QUERY HOOKS
// ──────────────────────────────────────────────

/** Fetch the user's gamification data (XP, streak, etc.). */
export function useUserGamification(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-gamification', userId],
    queryFn: async (): Promise<UserGamification | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

/** Fetch all available achievement badges (the full catalog). */
export function useAllBadges() {
  return useQuery({
    queryKey: ['achievement-badges'],
    queryFn: async (): Promise<AchievementBadge[]> => {
      const { data, error } = await supabase
        .from('achievement_badges')
        .select('*')
        .order('category', { ascending: true })
        .order('criteria_value', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

/** Fetch badges the user has earned (joined with badge details). */
export function useUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-badges', userId],
    queryFn: async (): Promise<UserBadge[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:achievement_badges(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

// ──────────────────────────────────────────────
// MUTATIONS
// ──────────────────────────────────────────────

/**
 * Mutation: Award XP atomically via the `award_xp` Postgres function.
 * 
 * Uses row-level locking (FOR UPDATE) server-side to prevent
 * race conditions from concurrent XP awards. Streak calculation
 * also happens server-side for accuracy.
 */
export function useAwardXP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      xpAmount,
      action,
    }: {
      userId: string;
      xpAmount: number;
      action: string;
    }) => {
      // Call the atomic DB function instead of doing client-side read-modify-write
      const { data, error } = await supabase.rpc('award_xp', {
        _user_id: userId,
        _xp_amount: xpAmount,
        _action: action,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-gamification', variables.userId] });
    },
  });
}

/**
 * Mutation: Check all badge criteria and award any newly earned badges.
 * 
 * Compares user stats against the badge catalog, inserts new
 * user_badges rows, and awards bonus XP via the atomic function.
 */
export function useCheckBadges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      stats,
    }: {
      userId: string;
      stats: {
        lessonsCompleted: number;
        coursesCompleted: number;
        streakDays: number;
        totalXp: number;
        discussionsStarted: number;
        commentsPosted: number;
        projectsSubmitted: number;
        projectsWithFeedback: number;
        chaptersRead: number;
      };
    }) => {
      // Get all available badges
      const { data: allBadges } = await supabase
        .from('achievement_badges')
        .select('*');

      // Get user's already-earned badges
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      const earnedBadgeIds = new Set(userBadges?.map(b => b.badge_id) || []);
      const newBadges: AchievementBadge[] = [];

      for (const badge of allBadges || []) {
        if (earnedBadgeIds.has(badge.id)) continue;

        let earned = false;

        switch (badge.criteria_type) {
          case 'lessons_completed':
            earned = stats.lessonsCompleted >= badge.criteria_value;
            break;
          case 'courses_completed':
            earned = stats.coursesCompleted >= badge.criteria_value;
            break;
          case 'streak_days':
            earned = stats.streakDays >= badge.criteria_value;
            break;
          case 'total_xp':
            earned = stats.totalXp >= badge.criteria_value;
            break;
          case 'discussions_started':
            earned = stats.discussionsStarted >= badge.criteria_value;
            break;
          case 'comments_posted':
            earned = stats.commentsPosted >= badge.criteria_value;
            break;
          case 'projects_submitted':
            earned = stats.projectsSubmitted >= badge.criteria_value;
            break;
          case 'projects_with_feedback':
            earned = stats.projectsWithFeedback >= badge.criteria_value;
            break;
          case 'chapters_read':
            earned = stats.chaptersRead >= badge.criteria_value;
            break;
        }

        if (earned) {
          const { error } = await supabase
            .from('user_badges')
            .insert({ user_id: userId, badge_id: badge.id });

          if (!error) {
            newBadges.push(badge);

            // Award bonus XP atomically via DB function
            if (badge.xp_reward > 0) {
              await supabase.rpc('award_xp', {
                _user_id: userId,
                _xp_amount: badge.xp_reward,
                _action: `badge_${badge.slug}`,
              });
            }
          }
        }
      }

      return newBadges;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-badges', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['user-gamification', variables.userId] });
    },
  });
}

// ──────────────────────────────────────────────
// REALTIME
// ──────────────────────────────────────────────

/**
 * Real-time subscription for gamification updates.
 * Listens for changes to user_gamification and user_badges tables.
 */
export function useGamificationRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`gamification-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_gamification',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-gamification', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-badges', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

/**
 * Fetch leaderboard data — top users ranked by total XP.
 * Uses profiles_public view for privacy-safe display names.
 */
export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('user_id, total_xp, current_streak, longest_streak')
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const userIds = data?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles_public' as any)
        .select('id, display_name, avatar_url')
        .in('id', userIds) as { data: { id: string; display_name: string | null; avatar_url: string | null }[] | null };

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return data?.map(entry => ({
        ...entry,
        profile: profileMap.get(entry.user_id),
      })) || [];
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}
