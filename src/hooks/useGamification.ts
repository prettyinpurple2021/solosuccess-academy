/**
 * @file useGamification.ts — XP, Streaks, Badges & Leaderboard Hooks
 * 
 * Implements the full gamification system including:
 * - XP (experience points) tracking and awarding
 * - Daily login streaks (consecutive days of activity)
 * - Achievement badges (earned by meeting criteria thresholds)
 * - Real-time updates via Supabase Realtime subscriptions
 * - Leaderboard data fetching
 * 
 * GAMIFICATION ARCHITECTURE:
 * ┌─────────────────────────────────────┐
 * │ user_gamification (1 row per user)  │
 * │ - total_xp, current_streak, etc.   │
 * ├─────────────────────────────────────┤
 * │ achievement_badges (badge catalog)  │
 * │ - criteria_type, criteria_value     │
 * ├─────────────────────────────────────┤
 * │ user_badges (many-to-many join)     │
 * │ - user_id, badge_id, earned_at     │
 * └─────────────────────────────────────┘
 * 
 * STREAK LOGIC:
 * - If last_activity_date === today → don't change streak
 * - If last_activity_date === yesterday → increment streak
 * - Otherwise → reset streak to 1
 * 
 * PRODUCTION TODO:
 * - Move XP/badge logic to a database function or Edge Function
 *   to prevent race conditions and ensure atomicity
 * - Add XP transaction log table for audit trail
 * - The badge check iterates ALL badges on every call — optimize with
 *   a pre-filtered query or badge category checks
 * - Add weekly/monthly XP leaderboard variants
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

/** Shape of the user_gamification table row */
export interface UserGamification {
  id: string;
  user_id: string;
  total_xp: number;                    // Cumulative XP earned
  current_streak: number;              // Current consecutive-day streak
  longest_streak: number;              // All-time best streak
  last_activity_date: string | null;   // Date string "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}

/** Shape of the achievement_badges catalog table */
export interface AchievementBadge {
  id: string;
  slug: string;                        // URL-safe identifier (e.g., "first-lesson")
  name: string;                        // Display name
  description: string;                 // What this badge is for
  icon: string;                        // Emoji or icon identifier
  category: string;                    // Grouping (e.g., "learning", "social")
  xp_reward: number;                   // Bonus XP awarded when badge is earned
  criteria_type: string;               // What stat to check (e.g., "lessons_completed")
  criteria_value: number;              // Threshold (e.g., 10 lessons)
  created_at: string;
}

/** Shape of the user_badges join table (includes nested badge data) */
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;                    // FK → achievement_badges.id
  earned_at: string;
  badge?: AchievementBadge;            // Joined from achievement_badges
}

/**
 * XP values for different student actions.
 * These are constants used when calling useAwardXP().
 * 
 * PRODUCTION TODO: Move to a database config table so admins
 * can adjust XP values without code changes.
 */
export const XP_VALUES = {
  LESSON_COMPLETE: 25,     // Finishing any lesson type
  QUIZ_PASS: 50,           // Passing a quiz (≥ passing score)
  QUIZ_PERFECT: 100,       // Getting 100% on a quiz
  PROJECT_SUBMIT: 75,      // Submitting a course project
  PROJECT_FEEDBACK: 25,    // Requesting AI feedback on a project
  DISCUSSION_START: 15,    // Creating a new discussion thread
  COMMENT_POST: 10,        // Posting a comment on a discussion
} as const;

/**
 * Fetch the user's gamification data (XP, streak, etc.).
 * Returns null if the user has no gamification record yet
 * (created on first XP award).
 */
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

/**
 * Fetch badges the user has earned.
 * Joins with achievement_badges to get badge details.
 */
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

