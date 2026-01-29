import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { GeneratedBulkCurriculum } from '@/hooks/useContentGenerator';
import type { CoursePhase } from '@/hooks/useAdmin';
import type { Json } from '@/integrations/supabase/types';

interface SaveBulkCurriculumOptions {
  phase: CoursePhase;
  priceCents?: number;
}

export function useSaveBulkCurriculum() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async ({
      curriculum,
      options,
    }: {
      curriculum: GeneratedBulkCurriculum;
      options: SaveBulkCurriculumOptions;
    }) => {
      setIsSaving(true);
      setSaveProgress('Creating course...');

      try {
        // 1. Get next order number for the phase
        const { data: existingCourses } = await supabase
          .from('courses')
          .select('order_number')
          .eq('phase', options.phase)
          .order('order_number', { ascending: false })
          .limit(1);

        const nextOrderNumber = (existingCourses?.[0]?.order_number || 0) + 1;

        // 2. Create the course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .insert({
            title: curriculum.course.title,
            description: curriculum.course.description,
            discussion_question: curriculum.course.discussion_question,
            project_title: curriculum.course.project_title,
            project_description: curriculum.course.project_description,
            phase: options.phase,
            order_number: nextOrderNumber,
            price_cents: options.priceCents || 4900,
            is_published: false,
          })
          .select()
          .single();

        if (courseError) throw courseError;

        const courseId = courseData.id;
        setSaveProgress('Creating lessons...');

        // 3. Create lessons
        const lessonInserts = curriculum.lessons.map((lesson, index) => {
          const baseLesson: {
            course_id: string;
            title: string;
            type: 'text' | 'video' | 'quiz' | 'assignment' | 'worksheet' | 'activity';
            order_number: number;
            content: string | null;
            is_published: boolean;
            quiz_data: Json | null;
            worksheet_data: Json | null;
            activity_data: Json | null;
          } = {
            course_id: courseId,
            title: lesson.title,
            type: lesson.type as 'text' | 'video' | 'quiz' | 'assignment' | 'worksheet' | 'activity',
            order_number: index + 1,
            content: lesson.content || null,
            is_published: false,
            quiz_data: null,
            worksheet_data: null,
            activity_data: null,
          };

          // Handle quiz data
          if (lesson.type === 'quiz' && lesson.quiz_data) {
            baseLesson.quiz_data = lesson.quiz_data;
          }

          // Handle worksheet data
          if (lesson.type === 'worksheet' && lesson.worksheet_data) {
            baseLesson.worksheet_data = lesson.worksheet_data;
          }

          // Handle activity data
          if (lesson.type === 'activity' && lesson.activity_data) {
            baseLesson.activity_data = lesson.activity_data;
          }

          return baseLesson;
        });

        // Add final exam as a quiz lesson if present
        if (curriculum.final_exam) {
          lessonInserts.push({
            course_id: courseId,
            title: curriculum.final_exam.title || 'Final Exam',
            type: 'quiz',
            order_number: lessonInserts.length + 1,
            content: curriculum.final_exam.instructions || null,
            is_published: false,
            quiz_data: {
              questions: curriculum.final_exam.questions.map((q) => ({
                id: crypto.randomUUID(),
                question: q.question,
                options: q.options,
                correctAnswer: q.correctIndex,
                explanation: q.explanation,
              })),
              passingScore: curriculum.final_exam.passingScore || 70,
            },
            worksheet_data: null,
            activity_data: null,
          });
        }

        const { error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonInserts);

        if (lessonsError) throw lessonsError;

        setSaveProgress('Creating textbook chapters...');

        // 4. Create textbook chapters and pages
        if (curriculum.textbook_chapters && curriculum.textbook_chapters.length > 0) {
          for (let i = 0; i < curriculum.textbook_chapters.length; i++) {
            const chapter = curriculum.textbook_chapters[i];

            // Create chapter
            const { data: chapterData, error: chapterError } = await supabase
              .from('textbook_chapters')
              .insert({
                course_id: courseId,
                title: chapter.title,
                order_number: i + 1,
                is_preview: i === 0, // First chapter is preview
              })
              .select()
              .single();

            if (chapterError) throw chapterError;

            // Create pages for this chapter
            if (chapter.pages && chapter.pages.length > 0) {
              const pageInserts = chapter.pages.map((page, pageIndex) => ({
                chapter_id: chapterData.id,
                page_number: pageIndex + 1,
                content: page.content,
                embedded_quiz: page.embedded_quiz || null,
              }));

              const { error: pagesError } = await supabase
                .from('textbook_pages')
                .insert(pageInserts);

              if (pagesError) throw pagesError;
            }

            setSaveProgress(`Creating textbook chapters... (${i + 1}/${curriculum.textbook_chapters.length})`);
          }
        }

        setSaveProgress('Complete!');
        return { courseId, courseTitle: curriculum.course.title };
      } finally {
        setIsSaving(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Curriculum saved!',
        description: `"${data.courseTitle}" has been created with all lessons and textbook content.`,
      });
    },
    onError: (error: any) => {
      console.error('Save curriculum error:', error);
      toast({
        title: 'Failed to save curriculum',
        description: error.message || 'An error occurred while saving the curriculum.',
        variant: 'destructive',
      });
    },
  });

  return {
    saveCurriculum: saveMutation.mutate,
    saveCurriculumAsync: saveMutation.mutateAsync,
    isSaving,
    saveProgress,
    isSuccess: saveMutation.isSuccess,
    savedCourseId: saveMutation.data?.courseId,
  };
}
