/**
 * @file useFlashcards.ts — Spaced Repetition Flashcard Hooks
 *
 * PURPOSE: CRUD operations for user flashcards + SM-2 spaced repetition
 * algorithm for scheduling reviews.
 *
 * SM-2 ALGORITHM (SuperMemo 2):
 * - Quality ratings: 0 (blackout) to 5 (perfect recall)
 * - Quality < 3 = fail → reset interval to 0
 * - Quality >= 3 = pass → increase interval by ease factor
 * - Ease factor adjusts per card based on performance history
 * - Minimum ease factor is 1.3 to prevent cards from becoming impossible
 *
 * DATA MODEL:
 *   user_flashcards: per-user, per-course, optionally linked to a highlight
 *   Fields: front_text, back_text, ease_factor, interval_days, repetitions,
 *           next_review_at, last_reviewed_at
 *
 * PRODUCTION TODO:
 * - Add bulk card creation from AI-generated content
 * - Track review accuracy statistics over time
 * - Support card tagging and deck organization
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Flashcard {
  id: string;
  user_id: string;
  course_id: string;
  highlight_id: string | null;
  front_text: string;
  back_text: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// SM-2 Algorithm for spaced repetition
export function calculateNextReview(
  quality: number, // 0-5 rating (0-2 = fail, 3-5 = pass)
  currentEaseFactor: number,
  currentRepetitions: number,
  currentInterval: number
): { easeFactor: number; interval: number; repetitions: number } {
  // quality: 0 = complete blackout, 5 = perfect recall
  let easeFactor = currentEaseFactor;
  let interval = currentInterval;
  let repetitions = currentRepetitions;

  if (quality < 3) {
    // Failed recall - reset
    repetitions = 0;
    interval = 0;
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor using SM-2 formula
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return { easeFactor, interval, repetitions };
}

// Fetch all flashcards for a course
export function useFlashcards(courseId: string | undefined) {
  return useQuery({
    queryKey: ['flashcards', courseId],
    queryFn: async (): Promise<Flashcard[]> => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Flashcard[];
    },
    enabled: !!courseId,
  });
}

// Fetch flashcards due for review
export function useDueFlashcards(courseId: string | undefined) {
  return useQuery({
    queryKey: ['flashcards-due', courseId],
    queryFn: async (): Promise<Flashcard[]> => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('course_id', courseId)
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at');

      if (error) throw error;
      return (data || []) as Flashcard[];
    },
    enabled: !!courseId,
  });
}

// Create flashcard
export function useCreateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      highlightId,
      frontText,
      backText,
    }: {
      courseId: string;
      highlightId?: string;
      frontText: string;
      backText: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_flashcards')
        .insert({
          user_id: user.id,
          course_id: courseId,
          highlight_id: highlightId || null,
          front_text: frontText,
          back_text: backText,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-due', variables.courseId] });
    },
  });
}

// Update flashcard after review (spaced repetition)
export function useReviewFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      flashcardId,
      courseId,
      quality,
    }: {
      flashcardId: string;
      courseId: string;
      quality: number; // 0-5
    }) => {
      // First fetch the current card state
      const { data: card, error: fetchError } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('id', flashcardId)
        .single();

      if (fetchError) throw fetchError;

      const { easeFactor, interval, repetitions } = calculateNextReview(
        quality,
        Number(card.ease_factor),
        card.repetitions,
        card.interval_days
      );

      const nextReviewAt = new Date();
      nextReviewAt.setDate(nextReviewAt.getDate() + interval);

      const { data, error } = await supabase
        .from('user_flashcards')
        .update({
          ease_factor: easeFactor,
          interval_days: interval,
          repetitions,
          next_review_at: nextReviewAt.toISOString(),
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('id', flashcardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-due', variables.courseId] });
    },
  });
}

// Update flashcard content
export function useUpdateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      flashcardId,
      courseId,
      frontText,
      backText,
    }: {
      flashcardId: string;
      courseId: string;
      frontText?: string;
      backText?: string;
    }) => {
      const updates: Record<string, string> = {};
      if (frontText !== undefined) updates.front_text = frontText;
      if (backText !== undefined) updates.back_text = backText;

      const { data, error } = await supabase
        .from('user_flashcards')
        .update(updates)
        .eq('id', flashcardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', variables.courseId] });
    },
  });
}

// Delete flashcard
export function useDeleteFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ flashcardId, courseId }: { flashcardId: string; courseId: string }) => {
      const { error } = await supabase
        .from('user_flashcards')
        .delete()
        .eq('id', flashcardId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-due', variables.courseId] });
    },
  });
}
