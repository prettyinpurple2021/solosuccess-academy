/**
 * useExamAttempt – Hooks for managing a student's final exam attempt.
 * Handles fetching previous attempts, creating new ones, and submitting answers.
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

/** Grade answers against the exam questions and return a score (0-100). */
export function gradeExam(questions: ExamQuestion[], answers: ExamAnswers): number {
  if (!questions.length) return 0;

  let totalPoints = 0;
  let earnedPoints = 0;

  for (const q of questions) {
    totalPoints += q.points;
    const ans = answers[q.id];
    if (!ans) continue;

    switch (q.type) {
      case 'mcq':
        if (ans.selectedIndex === q.correctIndex) earnedPoints += q.points;
        break;
      case 'true_false':
        // correctIndex 0 = True, 1 = False  OR use correctBoolean
        if (q.correctBoolean !== undefined) {
          const studentBool = ans.selectedIndex === 0; // 0 = True
          if (studentBool === q.correctBoolean) earnedPoints += q.points;
        } else if (ans.selectedIndex === q.correctIndex) {
          earnedPoints += q.points;
        }
        break;
      case 'short_answer':
        // Simple keyword match (case-insensitive)
        if (q.correctAnswer && ans.textAnswer) {
          const keywords = q.correctAnswer.toLowerCase().split(',').map(k => k.trim());
          const studentText = ans.textAnswer.toLowerCase();
          const matched = keywords.filter(k => studentText.includes(k));
          // Award partial credit based on keyword matches
          if (keywords.length > 0) {
            earnedPoints += q.points * (matched.length / keywords.length);
          }
        }
        break;
    }
  }

  return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
}

/** Submit an exam attempt — grades it and saves the result. */
export function useSubmitExamAttempt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      examId: string;
      userId: string;
      questions: ExamQuestion[];
      answers: ExamAnswers;
      passingScore: number;
    }) => {
      const score = gradeExam(params.questions, params.answers);
      const passed = score >= params.passingScore;

      // Upsert: create or update the attempt
      const { data, error } = await supabase
        .from('student_exam_attempts')
        .insert({
          exam_id: params.examId,
          user_id: params.userId,
          answers: params.answers as any,
          score,
          passed,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { score, passed, attempt: data };
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
