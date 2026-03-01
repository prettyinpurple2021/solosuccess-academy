/**
 * @file useProjects.ts — Course Project Submission Hooks
 * 
 * Manages the capstone project workflow for each course:
 * 1. Students write their project submission (draft)
 * 2. Students submit for review
 * 3. AI provides automated feedback via Edge Function
 * 4. Students can upload supporting files
 * 
 * PROJECT STATUS FLOW:
 * draft → submitted → reviewed (after AI feedback)
 * 
 * DATABASE TABLE: `course_projects`
 * - One project per user per course (unique constraint on user_id + course_id)
 * - Files stored in Storage 'project-files' bucket
 * 
 * HOOKS IN THIS FILE:
 * - useCourseProject(userId, courseId)  → Fetch existing project
 * - useSaveProjectDraft()              → Save/update draft (upsert)
 * - useSubmitProject()                 → Submit for review
 * - useRequestFeedback()               → Trigger AI feedback
 * 
 * STANDALONE FUNCTIONS:
 * - uploadProjectFile()                → Upload file to Storage (with validation)
 * - deleteProjectFile()                → Remove file from Storage
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Shape of a course project — mirrors the `course_projects` DB table */
export interface CourseProject {
  id: string;
  user_id: string;
  course_id: string;
  submission_content: string | null;
  file_urls: string[] | null;
  status: 'draft' | 'submitted' | 'reviewed';
  ai_feedback: string | null;
  ai_feedback_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Allowed MIME types for project file uploads */
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/** Maximum file size: 10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Fetch the current user's project for a specific course.
 * Returns null if they haven't started a project yet.
 */
export function useCourseProject(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-project', userId, courseId],
    queryFn: async (): Promise<CourseProject | null> => {
      if (!userId || !courseId) return null;

      const { data, error } = await supabase
        .from('course_projects')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;
      return data as CourseProject | null;
    },
    enabled: !!userId && !!courseId,
  });
}

/**
 * Mutation: Save project as a draft using upsert.
 * Uses the unique constraint on (user_id, course_id) for atomic upsert.
 */
export function useSaveProjectDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      courseId,
      submissionContent,
      fileUrls,
    }: {
      userId: string;
      courseId: string;
      submissionContent: string;
      fileUrls?: string[];
    }) => {
      // Upsert using the unique constraint on (user_id, course_id)
      const { data, error } = await supabase
        .from('course_projects')
        .upsert(
          {
            user_id: userId,
            course_id: courseId,
            submission_content: submissionContent,
            file_urls: fileUrls || [],
            status: 'draft' as const,
          },
          { onConflict: 'user_id,course_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-project', variables.userId, variables.courseId] });
    },
  });
}

/**
 * Mutation: Submit project for review using upsert.
 * Sets status to 'submitted' and records the submission timestamp.
 */
export function useSubmitProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      courseId,
      submissionContent,
      fileUrls,
    }: {
      userId: string;
      courseId: string;
      submissionContent: string;
      fileUrls?: string[];
    }) => {
      const { data, error } = await supabase
        .from('course_projects')
        .upsert(
          {
            user_id: userId,
            course_id: courseId,
            submission_content: submissionContent,
            file_urls: fileUrls || [],
            status: 'submitted' as const,
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,course_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return { projectId: data.id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-project', variables.userId, variables.courseId] });
    },
  });
}

/**
 * Mutation: Request AI feedback on a submitted project.
 * Calls the `project-feedback` Edge Function.
 */
export function useRequestFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId, courseId }: { projectId: string; userId: string; courseId: string }) => {
      const { data, error } = await supabase.functions.invoke('project-feedback', {
        body: { projectId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-project', variables.userId, variables.courseId] });
    },
  });
}

/**
 * Upload a file to the 'project-files' Storage bucket with validation.
 * 
 * Validates:
 * - File size (max 10MB)
 * - MIME type (only PDFs, images, text, Office documents)
 * 
 * File path structure: {userId}/{courseId}/{timestamp}-{random}.{ext}
 */
export async function uploadProjectFile(userId: string, courseId: string, file: File): Promise<string> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the 10MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
  }

  // Validate MIME type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(
      `File type "${file.type || 'unknown'}" is not allowed. Accepted types: PDF, images (JPG, PNG, GIF, WebP), text files, and Office documents.`
    );
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${courseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('project-files')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Delete a file from the 'project-files' Storage bucket.
 * Extracts the storage path from the full public URL.
 */
export async function deleteProjectFile(fileUrl: string): Promise<void> {
  const urlParts = fileUrl.split('/project-files/');
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];
  
  const { error } = await supabase.storage
    .from('project-files')
    .remove([filePath]);

  if (error) throw error;
}
