/**
 * useGradeSettings – Hook for managing admin-configurable grade weights.
 * 
 * WHY: Instead of hardcoded 50/30/20, admins can set quiz/activity/worksheet
 * weights globally or per-course. A global default is always present (course_id = null).
 * Per-course overrides take priority when they exist.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Shape of a grade_settings row
export interface GradeWeights {
  id: string;
  courseId: string | null;
  quizWeight: number;
  activityWeight: number;
  worksheetWeight: number;
  examWeight: number;
  essayWeight: number;
}

/**
 * Fetch grade weights – returns global defaults + any per-course overrides.
 * Components should call getWeightsForCourse() to resolve the effective weights.
 */
export function useGradeSettings() {
  return useQuery({
    queryKey: ['grade-settings'],
    queryFn: async (): Promise<GradeWeights[]> => {
      const { data, error } = await supabase
        .from('grade_settings' as any)
        .select('*')
        .order('course_id', { ascending: true, nullsFirst: true });

      if (error) throw error;

      return (data as any[]).map((row: any) => ({
        id: row.id,
        courseId: row.course_id,
        quizWeight: row.quiz_weight,
        activityWeight: row.activity_weight,
        worksheetWeight: row.worksheet_weight,
        examWeight: row.exam_weight ?? 0,
        essayWeight: row.essay_weight ?? 0,
      }));
    },
  });
}

/** Resolve the effective weights for a specific course (fallback to global). */
export function getWeightsForCourse(
  allSettings: GradeWeights[] | undefined,
  courseId?: string
): { quizWeight: number; activityWeight: number; worksheetWeight: number; examWeight: number; essayWeight: number } {
  const defaults = { quizWeight: 50, activityWeight: 30, worksheetWeight: 20, examWeight: 0, essayWeight: 0 };
  if (!allSettings?.length) return defaults;

  // Check for per-course override first
  if (courseId) {
    const courseOverride = allSettings.find(s => s.courseId === courseId);
    if (courseOverride) return courseOverride;
  }

  // Fallback to global (course_id IS NULL)
  const global = allSettings.find(s => s.courseId === null);
  return global || defaults;
}

/** Save or update grade weights (global or per-course). */
export function useUpdateGradeSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      courseId: string | null;
      quizWeight: number;
      activityWeight: number;
      worksheetWeight: number;
      examWeight: number;
      essayWeight: number;
    }) => {
      const { courseId, quizWeight, activityWeight, worksheetWeight, examWeight, essayWeight } = params;

      // Upsert: insert if not exists, update if exists
      const { error } = await supabase
        .from('grade_settings' as any)
        .upsert(
          {
            course_id: courseId,
            quiz_weight: quizWeight,
            activity_weight: activityWeight,
            worksheet_weight: worksheetWeight,
            exam_weight: examWeight,
            essay_weight: essayWeight,
          } as any,
          { onConflict: 'course_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-settings'] });
      queryClient.invalidateQueries({ queryKey: ['gradebook'] });
      toast({ title: 'Grade weights saved!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save weights',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
