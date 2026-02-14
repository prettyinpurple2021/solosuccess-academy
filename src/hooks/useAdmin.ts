/**
 * @file useAdmin.ts — Admin CRUD Hooks for Course & Lesson Management
 * 
 * Contains ALL admin-side data mutations for managing courses, lessons,
 * quizzes, worksheets, and activities. This is the largest hook file
 * in the project and handles the entire admin CMS workflow.
 * 
 * HOOKS IN THIS FILE:
 * ─── Queries ─────────────────────────────────
 * - useIsAdmin(userId)         → Check if user has admin role
 * - useAdminCourses()          → Fetch ALL courses (including unpublished)
 * - useAdminLessons(courseId)   → Fetch ALL lessons for a course
 * 
 * ─── Mutations ───────────────────────────────
 * - useCreateCourse()          → Create a new course
 * - useUpdateCourse()          → Update course fields
 * - useCreateLesson()          → Create a new lesson
 * - useUpdateLesson()          → Update lesson content/settings
 * - useDeleteLesson()          → Delete a lesson
 * - useReorderLessons()        → Drag-and-drop lesson reordering
 * 
 * ─── Standalone Functions ────────────────────
 * - uploadLessonVideo()        → Upload video to Storage
 * 
 * DATA TYPES DEFINED HERE:
 * - LessonType, CoursePhase (enums matching DB)
 * - Lesson, QuizData, QuizQuestion, WorksheetData, ActivityData
 * 
 * SECURITY:
 * - All mutations rely on RLS policies that check for admin role
 * - The client-side AdminLayout gate prevents non-admin access to the UI
 * - But the REAL security is the RLS policies on the database tables
 * 
 * PRODUCTION TODO:
 * - This file is 365 lines — consider splitting into:
 *   - useAdminCourses.ts (course CRUD)
 *   - useAdminLessons.ts (lesson CRUD)
 *   - adminTypes.ts (shared types)
 * - Add optimistic updates for drag-and-drop reordering
 * - Add bulk operations (publish/unpublish multiple lessons)
 * - The `onProgress` parameter in uploadLessonVideo is unused — implement
 *   it using tus protocol or XMLHttpRequest for progress tracking
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

// ──────────────────────────────────────────────
// TYPE DEFINITIONS
// These types mirror the database schema and are
// used by admin components to ensure type safety.
// ──────────────────────────────────────────────

/** All possible lesson content types (matches DB enum `lesson_type`) */
export type LessonType = 'text' | 'video' | 'quiz' | 'assignment' | 'worksheet' | 'activity';

/** The three curriculum phases (matches DB enum `course_phase`) */
export type CoursePhase = 'initialization' | 'orchestration' | 'launch';

/**
 * Full lesson data including all content types.
 * The `quiz_data`, `worksheet_data`, and `activity_data` fields are
 * stored as JSONB in PostgreSQL and parsed into these typed shapes.
 */
export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;           // Markdown content for text lessons
  video_url: string | null;          // Supabase Storage URL for video lessons
  type: LessonType;
  order_number: number;              // Controls display order (1-based)
  duration_minutes: number | null;
  quiz_data: QuizData | null;        // Structured quiz for 'quiz' type lessons
  worksheet_data: WorksheetData | null;  // Structured worksheet prompts
  activity_data: ActivityData | null;    // Structured activity steps
  is_published: boolean;             // Only published lessons visible to students
  created_at: string;
  updated_at: string;
}

/** A single quiz question with multiple choice options */
export interface QuizQuestion {
  id: string;                        // Client-generated UUID
  question: string;                  // The question text
  options: string[];                 // Array of answer choices (usually 4)
  correctAnswer: number;             // Index of correct option (0-based)
  explanation?: string;              // Optional explanation shown after answering
}

/** Quiz configuration stored in lessons.quiz_data JSONB column */
export interface QuizData {
  questions: QuizQuestion[];
  passingScore: number;              // Minimum percentage to pass (0-100)
}

/** Worksheet configuration stored in lessons.worksheet_data JSONB column */
export interface WorksheetData {
  instructions: string;              // Overall worksheet instructions
  sections: {
    id: string;                      // Client-generated UUID
    title: string;                   // Section heading
    prompts: string[];               // Writing prompts within the section
  }[];
}

/** Activity configuration stored in lessons.activity_data JSONB column */
export interface ActivityData {
  instructions: string;              // Overall activity instructions
  type: 'reflection' | 'exercise' | 'case-study' | 'brainstorm';
  steps: {
    id: string;                      // Client-generated UUID
    title: string;                   // Step heading
    description: string;             // Step details/instructions
  }[];
}

// ──────────────────────────────────────────────
// QUERY HOOKS
// ──────────────────────────────────────────────

/**
 * Check if the current user has the 'admin' role.
 * Queries the `user_roles` table for a matching row.
 * 
 * Used by AdminLayout to gate admin routes and by
 * the sidebar to show/hide admin navigation links.
 */
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

