import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/edgeFunctions';

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

    // invokeEdgeFunction auto-toasts on 429 / 402 / 403, so we only need
    // to surface the success toast here.
    const { data, error } = await invokeEdgeFunction<{ content: T }>(
      'generate-content',
      { body: { type, context, customPrompt } },
    );

    setIsGenerating(false);

    if (error) return null;

    toast({
      title: 'Content generated!',
      description: 'AI has created your content. Review and edit as needed.',
    });

    return (data?.content ?? null) as T | null;
  };

  return {
    generateContent,
    isGenerating,
  };
}