/**
 * Mutation: Award XP to a user and update their streak.
 * 
 * STREAK ALGORITHM:
 * 1. Same day as last activity → no streak change (prevents double-counting)
 * 2. Last activity was yesterday → streak += 1 (consecutive!)
 * 3. More than 1 day gap → streak resets to 1 (broken streak)
 * 
 * If the user has no gamification record, creates one with initial values.
 * 
 * PRODUCTION TODO:
 * - This is NOT atomic — concurrent calls could cause XP miscounts.
 *   Move to a Postgres function with row-level locking.
 * - Add rate limiting to prevent XP farming exploits
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
      action: string;      // Descriptive label like "lesson_complete" (for logging)
    }) => {
      const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

      // Get current gamification data
      const { data: existing } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let newStreak = 1;
      let longestStreak = 1;

      if (existing) {
        const lastDate = existing.last_activity_date;
        
        if (lastDate === today) {
          // Same day — don't change streak (already counted today)
          newStreak = existing.current_streak;
          longestStreak = existing.longest_streak;
        } else if (lastDate) {
          // Check if last activity was yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastDate === yesterdayStr) {
            // Consecutive day! Increment streak
            newStreak = existing.current_streak + 1;
            longestStreak = Math.max(newStreak, existing.longest_streak);
          } else {
            // Gap > 1 day — streak is broken
            newStreak = 1;
            longestStreak = existing.longest_streak;
          }
        }

        // Update existing gamification record
        const { data, error } = await supabase
          .from('user_gamification')
          .update({
            total_xp: existing.total_xp + xpAmount,
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_activity_date: today,
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // First time — create gamification record
        const { data, error } = await supabase
          .from('user_gamification')
          .insert({
            user_id: userId,
            total_xp: xpAmount,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-gamification', variables.userId] });
    },
  });
}

/**
 * Mutation: Check all badge criteria and award any newly earned badges.
 * 
 * HOW IT WORKS:
 * 1. Fetch all badges from the catalog
 * 2. Fetch which badges the user already has
 * 3. For each unearned badge, check if the user's stats meet the criteria
 * 4. Award any newly earned badges + their XP bonus
 * 
 * @param stats - Current aggregated stats for the user
 * @returns Array of newly earned badges (for showing celebration UI)
 * 
 * PRODUCTION TODO:
 * - This runs entirely on the client — move to an Edge Function or
 *   database trigger for security (prevents client-side manipulation)
 * - XP update for badge rewards has a bug: it uses the passed-in
 *   stats.totalXp instead of re-fetching, which could overwrite
 *   XP added by concurrent operations
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

      // Check each badge's criteria against user's stats
      for (const badge of allBadges || []) {
        if (earnedBadgeIds.has(badge.id)) continue;  // Already earned

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
        }

        if (earned) {
          // Award the badge
          const { error } = await supabase
            .from('user_badges')
            .insert({ user_id: userId, badge_id: badge.id });

          if (!error) {
            newBadges.push(badge);

            // Award bonus XP for earning the badge
            if (badge.xp_reward > 0) {
              await supabase
                .from('user_gamification')
                .update({
                  total_xp: stats.totalXp + badge.xp_reward,
                })
                .eq('user_id', userId);
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

/**
 * Real-time subscription for gamification updates.
 * 
 * Listens for changes to user_gamification and user_badges tables
 * via Supabase Realtime (WebSocket connection). When another tab
 * or server process updates these tables, the UI refreshes automatically.
 * 
 * IMPORTANT: The tables must have Realtime enabled via:
 * ALTER PUBLICATION supabase_realtime ADD TABLE user_gamification;
 * ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;
 */
export function useGamificationRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Create a Supabase Realtime channel for this user's gamification data
    const channel = supabase
      .channel(`gamification-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',           // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_gamification',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidate cache so React Query refetches the data
          queryClient.invalidateQueries({ queryKey: ['user-gamification', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',      // Only care about new badges (can't un-earn)
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-badges', userId] });
        }
      )
      .subscribe();

    // Cleanup: remove channel when component unmounts or userId changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

/**
 * Fetch leaderboard data — top users ranked by total XP.
 * 
 * Does a two-step query:
 * 1. Get top N gamification records sorted by XP
 * 2. Fetch public profile data (name, avatar) for those users
 * 
 * Uses `profiles_public` view (not the full profiles table)
 * to respect privacy — only exposes display_name and avatar_url.
 * 
 * @param limit - Number of top users to fetch (default: 10)
 */
export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_gamification')
        .select(`
          user_id,
          total_xp,
          current_streak,
          longest_streak
        `)
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch display names and avatars from the public profile view
      const userIds = data?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles_public' as any)
        .select('id, display_name, avatar_url')
        .in('id', userIds) as { data: { id: string; display_name: string | null; avatar_url: string | null }[] | null };

      // Build a lookup map for O(1) profile access
      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      // Merge gamification data with profile data
      return data?.map(entry => ({
        ...entry,
        profile: profileMap.get(entry.user_id),
      })) || [];
    },
  });
}
