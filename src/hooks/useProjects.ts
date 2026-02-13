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
 * - One project per user per course (unique on user_id + course_id)
 * - Files stored in Supabase Storage 'project-files' bucket
 * 
 * HOOKS IN THIS FILE:
 * - useCourseProject(userId, courseId)  → Fetch existing project
 * - useSaveProjectDraft()              → Save/update draft
 * - useSubmitProject()                 → Submit for review
 * - useRequestFeedback()               → Trigger AI feedback
 * 
 * STANDALONE FUNCTIONS:
 * - uploadProjectFile()                → Upload file to Storage
 * - deleteProjectFile()                → Remove file from Storage
 * 
 * PRODUCTION TODO:
 * - Add file size limits and type validation
 * - Implement file virus scanning before upload
 * - Add version history for project submissions
 * - Consider debouncing draft saves for auto-save feature
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Shape of a course project — mirrors the `course_projects` DB table */
export interface CourseProject {
  id: string;
  user_id: string;
  course_id: string;
  submission_content: string | null;    // The student's written submission (Markdown)
  file_urls: string[] | null;           // Array of Supabase Storage URLs
  status: 'draft' | 'submitted' | 'reviewed';
  ai_feedback: string | null;           // AI-generated feedback text
  ai_feedback_at: string | null;        // When AI feedback was generated
  submitted_at: string | null;          // When the student hit "Submit"
  created_at: string;
  updated_at: string;
}

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
 * Mutation: Save project as a draft.
 * 
 * Uses a check-then-insert/update pattern because there's no
 * upsert-friendly unique constraint exposed via the API.
 * 
 * PRODUCTION TODO: Add a unique constraint on (user_id, course_id)
 * and switch to upsert for atomicity.
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
      // Check if a project already exists for this user+course
      const { data: existing } = await supabase
        .from('course_projects')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (existing) {
        // Update existing draft
        const { data, error } = await supabase
          .from('course_projects')
          .update({
            submission_content: submissionContent,
            file_urls: fileUrls || [],
            status: 'draft',
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new draft project
        const { data, error } = await supabase
          .from('course_projects')
          .insert({
            user_id: userId,
            course_id: courseId,
            submission_content: submissionContent,
            file_urls: fileUrls || [],
            status: 'draft',
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      // Refresh the project data in the cache
      queryClient.invalidateQueries({ queryKey: ['course-project', variables.userId, variables.courseId] });
    },
  });
}

/**
 * Mutation: Submit project for review.
 * Same check-then-insert/update pattern, but sets status to 'submitted'
 * and records the submission timestamp.
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
      // Check if project exists
      const { data: existing } = await supabase
        .from('course_projects')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      let projectId: string;

      if (existing) {
        // Update existing → submitted
        const { data, error } = await supabase
          .from('course_projects')
          .update({
            submission_content: submissionContent,
            file_urls: fileUrls || [],
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        projectId = data.id;
      } else {
        // Create new → submitted
        const { data, error } = await supabase
          .from('course_projects')
          .insert({
            user_id: userId,
            course_id: courseId,
            submission_content: submissionContent,
            file_urls: fileUrls || [],
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        projectId = data.id;
      }

      return { projectId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-project', variables.userId, variables.courseId] });
    },
  });
}

/**
 * Mutation: Request AI feedback on a submitted project.
 * 
 * Calls the `project-feedback` Edge Function which:
 * 1. Reads the project submission content
 * 2. Sends it to an AI model for analysis
 * 3. Stores the feedback in the `ai_feedback` column
 * 4. Updates status to 'reviewed'
 * 
 * @param projectId - The project to get feedback on
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
 * Upload a file to the 'project-files' Storage bucket.
 * 
 * File path structure: {userId}/{courseId}/{timestamp}-{random}.{ext}
 * This ensures unique filenames and organizes files by user and course.
 * 
 * @param userId - The uploading user's ID
 * @param courseId - The course this file belongs to
 * @param file - The File object from an <input type="file">
 * @returns The public URL of the uploaded file
 * 
 * PRODUCTION TODO:
 * - Add file size validation (e.g., max 10MB)
 * - Add MIME type validation (only allow PDF, images, etc.)
 * - Consider making the bucket private and using signed URLs
 */
export async function uploadProjectFile(userId: string, courseId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${courseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Get the public URL for the uploaded file
  const { data } = supabase.storage
    .from('project-files')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Delete a file from the 'project-files' Storage bucket.
 * Extracts the storage path from the full public URL.
 * 
 * @param fileUrl - The full public URL of the file to delete
 */
export async function deleteProjectFile(fileUrl: string): Promise<void> {
  // Extract the storage path from the URL
  // URL format: https://...supabase.co/storage/v1/object/public/project-files/{path}
  const urlParts = fileUrl.split('/project-files/');
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];
  
  const { error } = await supabase.storage
    .from('project-files')
    .remove([filePath]);

  if (error) throw error;
}
