/**
 * @file useDailyGoals.ts — Daily Study Goal Tracker
 *
 * Tracks two daily goals per user:
 *  - Lessons completed today
 *  - Active study minutes today (reading + lesson time)
 *
 * Goal targets are stored in localStorage (per-user key) so users
 * can opt into goals instantly without a DB migration. Today's
 * progress is computed from existing data sources:
 *  - `user_progress.completed_at` for lessons
 *  - `reading_sessions.duration_seconds` (today only) for minutes
 *
 * PRODUCTION TODO:
 *  - Migrate goals to a `user_study_goals` table for cross-device sync
 *  - Add lesson-time tracking parallel to reading_sessions
 *  - Push notifications when user is close to breaking streak
 */
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyGoals {
  /** Target number of lessons to complete today (0 = disabled) */
  lessonsTarget: number;
  /** Target active study minutes today (0 = disabled) */
  minutesTarget: number;
  /** Whether the user has explicitly configured goals (vs defaults) */
  configured: boolean;
}

export const DEFAULT_GOALS: DailyGoals = {
  lessonsTarget: 1,
  minutesTarget: 20,
  configured: false,
};

const storageKey = (userId: string | undefined) =>
  userId ? `ssa.dailyGoals.${userId}` : 'ssa.dailyGoals.guest';

/** Read goals from localStorage with safe fallback. */
function readGoals(userId: string | undefined): DailyGoals {
  if (typeof window === 'undefined') return DEFAULT_GOALS;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_GOALS;
    const parsed = JSON.parse(raw) as Partial<DailyGoals>;
    return {
      lessonsTarget: Math.max(0, Math.min(20, Number(parsed.lessonsTarget ?? DEFAULT_GOALS.lessonsTarget))),
      minutesTarget: Math.max(0, Math.min(480, Number(parsed.minutesTarget ?? DEFAULT_GOALS.minutesTarget))),
      configured: Boolean(parsed.configured),
    };
  } catch {
    return DEFAULT_GOALS;
  }
}

/** Hook to read + persist daily goal targets. */
export function useDailyGoalsConfig(userId: string | undefined) {
  const [goals, setGoalsState] = useState<DailyGoals>(() => readGoals(userId));

  // Re-sync when userId changes (e.g., after sign-in)
  useEffect(() => {
    setGoalsState(readGoals(userId));
  }, [userId]);

  const setGoals = useCallback(
    (next: Partial<DailyGoals>) => {
      const merged: DailyGoals = {
        ...goals,
        ...next,
        configured: true,
      };
      setGoalsState(merged);
      try {
        window.localStorage.setItem(storageKey(userId), JSON.stringify(merged));
      } catch {
        // localStorage may be unavailable (private mode, quota) — ignore
      }
    },
    [goals, userId]
  );

  return { goals, setGoals };
}

export interface DailyProgress {
  lessonsToday: number;
  minutesToday: number;
}

/**
 * Compute today's lesson-completion + reading-minutes counts.
 * Both queries scope by `user_id` and `created_at >= midnight today`.
 */
export function useDailyProgress(userId: string | undefined) {
  return useQuery({
    queryKey: ['daily-progress', userId],
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 min
    queryFn: async (): Promise<DailyProgress> => {
      if (!userId) return { lessonsToday: 0, minutesToday: 0 };

      // Local-time start of today, converted to ISO for the query
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startISO = startOfDay.toISOString();

      const [{ data: completedLessons }, { data: sessions }] = await Promise.all([
        supabase
          .from('user_progress')
          .select('lesson_id, completed_at')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', startISO),
        supabase
          .from('reading_sessions' as any)
          .select('duration_seconds, created_at')
          .eq('user_id', userId)
          .gte('created_at', startISO),
      ]);

      const lessonsToday = completedLessons?.length ?? 0;
      const totalSeconds = (sessions as any[] | null)?.reduce(
        (sum, s) => sum + (s.duration_seconds || 0),
        0
      ) ?? 0;

      return {
        lessonsToday,
        minutesToday: Math.floor(totalSeconds / 60),
      };
    },
  });
}
