/**
 * @file useReadingTime.ts — Reading Time Tracker Hook
 *
 * PURPOSE: Tracks how long a student reads textbooks, persists sessions
 * to the `reading_sessions` table, and awards XP at time milestones.
 *
 * HOW IT WORKS:
 * 1. Starts a timer when the textbook viewer mounts
 * 2. Every 30 seconds, saves the current session duration to the DB
 * 3. Awards XP at milestones: 15 min (10 XP), 30 min (25 XP), 60 min (50 XP)
 * 4. Pauses when the tab loses focus (document.hidden) to avoid fake time
 * 5. Ends the session when the component unmounts
 *
 * VISIBILITY API: Uses document.visibilitychange to pause/resume the timer
 * so only active reading time is counted (no AFK inflation).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ──────────────────────────────────────────────
// XP MILESTONES — awarded once per session
// ──────────────────────────────────────────────
const READING_MILESTONES = [
  { minutes: 15, xp: 10, label: '15 minutes of reading' },
  { minutes: 30, xp: 25, label: '30 minutes of reading' },
  { minutes: 60, xp: 50, label: '1 hour of reading' },
];

/** How often (ms) to save session progress to the DB */
const SAVE_INTERVAL_MS = 30_000;

// ──────────────────────────────────────────────
// ACTIVE SESSION TRACKER
// ──────────────────────────────────────────────

interface UseReadingTimeOptions {
  userId: string | undefined;
  courseId: string;
  /** Called when an XP milestone is reached */
  onMilestone?: (milestone: { minutes: number; xp: number; label: string }) => void;
}

export function useReadingTime({ userId, courseId, onMilestone }: UseReadingTimeOptions) {
  // Elapsed seconds for the current session
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Track which milestones have been awarded this session
  const awardedMilestones = useRef(new Set<number>());
  // DB row ID for the current session
  const sessionIdRef = useRef<string | null>(null);
  // Whether the timer is actively running
  const isActiveRef = useRef(true);
  // Interval ref for cleanup
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const queryClient = useQueryClient();

  // ── Create a new reading session in the DB ──
  const createSession = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('reading_sessions' as any)
      .insert({ user_id: userId, course_id: courseId, duration_seconds: 0 })
      .select('id')
      .single();

    if (!error && data) {
      sessionIdRef.current = (data as any).id;
    }
  }, [userId, courseId]);

  // ── Save current duration to the DB ──
  const saveProgress = useCallback(async () => {
    if (!sessionIdRef.current) return;
    await supabase
      .from('reading_sessions' as any)
      .update({
        duration_seconds: elapsedSeconds,
        ended_at: new Date().toISOString(),
      } as any)
      .eq('id', sessionIdRef.current);
  }, [elapsedSeconds]);

  // ── Start timer on mount ──
  useEffect(() => {
    if (!userId) return;

    // Create a DB session row
    createSession();

    // 1-second tick timer (only increments when tab is visible)
    timerRef.current = setInterval(() => {
      if (isActiveRef.current) {
        setElapsedSeconds(prev => prev + 1);
      }
    }, 1000);

    // Periodic save to DB every 30 seconds
    saveTimerRef.current = setInterval(() => {
      // saveProgress uses a ref, so we trigger it via a flag
    }, SAVE_INTERVAL_MS);

    return () => {
      // Cleanup: stop timers and save final duration
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [userId, createSession]);

  // ── Periodic save effect ──
  useEffect(() => {
    if (!sessionIdRef.current || elapsedSeconds === 0) return;

    // Save every 30 seconds
    if (elapsedSeconds % 30 === 0) {
      saveProgress();
    }
  }, [elapsedSeconds, saveProgress]);

  // ── Save on unmount ──
  useEffect(() => {
    return () => {
      // Final save when component unmounts
      if (sessionIdRef.current && elapsedSeconds > 0) {
        supabase
          .from('reading_sessions' as any)
          .update({
            duration_seconds: elapsedSeconds,
            ended_at: new Date().toISOString(),
          } as any)
          .eq('id', sessionIdRef.current)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['reading-stats', userId] });
          });
      }
    };
  }, []);

  // ── Visibility API: pause when tab hidden ──
  useEffect(() => {
    const handleVisibility = () => {
      isActiveRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ── Check XP milestones ──
  useEffect(() => {
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    for (const milestone of READING_MILESTONES) {
      if (
        elapsedMinutes >= milestone.minutes &&
        !awardedMilestones.current.has(milestone.minutes)
      ) {
        awardedMilestones.current.add(milestone.minutes);
        onMilestone?.(milestone);
      }
    }
  }, [elapsedSeconds, onMilestone]);

  return {
    /** Current session elapsed time in seconds */
    elapsedSeconds,
    /** Formatted time string (e.g., "12:34") */
    formattedTime: formatTime(elapsedSeconds),
    /** Whether the timer is currently active (tab visible) */
    isActive: isActiveRef.current,
  };
}

// ──────────────────────────────────────────────
// AGGREGATE STATS QUERY
// ──────────────────────────────────────────────

export interface ReadingStats {
  totalSeconds: number;
  totalSessions: number;
  longestSessionSeconds: number;
  todaySeconds: number;
}

/**
 * Fetch aggregated reading stats for a user across all courses.
 * Used on the student dashboard to show total reading time.
 */
export function useReadingStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['reading-stats', userId],
    queryFn: async (): Promise<ReadingStats> => {
      if (!userId) return { totalSeconds: 0, totalSessions: 0, longestSessionSeconds: 0, todaySeconds: 0 };

      const { data, error } = await supabase
        .from('reading_sessions' as any)
        .select('duration_seconds, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      const sessions = (data as any[]) || [];
      const today = new Date().toISOString().split('T')[0];

      let totalSeconds = 0;
      let longestSessionSeconds = 0;
      let todaySeconds = 0;

      for (const session of sessions) {
        const dur = session.duration_seconds || 0;
        totalSeconds += dur;
        if (dur > longestSessionSeconds) longestSessionSeconds = dur;
        if (session.created_at?.startsWith(today)) todaySeconds += dur;
      }

      return {
        totalSeconds,
        totalSessions: sessions.length,
        longestSessionSeconds,
        todaySeconds,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

/** Format seconds into "MM:SS" or "H:MM:SS" */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Format seconds into a human-readable string (e.g., "2h 15m") */
export function formatReadableTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return '< 1m';
}
