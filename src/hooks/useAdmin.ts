import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export type LessonType = 'text' | 'video' | 'quiz' | 'assignment' | 'worksheet' | 'activity';

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  type: LessonType;
  order_number: number;
  duration_minutes: number | null;
  quiz_data: QuizData | null;
  worksheet_data: WorksheetData | null;
  activity_data: ActivityData | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizData {
  questions: QuizQuestion[];
  passingScore: number;
}

export interface WorksheetData {
  instructions: string;
  sections: {
    id: string;
    title: string;
    prompts: string[];
  }[];
}

export interface ActivityData {
  instructions: string;
  type: 'reflection' | 'exercise' | 'case-study' | 'brainstorm';
  steps: {
    id: string;
    title: string;
    description: string;
  }[];
}

// Check if user is admin
export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ['isAdmin', userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId,
  });
}

// Fetch all courses (admin view - includes unpublished)
export function useAdminCourses() {
  return useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('phase')
        .order('order_number');

      if (error) throw error;
      return data;
    },
  });
}

// Helper to transform DB lesson to our Lesson type
function transformLesson(dbLesson: any): Lesson {
  return {
    ...dbLesson,
    type: dbLesson.type as LessonType,
    quiz_data: dbLesson.quiz_data as QuizData | null,
    worksheet_data: dbLesson.worksheet_data as WorksheetData | null,
    activity_data: dbLesson.activity_data as ActivityData | null,
  };
}

// Fetch lessons for a course
export function useAdminLessons(courseId: string | undefined) {
  return useQuery({
    queryKey: ['admin-lessons', courseId],
    queryFn: async (): Promise<Lesson[]> => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number');

      if (error) throw error;
      return (data || []).map(transformLesson);
    },
    enabled: !!courseId,
  });
}

// Create a new lesson
export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lesson: {
      course_id: string;
      title: string;
      type: LessonType;
      order_number: number;
      content?: string;
      video_url?: string;
      duration_minutes?: number;
      quiz_data?: QuizData | null;
      worksheet_data?: WorksheetData | null;
      activity_data?: ActivityData | null;
    }) => {
      const insertData: any = {
        course_id: lesson.course_id,
        title: lesson.title,
        type: lesson.type,
        order_number: lesson.order_number,
        content: lesson.content || null,
        video_url: lesson.video_url || null,
        duration_minutes: lesson.duration_minutes || null,
        quiz_data: lesson.quiz_data,
        worksheet_data: lesson.worksheet_data,
        activity_data: lesson.activity_data,
      };

      const { data, error } = await supabase
        .from('lessons')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return transformLesson(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', variables.course_id] });
    },
  });
}

// Update a lesson
export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      courseId,
      updates,
    }: {
      lessonId: string;
      courseId: string;
      updates: {
        title?: string;
        type?: LessonType;
        content?: string | null;
        video_url?: string | null;
        duration_minutes?: number | null;
        quiz_data?: QuizData | null;
        worksheet_data?: WorksheetData | null;
        activity_data?: ActivityData | null;
      };
    }) => {
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.video_url !== undefined) dbUpdates.video_url = updates.video_url;
      if (updates.duration_minutes !== undefined) dbUpdates.duration_minutes = updates.duration_minutes;
      if (updates.quiz_data !== undefined) dbUpdates.quiz_data = updates.quiz_data;
      if (updates.worksheet_data !== undefined) dbUpdates.worksheet_data = updates.worksheet_data;
      if (updates.activity_data !== undefined) dbUpdates.activity_data = updates.activity_data;

      const { data, error } = await supabase
        .from('lessons')
        .update(dbUpdates)
        .eq('id', lessonId)
        .select()
        .single();

      if (error) throw error;
      return transformLesson(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', variables.courseId] });
    },
  });
}

// Delete a lesson
export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, courseId }: { lessonId: string; courseId: string }) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', variables.courseId] });
    },
  });
}

// Update course
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      updates,
    }: {
      courseId: string;
      updates: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

// Upload lesson video
export async function uploadLessonVideo(
  courseId: string,
  lessonId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${courseId}/${lessonId}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('lesson-videos')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('lesson-videos').getPublicUrl(fileName);
  return data.publicUrl;
}
