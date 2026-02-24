/**
 * useFinalExam – Hooks for generating, fetching, and managing
 * course final exams (mixed format: MCQ + short answer + true/false).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Shape of a single exam question (mixed format)
export interface ExamQuestion {
  id: string;
  type: 'mcq' | 'short_answer' | 'true_false';
  question: string;
  options?: string[];       // MCQ + true/false
  correctIndex?: number;    // MCQ
  correctAnswer?: string;   // short_answer expected keywords
  correctBoolean?: boolean; // true/false
  explanation: string;
  points: number;
}

export interface FinalExam {
  id: string;
  courseId: string;
  title: string;
  instructions: string | null;
  passingScore: number;
  questionCount: number;
  questions: ExamQuestion[];
  createdAt: string;
}

/** Fetch the final exam for a given course (if it exists). */
export function useFinalExam(courseId: string | undefined) {
  return useQuery({
    queryKey: ['final-exam', courseId],
    queryFn: async (): Promise<FinalExam | null> => {
      if (!courseId) return null;
      const { data, error } = await supabase
        .from('course_final_exams' as any)
        .select('*')
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const row = data as any;
      return {
        id: row.id,
        courseId: row.course_id,
        title: row.title,
        instructions: row.instructions,
        passingScore: row.passing_score,
        questionCount: row.question_count,
        questions: row.questions as ExamQuestion[],
        createdAt: row.created_at,
      };
    },
    enabled: !!courseId,
  });
}

/** Generate a final exam using AI and save it to the database. */
export function useGenerateFinalExam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      courseId: string;
      courseTitle: string;
      courseDescription: string;
      questionCount: number;
    }) => {
      // Call the generate-content edge function with type 'final_exam_mixed'
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          type: 'final_exam_mixed',
          context: {
            courseTitle: params.courseTitle,
            courseDescription: params.courseDescription,
            questionCount: params.questionCount,
          },
        },
      });

      if (error) throw new Error(error.message || 'Failed to generate exam');
      if (data?.error) throw new Error(data.error);

      const examData = data.content;

      // Upsert into course_final_exams
      const { error: upsertError } = await supabase
        .from('course_final_exams' as any)
        .upsert(
          {
            course_id: params.courseId,
            title: examData.title || `Final Exam: ${params.courseTitle}`,
            instructions: examData.instructions || 'Answer all questions to the best of your ability.',
            passing_score: examData.passingScore || 70,
            question_count: examData.questions?.length || params.questionCount,
            questions: examData.questions || [],
          } as any,
          { onConflict: 'course_id' }
        );

      if (upsertError) throw upsertError;
      return examData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['final-exam', variables.courseId] });
      toast({ title: 'Final exam generated!', description: 'Review and edit the questions as needed.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to generate exam', description: error.message, variant: 'destructive' });
    },
  });
}
