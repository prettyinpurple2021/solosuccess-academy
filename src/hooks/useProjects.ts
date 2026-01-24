import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

// Fetch project for a specific course
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

// Create or update project draft
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
      // Check if project exists
      const { data: existing } = await supabase
        .from('course_projects')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (existing) {
        // Update existing
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
        // Create new
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
      queryClient.invalidateQueries({ queryKey: ['course-project', variables.userId, variables.courseId] });
    },
  });
}

// Submit project for review
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
        // Update existing
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
        // Create new
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

// Request AI feedback
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

// Upload project file
export async function uploadProjectFile(userId: string, courseId: string, file: File): Promise<string> {
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

// Delete project file
export async function deleteProjectFile(fileUrl: string): Promise<void> {
  // Extract path from URL
  const urlParts = fileUrl.split('/project-files/');
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];
  
  const { error } = await supabase.storage
    .from('project-files')
    .remove([filePath]);

  if (error) throw error;
}
