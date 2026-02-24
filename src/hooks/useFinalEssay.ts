/**
 * useFinalEssay – Hooks for generating essay prompts + rubrics,
 * and for AI auto-grading student essay submissions.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EssayPrompt {
  title: string;
  description: string;
  guiding_questions: string[];
}

export interface RubricCriterion {
  name: string;
  description: string;
  maxPoints: number;
}

export interface CourseEssay {
  id: string;
  courseId: string;
  title: string;
  prompts: EssayPrompt[];
  rubric: { criteria: RubricCriterion[]; totalPoints: number };
  wordLimit: number;
  createdAt: string;
}

/** Fetch the essay config for a given course. */
export function useCourseEssay(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-essay', courseId],
    queryFn: async (): Promise<CourseEssay | null> => {
      if (!courseId) return null;
      const { data, error } = await supabase
        .from('course_essays' as any)
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
        prompts: row.prompts as EssayPrompt[],
        rubric: row.rubric as { criteria: RubricCriterion[]; totalPoints: number },
        wordLimit: row.word_limit,
        createdAt: row.created_at,
      };
    },
    enabled: !!courseId,
  });
}

/** Generate essay prompts + rubric using AI and save to database. */
export function useGenerateEssay() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      courseId: string;
      courseTitle: string;
      courseDescription: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          type: 'final_essay',
          context: {
            courseTitle: params.courseTitle,
            courseDescription: params.courseDescription,
          },
        },
      });

      if (error) throw new Error(error.message || 'Failed to generate essay prompts');
      if (data?.error) throw new Error(data.error);

      const essayData = data.content;

      const { error: upsertError } = await supabase
        .from('course_essays' as any)
        .upsert(
          {
            course_id: params.courseId,
            title: essayData.title || `Final Essay: ${params.courseTitle}`,
            prompts: essayData.prompts || [],
            rubric: essayData.rubric || { criteria: [], totalPoints: 100 },
            word_limit: essayData.wordLimit || 1500,
          } as any,
          { onConflict: 'course_id' }
        );

      if (upsertError) throw upsertError;
      return essayData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-essay', variables.courseId] });
      toast({ title: 'Essay prompts generated!', description: 'Review the prompts and rubric.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to generate essay', description: error.message, variant: 'destructive' });
    },
  });
}

/** AI-grade a student essay submission. */
export function useGradeEssay() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      submissionId: string;
      essayContent: string;
      prompt: EssayPrompt;
      rubric: { criteria: RubricCriterion[]; totalPoints: number };
      courseTitle: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          type: 'grade_essay',
          context: {
            courseTitle: params.courseTitle,
            documentContent: params.essayContent,
          },
          customPrompt: `Grade the following student essay based on this rubric and prompt.

ESSAY PROMPT: "${params.prompt.title}" — ${params.prompt.description}

RUBRIC CRITERIA:
${params.rubric.criteria.map(c => `- ${c.name} (${c.maxPoints} pts): ${c.description}`).join('\n')}

Total possible points: ${params.rubric.totalPoints}

STUDENT ESSAY:
${params.essayContent}

Return your assessment as JSON:
{
  "totalScore": <number out of ${params.rubric.totalPoints}>,
  "percentage": <0-100>,
  "criteriaScores": [
    { "name": "<criterion name>", "score": <number>, "maxScore": <number>, "feedback": "<specific feedback>" }
  ],
  "overallFeedback": "<2-3 paragraphs of constructive feedback>",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"]
}`,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const gradeData = data.content;

      // Update the submission with AI grades
      const { error: updateError } = await supabase
        .from('student_essay_submissions' as any)
        .update({
          ai_score: gradeData.percentage ?? gradeData.totalScore,
          ai_feedback: gradeData.overallFeedback,
          ai_rubric_scores: gradeData,
          ai_graded_at: new Date().toISOString(),
        } as any)
        .eq('id', params.submissionId);

      if (updateError) throw updateError;
      return gradeData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essay-submissions'] });
      toast({ title: 'Essay graded by AI!', description: 'Review the feedback and scores.' });
    },
    onError: (error: any) => {
      toast({ title: 'Grading failed', description: error.message, variant: 'destructive' });
    },
  });
}
