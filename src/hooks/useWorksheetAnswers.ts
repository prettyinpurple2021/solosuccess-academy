/**
 * @file useWorksheetAnswers.ts — Persistence for Worksheet Player
 *
 * Loads and auto-saves worksheet answers + self-check state
 * to the `user_progress.worksheet_answers` JSONB column.
 *
 * Shape stored: { answers: Record<string,string>, selfChecked: Record<string,boolean> }
 */
import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** What we persist inside the JSONB column */
export interface WorksheetAnswersPayload {
  answers: Record<string, string>;
  selfChecked: Record<string, boolean>;
}

/**
 * Load saved worksheet answers for a specific lesson.
 * Returns the parsed payload or null if nothing saved yet.
 */
export function useLoadWorksheetAnswers(userId: string | undefined, lessonId: string | undefined) {
  return useQuery({
    queryKey: ['worksheet-answers', userId, lessonId],
    queryFn: async (): Promise<WorksheetAnswersPayload | null> => {
      if (!userId || !lessonId) return null;

      // We select worksheet_answers from user_progress
      // Using type assertion because the column was just added
      const { data, error } = await supabase
        .from('user_progress')
        .select('worksheet_answers')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Parse the JSONB value (comes as any from the DB)
      const raw = (data as any).worksheet_answers;
      if (!raw || typeof raw !== 'object') return null;

      return {
        answers: raw.answers || {},
        selfChecked: raw.selfChecked || {},
      };
    },
    enabled: !!userId && !!lessonId,
  });
}

/**
 * Mutation that upserts worksheet answers into user_progress.
 * Uses the same composite unique constraint (user_id, lesson_id).
 */
export function useSaveWorksheetAnswers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      lessonId,
      payload,
    }: {
      userId: string;
      lessonId: string;
      payload: WorksheetAnswersPayload;
    }) => {
      const { error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: userId,
            lesson_id: lessonId,
            worksheet_answers: payload as any, // JSONB column
          },
          { onConflict: 'user_id,lesson_id' }
        );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Keep the cache fresh
      queryClient.invalidateQueries({
        queryKey: ['worksheet-answers', variables.userId, variables.lessonId],
      });
    },
  });
}

/**
 * Convenience hook that debounces auto-saving worksheet answers.
 * Call `save(answers, selfChecked)` whenever state changes;
 * actual DB write happens after 1.5 s of inactivity.
 */
export function useAutoSaveWorksheetAnswers(
  userId: string | undefined,
  lessonId: string | undefined
) {
  const { mutate } = useSaveWorksheetAnswers();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const save = useCallback(
    (answers: Record<string, string>, selfChecked: Record<string, boolean>) => {
      if (!userId || !lessonId) return;

      // Clear previous pending save
      if (timerRef.current) clearTimeout(timerRef.current);

      // Debounce: write after 1.5 s of quiet
      timerRef.current = setTimeout(() => {
        mutate({ userId, lessonId, payload: { answers, selfChecked } });
      }, 1500);
    },
    [userId, lessonId, mutate]
  );

  return { save };
}
