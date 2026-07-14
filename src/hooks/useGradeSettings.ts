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
      const { data, error } = await supabase.rpc('get_grade_settings' as any);

      if (error) throw error;

      const rows = ((data as any[]) || []).slice().sort((a: any, b: any) => {
        if (a.course_id === b.course_id) return 0;
        if (a.course_id === null) return -1;
        if (b.course_id === null) return 1;
        return String(a.course_id).localeCompare(String(b.course_id));
      });

      return rows.map((row: any) => ({
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

      // Admin-only SECURITY DEFINER RPC — validates total=100 and admin role server-side.
      const { error } = await supabase.rpc('admin_upsert_grade_settings' as any, {
        _course_id: courseId,
        _quiz_weight: quizWeight,
        _activity_weight: activityWeight,
        _worksheet_weight: worksheetWeight,
        _exam_weight: examWeight,
        _essay_weight: essayWeight,
      });
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

/**
 * Delete a per-course grade weight override so the course falls back to the global default.
 * The global row (course_id IS NULL) cannot be deleted through this hook.
 */
export function useDeleteGradeSettingsOverride() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.rpc('admin_delete_grade_settings_override' as any, {
        _course_id: courseId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-settings'] });
      queryClient.invalidateQueries({ queryKey: ['gradebook'] });
      toast({ title: 'Override removed — course now uses global defaults.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove override',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