/**
 * Fetch ALL courses (admin view — includes unpublished).
 * Sorted by phase then order_number for consistent display.
 * 
 * NOTE: No RLS filter for is_published here — admin RLS policy
 * allows admins to see all courses.
 */
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

/**
 * Create a new course in the database.
 * Automatically assigns the next order_number within the phase.
 * New courses default to unpublished (is_published: false).
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (course: {
      title: string;
      description?: string | null;
      phase: CoursePhase;
      price_cents?: number;
    }) => {
      // Get the highest existing order_number for this phase
      const { data: existing } = await supabase
        .from('courses')
        .select('order_number')
        .eq('phase', course.phase)
        .order('order_number', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.order_number || 0) + 1;

      const { data, error } = await supabase
        .from('courses')
        .insert([{
          title: course.title,
          description: course.description || null,
          phase: course.phase,
          price_cents: course.price_cents || 4900,  // Default $49.00
          order_number: nextOrder,
          is_published: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate both admin and student course caches
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

/**
 * Transform a raw database lesson row into our typed Lesson interface.
 * Casts JSONB fields to their proper TypeScript types.
 */
function transformLesson(dbLesson: any): Lesson {
  return {
    ...dbLesson,
    type: dbLesson.type as LessonType,
    quiz_data: dbLesson.quiz_data as QuizData | null,
    worksheet_data: dbLesson.worksheet_data as WorksheetData | null,
    activity_data: dbLesson.activity_data as ActivityData | null,
    is_published: dbLesson.is_published ?? false,
  };
}

/**
 * Fetch ALL lessons for a course (admin view).
 * Returns lessons sorted by order_number for display in the admin editor.
 */
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

// ──────────────────────────────────────────────
// MUTATION HOOKS
// ──────────────────────────────────────────────

/**
 * Create a new lesson within a course.
 * All content fields are optional — the lesson type determines which
 * content field is relevant (e.g., quiz_data for quiz type).
 */
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
      is_published?: boolean;
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
        is_published: lesson.is_published ?? false,
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

/**
 * Update an existing lesson's content or settings.
 * Only sends changed fields to the database (partial update).
 * 
 * NOTE: The explicit field-by-field check (vs spreading updates directly)
 * prevents accidentally sending undefined values to Supabase.
 */
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
        is_published?: boolean;
      };
    }) => {
      // Build update payload — only include defined fields
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.video_url !== undefined) dbUpdates.video_url = updates.video_url;
      if (updates.duration_minutes !== undefined) dbUpdates.duration_minutes = updates.duration_minutes;
      if (updates.quiz_data !== undefined) dbUpdates.quiz_data = updates.quiz_data;
      if (updates.worksheet_data !== undefined) dbUpdates.worksheet_data = updates.worksheet_data;
      if (updates.activity_data !== undefined) dbUpdates.activity_data = updates.activity_data;
      if (updates.is_published !== undefined) dbUpdates.is_published = updates.is_published;

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

/**
 * Delete a lesson from a course.
 * 
 * WARNING: This is a hard delete with no undo. Consider adding
 * soft delete (is_deleted flag) for production.
 * 
 * PRODUCTION TODO:
 * - Also delete associated files from Storage (videos, etc.)
 * - Clean up user_progress records for this lesson
 * - Add confirmation dialog in the UI (handled by the component)
 */
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

/**
 * Reorder lessons via drag-and-drop.
 * Updates order_number for each affected lesson.
 * 
 * Uses Promise.all to update all lessons in parallel for speed.
 * If any single update fails, the error is thrown.
 * 
 * PRODUCTION TODO:
 * - Move to a single database function for atomicity
 * - Add optimistic updates so the UI doesn't flicker
 */
export function useReorderLessons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      updates,
    }: {
      courseId: string;
      updates: { id: string; order_number: number }[];
    }) => {
      const promises = updates.map(({ id, order_number }) =>
        supabase
          .from('lessons')
          .update({ order_number })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const error = results.find((r) => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', variables.courseId] });
    },
  });
}

/**
 * Update a course's fields (title, description, price, etc.).
 * Accepts any record of updates for flexibility.
 * 
 * PRODUCTION TODO: Add proper typing instead of Record<string, any>
 */
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

// ──────────────────────────────────────────────
// STANDALONE FUNCTIONS
// ──────────────────────────────────────────────

/**
 * Upload a video file to the 'lesson-videos' Storage bucket.
 * 
 * File path: {courseId}/{lessonId}-{timestamp}.{ext}
 * Uses upsert: true so re-uploading for the same lesson replaces the old file.
 * 
 * @param courseId - The course this video belongs to
 * @param lessonId - The lesson this video is for
 * @param file - The video File object from an <input>
 * @param onProgress - Optional progress callback (NOT YET IMPLEMENTED)
 * @returns The public URL of the uploaded video
 * 
 * PRODUCTION TODO:
 * - Implement onProgress using tus resumable uploads
 * - Add video format validation (mp4, webm only)
 * - Add file size limit (e.g., 500MB max)
 * - Consider video transcoding via a background job
 */
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
