/**
 * @file useProgress.ts — Student Progress Tracking Hooks
 * 
 * Manages lesson completion, quiz scores, notes, and overall progress.
 * 
 * HOOKS:
 * - useUserProgress(userId)            → All progress records for a user
 * - useCourseProgress(userId, courseId) → Progress for a specific course
 * - useMarkLessonComplete()            → Mark lesson done/undone
 * - useSubmitQuizScore()               → Submit quiz score + auto-complete
 * - useUpdateLessonNotes()             → Save lesson notes
 * - useSubmitActivityScore()           → Save activity completion score
 * - useOverallProgress(userId)         → Aggregated stats (uses DB function)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Shape of a user's progress on a single lesson. */
export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  quiz_score: number | null;
  activity_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Fetch ALL progress records for a user (across all courses). */
export function useUserProgress(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-progress', userId],
    queryFn: async (): Promise<UserProgress[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data as UserProgress[];
    },
    enabled: !!userId,
  });
}

/**
 * Fetch progress for a SPECIFIC course.
 * Two-step query: get lesson IDs, then get progress for those lessons.
 */
export function useCourseProgress(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-progress', userId, courseId],
    queryFn: async () => {
      if (!userId || !courseId) return { progress: [], lessonCount: 0, completedCount: 0 };

      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      const lessonIds = lessons?.map((l) => l.id) || [];
      if (lessonIds.length === 0) {
        return { progress: [], lessonCount: 0, completedCount: 0 };
      }

      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      if (progressError) throw progressError;

      const completedCount = progress?.filter((p) => p.completed).length || 0;

      return {
        progress: progress as UserProgress[],
        lessonCount: lessonIds.length,
        completedCount,
      };
    },
    enabled: !!userId && !!courseId,
  });
}

/** Mutation: Mark a lesson as complete or incomplete (upsert). */
export function useMarkLessonComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      lessonId,
      completed,
    }: {
      userId: string;
      lessonId: string;
      completed: boolean;
    }) => {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['course-progress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['overall-progress', variables.userId] });
    },
  });
}

/**
 * Mutation: Submit a quiz score. Keeps the BEST score across retakes.
 * Auto-completes the lesson if the score meets the passing threshold.
 */
export function useSubmitQuizScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      lessonId,
      score,
      passingScore,
    }: {
      userId: string;
      lessonId: string;
      score: number;
      passingScore: number;
    }) => {
      // Fetch existing progress to compare scores
      const { data: existing } = await supabase
        .from('user_progress')
        .select('quiz_score, completed')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      // Keep the best score: only update if new score is higher
      const bestScore = Math.max(score, existing?.quiz_score ?? 0);
      const passed = bestScore >= passingScore;
      const alreadyCompleted = existing?.completed === true;

      const { data, error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            quiz_score: bestScore,
            // Never un-complete a lesson that was already completed
            completed: passed || alreadyCompleted,
            completed_at: (passed || alreadyCompleted) ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['course-progress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['overall-progress', variables.userId] });
    },
  });
}

/** Mutation: Save personal notes for a lesson. */
export function useUpdateLessonNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      lessonId,
      notes,
    }: {
      userId: string;
      lessonId: string;
      notes: string;
    }) => {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert(
          { user_id: userId, lesson_id: lessonId, notes },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress', variables.userId] });
    },
  });
}

/** Mutation: Save activity completion score (0-100). */
export function useSubmitActivityScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      lessonId,
      score,
    }: {
      userId: string;
      lessonId: string;
      score: number;
    }) => {
      const isComplete = score === 100;
      const { data, error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            activity_score: score,
            completed: isComplete,
            completed_at: isComplete ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['course-progress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['overall-progress', variables.userId] });
    },
  });
}

/**
 * Fetch aggregated progress across ALL purchased courses.
 * Uses the `get_overall_progress` DB function for a single round-trip.
 */
export function useOverallProgress(userId: string | undefined) {
  return useQuery({
    queryKey: ['overall-progress', userId],
    queryFn: async () => {
      if (!userId) return { totalLessons: 0, completedLessons: 0, courseProgress: [] };

      const { data, error } = await supabase.rpc('get_overall_progress', {
        _user_id: userId,
      });

      if (error) throw error;

      // The DB function returns a jsonb object
      const result = data as any;
      const totalLessons = result?.totalLessons || 0;
      const completedLessons = result?.completedLessons || 0;

      return {
        totalLessons,
        completedLessons,
        percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        courseProgress: result?.courseProgress || [],
      };
    },
    enabled: !!userId,
  });
}
