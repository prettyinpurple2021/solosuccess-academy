/**
 * @file usePracticeLabs.ts — Practice Lab Hooks
 * 
 * Manages the hands-on practice exercise workflow for each lesson:
 * 1. Fetch the practice lab prompt for a given lesson
 * 2. Save/update draft submissions
 * 3. Submit for AI grading
 * 4. Fetch existing submission for a lab
 * 
 * PRACTICE LAB FLOW:
 * draft → submitted → graded (after AI feedback)
 * 
 * DATABASE TABLES:
 * - practice_labs: stores the exercise prompt per lesson (1:1)
 * - practice_submissions: stores student work per lab (unique per user+lab)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Shape of a practice lab — mirrors the practice_labs DB table */
export interface PracticeLab {
  id: string;
  lesson_id: string;
  title: string;
  instructions: string;
  deliverable_description: string;
  estimated_minutes: number;
  difficulty: string;
  created_at: string;
  updated_at: string;
}

/** Shape of a practice submission — mirrors the practice_submissions DB table */
export interface PracticeSubmission {
  id: string;
  user_id: string;
  practice_lab_id: string;
  submission_content: string;
  file_urls: string[];
  status: 'draft' | 'submitted' | 'graded';
  score: number | null;
  ai_feedback: string | null;
  ai_feedback_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch the practice lab for a specific lesson.
 * Returns null if the lesson doesn't have a practice lab.
 */
export function usePracticeLab(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['practice-lab', lessonId],
    queryFn: async (): Promise<PracticeLab | null> => {
      if (!lessonId) return null;

      const { data, error } = await supabase
        .from('practice_labs')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      return data as PracticeLab | null;
    },
    enabled: !!lessonId,
  });
}

/**
 * Fetch the current user's submission for a specific practice lab.
 * Returns null if they haven't started working on it yet.
 */
export function usePracticeSubmission(userId: string | undefined, practiceLabId: string | undefined) {
  return useQuery({
    queryKey: ['practice-submission', userId, practiceLabId],
    queryFn: async (): Promise<PracticeSubmission | null> => {
      if (!userId || !practiceLabId) return null;

      const { data, error } = await supabase
        .from('practice_submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('practice_lab_id', practiceLabId)
        .maybeSingle();

      if (error) throw error;
      return data as PracticeSubmission | null;
    },
    enabled: !!userId && !!practiceLabId,
  });
}

/**
 * Mutation: Save practice lab work as a draft using upsert.
 * Uses the unique constraint on (user_id, practice_lab_id).
 */
export function useSavePracticeDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      practiceLabId,
      submissionContent,
      fileUrls,
    }: {
      userId: string;
      practiceLabId: string;
      submissionContent: string;
      fileUrls?: string[];
    }) => {
      const { data, error } = await supabase
        .from('practice_submissions')
        .upsert(
          {
            user_id: userId,
            practice_lab_id: practiceLabId,
            submission_content: submissionContent,
            file_urls: fileUrls || [],
            status: 'draft',
          },
          { onConflict: 'user_id,practice_lab_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['practice-submission', variables.userId, variables.practiceLabId],
      });
    },
  });
}

/**
 * Mutation: Submit practice lab work for grading.
 * Sets status to 'submitted' and records the timestamp.
 */
export function useSubmitPractice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      practiceLabId,
      submissionContent,
      fileUrls,
    }: {
      userId: string;
      practiceLabId: string;
      submissionContent: string;
      fileUrls?: string[];
    }) => {
      const { data, error } = await supabase
        .from('practice_submissions')
        .upsert(
          {
            user_id: userId,
            practice_lab_id: practiceLabId,
            submission_content: submissionContent,
            file_urls: fileUrls || [],
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,practice_lab_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['practice-submission', variables.userId, variables.practiceLabId],
      });
    },
  });
}

/**
 * Mutation: Request AI feedback on a submitted practice lab.
 * Calls the practice-feedback Edge Function.
 */
export function useRequestPracticeFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      userId,
      practiceLabId,
    }: {
      submissionId: string;
      userId: string;
      practiceLabId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('practice-feedback', {
        body: { submissionId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['practice-submission', variables.userId, variables.practiceLabId],
      });
    },
  });
}
