import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ContentType = 'course_outline' | 'lesson_content' | 'quiz' | 'worksheet' | 'activity' | 'exam' | 'textbook_chapter' | 'textbook_page' | 'bulk_curriculum' | 'practice_lab';

export interface GenerateContext {
  courseTitle?: string;
  courseDescription?: string;
  lessonTitle?: string;
  lessonType?: string;
  topic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  questionCount?: number;
  chapterTitle?: string;
  pageCount?: number;
  documentContent?: string;
  documentFileName?: string;
}

export interface GeneratedCourseOutline {
  title: string;
  description: string;
  discussion_question: string;
  project_title: string;
  project_description: string;
  lessons: Array<{
    title: string;
    type: string;
    description: string;
  }>;
}

export interface GeneratedQuiz {
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export interface GeneratedWorksheet {
  title: string;
  instructions: string;
  sections: Array<{
    title: string;
    description: string;
    exercises: Array<{
      type: string;
      prompt: string;
      hints?: string;
    }>;
  }>;
}

export interface GeneratedActivity {
  title: string;
  description: string;
  objectives: string[];
  steps: Array<{
    stepNumber: number;
    title: string;
    instructions: string;
    duration: string;
    deliverable: string;
  }>;
  reflection: string;
}

export interface GeneratedTextbookChapter {
  title: string;
  pages: Array<{
    content: string;
    embedded_quiz: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    } | null;
  }>;
}

export interface GeneratedTextbookPage {
  content: string;
  embedded_quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  } | null;
}

export interface GeneratedBulkCurriculum {
  course: {
    title: string;
    description: string;
    discussion_question: string;
    project_title: string;
    project_description: string;
  };
  lessons: Array<{
    title: string;
    type: string;
    content?: string;
    quiz_data?: any;
    worksheet_data?: any;
    activity_data?: any;
  }>;
  textbook_chapters: Array<{
    title: string;
    pages: Array<{
      content: string;
      embedded_quiz: any | null;
    }>;
  }>;
  final_exam: {
    title: string;
    instructions: string;
    passingScore: number;
    questions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
      points: number;
    }>;
  };
}

export function useContentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateContent = async <T = string>(
    type: ContentType,
    context: GenerateContext,
    customPrompt?: string
  ): Promise<T | null> => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type, context, customPrompt },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate content');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Content generated!',
        description: 'AI has created your content. Review and edit as needed.',
      });

      return data.content as T;
    } catch (error: any) {
      console.error('Content generation error:', error);
      
      let errorMessage = 'Failed to generate content';
      if (error.message?.includes('Rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message?.includes('Admin access')) {
        errorMessage = 'Admin access required to generate content.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Generation failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateContent,
    isGenerating,
  };
}
