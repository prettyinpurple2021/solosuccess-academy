/**
 * @file useProjectMilestones.ts — Milestone-based Project Hooks
 * 
 * Manages the milestone workflow for course projects:
 * 1. Fetch milestones for a course (ordered checkpoints)
 * 2. Fetch/save/submit milestone submissions
 * 3. Fetch rubric categories and scores
 * 4. Request AI feedback on individual milestones
 * 
 * MILESTONE FLOW:
 * Each course has 3-4 milestones → student submits each one →
 * AI reviews with rubric scoring → student can revise & resubmit.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/* ─── Types ─── */

/** A milestone checkpoint for a course project */
export interface ProjectMilestone {
  id: string;
  course_id: string;
  title: string;
  description: string;
  deliverable_prompt: string;
  order_number: number;
  created_at: string;
  updated_at: string;
}

/** A student's submission for one milestone */
export interface MilestoneSubmission {
  id: string;
  user_id: string;
  milestone_id: string;
  submission_content: string;
  file_urls: string[] | null;
  status: 'draft' | 'submitted' | 'reviewed';
  ai_feedback: string | null;
  ai_feedback_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** A rubric scoring category (e.g. "Clarity", "Depth") */
export interface RubricCategory {
  id: string;
  course_id: string;
  name: string;
  description: string;
  max_points: number;
  order_number: number;
  created_at: string;
}

/** Individual rubric score for a submission + category */
export interface RubricScore {
  id: string;
  submission_id: string;
  category_id: string;
  score: number;
  feedback: string | null;
  created_at: string;
}

/* ─── Query Hooks ─── */

/**
 * Fetch all milestones for a course, ordered by order_number.
 * Only returns data for courses the user has purchased (RLS enforced).
 */
export function useCourseMilestones(courseId: string | undefined) {
  return useQuery({
    queryKey: ['project-milestones', courseId],
    queryFn: async (): Promise<ProjectMilestone[]> => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ProjectMilestone[];
    },
    enabled: !!courseId,
  });
}

/**
 * Fetch ALL milestone submissions for a user + course.
 * Joins milestone_id so we can map submission → milestone.
 */
export function useMilestoneSubmissions(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['milestone-submissions', userId, courseId],
    queryFn: async (): Promise<MilestoneSubmission[]> => {
      if (!userId || !courseId) return [];

      // First get milestone IDs for this course
      const { data: milestones, error: mError } = await supabase
        .from('project_milestones')
        .select('id')
        .eq('course_id', courseId);

      if (mError) throw mError;
      if (!milestones?.length) return [];

      const milestoneIds = milestones.map((m) => m.id);

      // Then fetch submissions for those milestones
      const { data, error } = await supabase
        .from('project_milestone_submissions')
        .select('*')
        .eq('user_id', userId)
        .in('milestone_id', milestoneIds);

      if (error) throw error;
      return (data ?? []) as MilestoneSubmission[];
    },
    enabled: !!userId && !!courseId,
  });
}

/**
 * Fetch rubric categories for a course, ordered by order_number.
 */
export function useRubricCategories(courseId: string | undefined) {
  return useQuery({
    queryKey: ['rubric-categories', courseId],
    queryFn: async (): Promise<RubricCategory[]> => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('project_rubric_categories')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number', { ascending: true });

      if (error) throw error;
      return (data ?? []) as RubricCategory[];
    },
    enabled: !!courseId,
  });
}

/**
 * Fetch rubric scores for a specific submission.
 */
export function useRubricScores(submissionId: string | undefined) {
  return useQuery({
    queryKey: ['rubric-scores', submissionId],
    queryFn: async (): Promise<RubricScore[]> => {
      if (!submissionId) return [];
      const { data, error } = await supabase
        .from('project_rubric_scores')
        .select('*')
        .eq('submission_id', submissionId);

      if (error) throw error;
      return (data ?? []) as RubricScore[];
    },
    enabled: !!submissionId,
  });
}

/* ─── Mutation Hooks ─── */

/**
 * Save a milestone submission as a draft (upsert).
 * Uses the user_id + milestone_id to find or create.
 */
export function useSaveMilestoneDraft() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      milestoneId,
      submissionContent,
      fileUrls,
    }: {
      userId: string;
      milestoneId: string;
      submissionContent: string;
      fileUrls?: string[];
    }) => {
      // Check if a submission already exists
      const { data: existing } = await supabase
        .from('project_milestone_submissions')
        .select('id')
        .eq('user_id', userId)
        .eq('milestone_id', milestoneId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('project_milestone_submissions')
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
        // Insert new
        const { data, error } = await supabase
          .from('project_milestone_submissions')
          .insert({
            user_id: userId,
            milestone_id: milestoneId,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestone-submissions'] });
    },
  });
}

/**
 * Submit a milestone for AI review.
 * Sets status to 'submitted' and records timestamp.
 */
export function useSubmitMilestone() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      milestoneId,
      submissionContent,
      fileUrls,
    }: {
      userId: string;
      milestoneId: string;
      submissionContent: string;
      fileUrls?: string[];
    }) => {
      // Check if a submission already exists
      const { data: existing } = await supabase
        .from('project_milestone_submissions')
        .select('id')
        .eq('user_id', userId)
        .eq('milestone_id', milestoneId)
        .maybeSingle();

      let submissionId: string;

      if (existing) {
        const { data, error } = await supabase
          .from('project_milestone_submissions')
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
        submissionId = data.id;
      } else {
        const { data, error } = await supabase
          .from('project_milestone_submissions')
          .insert({
            user_id: userId,
            milestone_id: milestoneId,
            submission_content: submissionContent,
            file_urls: fileUrls || [],
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        submissionId = data.id;
      }

      return { submissionId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestone-submissions'] });
    },
  });
}

/**
 * Request AI feedback for a specific milestone submission.
 * Calls the milestone-feedback Edge Function.
 */
export function useRequestMilestoneFeedback() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId }: { submissionId: string }) => {
      const { data, error } = await supabase.functions.invoke('milestone-feedback', {
        body: { submissionId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestone-submissions'] });
      qc.invalidateQueries({ queryKey: ['rubric-scores'] });
    },
  });
}
