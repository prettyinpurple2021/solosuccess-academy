import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

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

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: AchievementBadge;
}

// XP values for different actions
export const XP_VALUES = {
  LESSON_COMPLETE: 25,
  QUIZ_PASS: 50,
  QUIZ_PERFECT: 100,
  PROJECT_SUBMIT: 75,
  PROJECT_FEEDBACK: 25,
  DISCUSSION_START: 15,
  COMMENT_POST: 10,
} as const;

// Fetch user's gamification data
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

// Fetch all available badges
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

// Fetch user's earned badges
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

// Award XP and update streak
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
      const today = new Date().toISOString().split('T')[0];

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
          // Same day, don't update streak
          newStreak = existing.current_streak;
          longestStreak = existing.longest_streak;
        } else if (lastDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastDate === yesterdayStr) {
            // Consecutive day
            newStreak = existing.current_streak + 1;
            longestStreak = Math.max(newStreak, existing.longest_streak);
          } else {
            // Streak broken
            newStreak = 1;
            longestStreak = existing.longest_streak;
          }
        }

        // Update existing record
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
        // Create new record
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

// Check and award badges
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
      // Get all badges
      const { data: allBadges } = await supabase
        .from('achievement_badges')
        .select('*');

      // Get user's current badges
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      const earnedBadgeIds = new Set(userBadges?.map(b => b.badge_id) || []);
      const newBadges: AchievementBadge[] = [];

      // Check each badge
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
        }

        if (earned) {
          const { error } = await supabase
            .from('user_badges')
            .insert({ user_id: userId, badge_id: badge.id });

          if (!error) {
            newBadges.push(badge);

            // Award badge XP bonus if applicable
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

// Real-time subscription for gamification updates
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

// Leaderboard data
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

      // Fetch profile info for each user
      const userIds = data?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return data?.map(entry => ({
        ...entry,
        profile: profileMap.get(entry.user_id),
      })) || [];
    },
  });
}
