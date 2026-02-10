import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContinueLaterRow {
  user_id: string;
  course_id: string;
  lesson_id: string | null;
  textbook_page: number | null;
  updated_at: string;
}

export interface ContinueLaterWithDetails extends ContinueLaterRow {
  course?: { title: string } | null;
  lesson?: { title: string } | null;
}

export function useContinueLater(userId: string | undefined) {
  return useQuery({
    queryKey: ['continue-later', userId],
    queryFn: async (): Promise<ContinueLaterWithDetails | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('continue_later')
        .select('user_id, course_id, lesson_id, textbook_page, updated_at, courses(title), lessons(title)')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const d = data as ContinueLaterRow & {
        courses: { title: string } | null;
        lessons: { title: string } | null;
      };
      return {
        user_id: d.user_id,
        course_id: d.course_id,
        lesson_id: d.lesson_id,
        textbook_page: d.textbook_page,
        updated_at: d.updated_at,
        course: d.courses ?? null,
        lesson: d.lessons ?? null,
      };
    },
    enabled: !!userId,
  });
}

export function useSetContinueLater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      courseId,
      lessonId,
      textbookPage,
    }: {
      userId: string;
      courseId: string;
      lessonId?: string | null;
      textbookPage?: number | null;
    }) => {
      const { error } = await supabase
        .from('continue_later')
        .upsert(
          {
            user_id: userId,
            course_id: courseId,
            lesson_id: lessonId ?? null,
            textbook_page: textbookPage ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['continue-later', variables.userId] });
    },
  });
}
