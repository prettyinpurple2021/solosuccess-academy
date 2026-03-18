/**
 * useExamAttempt – Hooks for managing a student's final exam attempt.
 * Handles fetching previous attempts and submitting answers.
 *
 * SECURITY: Grading is performed server-side via the `grade_and_submit_exam`
 * RPC function. Correct answers are never sent to the client during the exam;
 * they are only returned in the grading response for the review screen.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ExamQuestion } from '@/hooks/useFinalExam';

/** Shape of a student's saved answers (keyed by question id). */
export interface ExamAnswers {
  [questionId: string]: {
    selectedIndex?: number;    // MCQ / true_false
    textAnswer?: string;       // short_answer
  };
}

export interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  answers: ExamAnswers;
  score: number | null;
  passed: boolean | null;
  submittedAt: string | null;
  createdAt: string;
}

/** Result returned from server-side grading. */
export interface GradingResult {
  attemptId: string;
  score: number;
  passed: boolean;
  /** Questions WITH correct answer fields populated (for review). */
  questions: ExamQuestion[];
  answers: ExamAnswers;
}

/** Fetch the latest attempt for a given exam (if one exists). */
export function useLatestExamAttempt(examId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['exam-attempt', examId, userId],
    queryFn: async (): Promise<ExamAttempt | null> => {
      if (!examId || !userId) return null;

      const { data, error } = await supabase
        .from('student_exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        examId: data.exam_id,
        answers: (data.answers as any) ?? {},
        score: data.score,
        passed: data.passed,
        submittedAt: data.submitted_at,
        createdAt: data.created_at,
      };
    },
    enabled: !!examId && !!userId,
  });
}

/**
 * Submit an exam attempt — grading happens server-side via RPC.
 * Returns the score, pass status, and questions WITH correct answers for review.
 */
export function useSubmitExamAttempt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      examId: string;
      userId: string;
      answers: ExamAnswers;
    }): Promise<GradingResult> => {
      const { data, error } = await supabase.rpc('grade_and_submit_exam' as any, {
        _exam_id: params.examId,
        _answers: params.answers,
      });

      if (error) throw error;

      const result = data as any;
      return {
        attemptId: result.attemptId,
        score: result.score,
        passed: result.passed,
        questions: result.questions as ExamQuestion[],
        answers: result.answers as ExamAnswers,
      };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempt', variables.examId, variables.userId] });
      toast({
        title: result.passed ? '🎉 Congratulations!' : 'Exam Submitted',
        description: result.passed
          ? `You passed with a score of ${result.score}%!`
          : `You scored ${result.score}%. Keep studying and try again!`,
      });
    },
    onError: (error: any) => {
      toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
    },
  });
}
