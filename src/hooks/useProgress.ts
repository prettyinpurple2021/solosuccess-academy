/**
 * @file useProgress.ts — Student Progress Tracking Hooks
 * 
 * Manages lesson completion, quiz scores, notes, and overall progress
 * calculations across all purchased courses.
 * 
 * HOOKS IN THIS FILE:
 * - useUserProgress(userId)                → All progress records for a user
 * - useCourseProgress(userId, courseId)     → Progress for a specific course
 * - useMarkLessonComplete()                → Mutation to mark lesson done/undone
 * - useUpdateLessonNotes()                 → Mutation to save lesson notes
 * - useOverallProgress(userId)             → Aggregated stats across all courses
 * 
 * DATABASE TABLE: `user_progress`
 * Each row = one user's progress on one lesson. Uses a composite
 * unique constraint on (user_id, lesson_id) so upsert works correctly.
 * 
 * PRODUCTION TODO:
 * - Add optimistic updates to useMarkLessonComplete for instant UI feedback
 * - Consider batch-fetching progress with courses in a single query
 * - Add quiz_score tracking integration with the quiz component
 * - The admin fields (admin_notes, admin_override_score, graded_at, graded_by)
 *   exist in the DB but aren't used in this hook — add if needed
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Shape of a user's progress on a single lesson.
 * Maps to the `user_progress` database table.
 */
export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;           // FK → lessons.id
  completed: boolean;           // Whether the student finished this lesson
  completed_at: string | null;  // ISO timestamp of when they completed it
  quiz_score: number | null;    // 0-100 score if this is a quiz lesson
  activity_score: number | null; // 0-100 percentage of activity steps completed
  notes: string | null;         // Student's personal notes for this lesson
  created_at: string;
  updated_at: string;
}

/**
 * Fetch ALL progress records for a user (across all courses).
 * Used on the Dashboard for overall progress calculations.
 * 
 * NOTE: If a student has 100+ purchased lessons, this returns all of them.
 * For very active users, consider pagination or limiting to recent progress.
 */
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
 * 
 * This does a two-step query:
 * 1. Get all lesson IDs for the course
 * 2. Get progress records matching those lesson IDs
 * 
 * Returns both the raw progress data and computed counts.
 * 
 * PRODUCTION TODO: Consider using a database function to do this
 * in a single query for better performance.
 */
export function useCourseProgress(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-progress', userId, courseId],
    queryFn: async () => {
      if (!userId || !courseId) return { progress: [], lessonCount: 0, completedCount: 0 };

      // Step 1: Get all lesson IDs for this course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      const lessonIds = lessons?.map((l) => l.id) || [];

      if (lessonIds.length === 0) {
        return { progress: [], lessonCount: 0, completedCount: 0 };
      }

      // Step 2: Get progress for those lessons
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

/**
 * Mutation: Mark a lesson as complete or incomplete.
 * 
 * Uses UPSERT with `onConflict: 'user_id,lesson_id'` so it creates
 * a new progress record if one doesn't exist, or updates the existing one.
 * 
 * After success, invalidates both user-progress and course-progress queries
 * so the UI updates everywhere that shows progress.
 */
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
          {
            onConflict: 'user_id,lesson_id',  // Composite unique constraint
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all progress-related caches so UI reflects the change
      queryClient.invalidateQueries({ queryKey: ['user-progress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['course-progress', variables.userId] });
    },
  });
}

/**
 * Mutation: Submit a quiz score for a lesson.
 *
 * Upserts the user_progress row with the quiz score.
 * If the score meets or exceeds passingScore, the lesson is also
 * marked as completed automatically.
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
      score: number;         // 0-100 percentage
      passingScore: number;  // Minimum % required to pass
    }) => {
      const passed = score >= passingScore;
      const { data, error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            quiz_score: score,
            completed: passed,
            completed_at: passed ? new Date().toISOString() : null,
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
    },
  });
}

/**
 * Mutation: Save personal notes for a lesson.
 * Uses the same UPSERT pattern as lesson completion.
 */
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
          {
            user_id: userId,
            lesson_id: lessonId,
            notes,
          },
          {
            onConflict: 'user_id,lesson_id',
          }
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

/**
 * Mutation: Save activity completion score (0-100 percentage).
 * Called when a student completes steps in an activity lesson.
 */
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
      score: number; // 0-100 percentage of steps completed
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
    },
  });
}

/**
 * Fetch aggregated progress across ALL purchased courses.
 * 
 * Used on the Dashboard to show "Overall: 45% complete (18/40 lessons)".
 * 
 * This performs 3 sequential queries:
 * 1. Get purchased course IDs
 * 2. Get all lesson IDs for those courses
 * 3. Get completion status for those lessons
 * 
 * Then it computes per-course breakdowns and overall totals.
 * 
 * PRODUCTION TODO: Move this to a database function for better performance.
 * Three round-trips to the DB is slow — a single SQL query could do this.
 */
export function useOverallProgress(userId: string | undefined) {
  return useQuery({
    queryKey: ['overall-progress', userId],
    queryFn: async () => {
      if (!userId) return { totalLessons: 0, completedLessons: 0, courseProgress: [] };

      // Step 1: Get user's purchased course IDs
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('course_id')
        .eq('user_id', userId);

      if (purchasesError) throw purchasesError;

      const purchasedCourseIds = purchases?.map(p => p.course_id) || [];

      if (purchasedCourseIds.length === 0) {
        return { totalLessons: 0, completedLessons: 0, courseProgress: [] };
      }

      // Step 2: Get all lessons for purchased courses
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, course_id')
        .in('course_id', purchasedCourseIds);

      if (lessonsError) throw lessonsError;

      const lessonIds = lessons?.map(l => l.id) || [];

      if (lessonIds.length === 0) {
        return { totalLessons: 0, completedLessons: 0, courseProgress: [] };
      }

      // Step 3: Get completion records
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('lesson_id, completed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      if (progressError) throw progressError;

      // Build a set of completed lesson IDs for fast lookup
      const completedSet = new Set(
        progress?.filter(p => p.completed).map(p => p.lesson_id) || []
      );

      // Calculate per-course progress breakdown
      const courseProgressMap = new Map<string, { total: number; completed: number }>();
      lessons?.forEach(lesson => {
        const existing = courseProgressMap.get(lesson.course_id) || { total: 0, completed: 0 };
        existing.total += 1;
        if (completedSet.has(lesson.id)) {
          existing.completed += 1;
        }
        courseProgressMap.set(lesson.course_id, existing);
      });

      const courseProgress = Array.from(courseProgressMap.entries()).map(([courseId, data]) => ({
        courseId,
        total: data.total,
        completed: data.completed,
        percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }));

      return {
        totalLessons: lessonIds.length,
        completedLessons: completedSet.size,
        percentage: lessonIds.length > 0 ? Math.round((completedSet.size / lessonIds.length) * 100) : 0,
        courseProgress,
      };
    },
    enabled: !!userId,
  });
}
