import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  quiz_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch user progress for all lessons
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

// Fetch progress for a specific course
export function useCourseProgress(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-progress', userId, courseId],
    queryFn: async () => {
      if (!userId || !courseId) return { progress: [], lessonCount: 0, completedCount: 0 };

      // First get all lessons for this course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      const lessonIds = lessons?.map((l) => l.id) || [];

      if (lessonIds.length === 0) {
        return { progress: [], lessonCount: 0, completedCount: 0 };
      }

      // Then get progress for those lessons
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

// Mark a lesson as complete
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
      queryClient.invalidateQueries({ queryKey: ['course-progress', variables.userId] });
    },
  });
}

// Update lesson notes
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
