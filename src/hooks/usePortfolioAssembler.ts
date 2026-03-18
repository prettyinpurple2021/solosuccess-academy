/**
 * @file usePortfolioAssembler.ts — Portfolio Assembler Hooks
 * 
 * Manages the student-built portfolio for Course 10:
 * 1. Fetches available deliverables from courses 1-9 (milestone submissions)
 * 2. CRUD for portfolio_entries (student-curated pieces)
 * 3. Reordering support
 * 
 * FLOW:
 * Student selects a course → pulls in their submission content →
 * writes an executive summary & connective narrative → saves entry →
 * reorders entries to build their custom professional dossier.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/* ─── Types ─── */

/** A saved portfolio entry the student has curated */
export interface PortfolioEntry {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  executive_summary: string;
  connective_narrative: string;
  deliverable_content: string;
  order_number: number;
  created_at: string;
  updated_at: string;
}

/** An available deliverable from a completed course (for selection) */
export interface AvailableDeliverable {
  courseId: string;
  courseTitle: string;
  courseOrderNumber: number;
  projectTitle: string;
  /** Combined text from milestone submissions or legacy project */
  submissionContent: string;
  /** Whether this course already has a portfolio entry */
  alreadyAdded: boolean;
}

/* ─── Query: Fetch saved portfolio entries ─── */

export function usePortfolioEntries(userId: string | undefined) {
  return useQuery({
    queryKey: ['portfolio-entries', userId],
    queryFn: async (): Promise<PortfolioEntry[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('portfolio_entries')
        .select('*')
        .eq('user_id', userId)
        .order('order_number', { ascending: true });

      if (error) throw error;
      return (data ?? []) as PortfolioEntry[];
    },
    enabled: !!userId,
  });
}

/* ─── Query: Fetch available deliverables from courses 1-9 ─── */

export function useAvailableDeliverables(
  userId: string | undefined,
  graduationCourseId: string | undefined
) {
  return useQuery({
    queryKey: ['available-deliverables', userId, graduationCourseId],
    queryFn: async (): Promise<AvailableDeliverable[]> => {
      if (!userId || !graduationCourseId) return [];

      // 1. Get courses 1-9
      const { data: courses, error: cErr } = await supabase
        .from('courses')
        .select('id, title, order_number, project_title')
        .neq('id', graduationCourseId)
        .order('order_number');
      if (cErr) throw cErr;
      if (!courses?.length) return [];

      const courseIds = courses.map(c => c.id);

      // 2. Get milestones for these courses
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('id, course_id, title, order_number')
        .in('course_id', courseIds)
        .order('order_number');

      // 3. Get milestone submissions
      const milestoneIds = milestones?.map(m => m.id) || [];
      const { data: milestoneSubs } = await supabase
        .from('project_milestone_submissions')
        .select('milestone_id, submission_content, status')
        .eq('user_id', userId)
        .in('milestone_id', milestoneIds.length > 0 ? milestoneIds : ['00000000-0000-0000-0000-000000000000']);

      // 4. Legacy fallback
      const { data: legacyProjects } = await supabase
        .from('course_projects')
        .select('course_id, submission_content')
        .eq('user_id', userId)
        .in('course_id', courseIds);

      // 5. Check which courses already have portfolio entries
      const { data: existingEntries } = await supabase
        .from('portfolio_entries')
        .select('course_id')
        .eq('user_id', userId);

      const addedCourseIds = new Set(existingEntries?.map(e => e.course_id) || []);

      // 6. Build deliverables list
      return courses.map(course => {
        const courseMilestones = milestones?.filter(m => m.course_id === course.id) || [];
        let submissionContent = '';

        if (courseMilestones.length > 0) {
          const texts = courseMilestones.map(m => {
            const sub = milestoneSubs?.find(s => s.milestone_id === m.id);
            if (!sub?.submission_content) return '';
            return `### Milestone ${m.order_number}: ${m.title}\n\n${sub.submission_content}`;
          }).filter(Boolean);
          submissionContent = texts.join('\n\n---\n\n');
        } else {
          const legacy = legacyProjects?.find(p => p.course_id === course.id);
          submissionContent = legacy?.submission_content || '';
        }

        return {
          courseId: course.id,
          courseTitle: course.title,
          courseOrderNumber: course.order_number,
          projectTitle: course.project_title || 'Course Project',
          submissionContent,
          alreadyAdded: addedCourseIds.has(course.id),
        };
      });
    },
    enabled: !!userId && !!graduationCourseId,
  });
}

/* ─── Mutation: Save (upsert) a portfolio entry ─── */

export function useSavePortfolioEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entry: {
      userId: string;
      courseId: string;
      title: string;
      executiveSummary: string;
      connectiveNarrative: string;
      deliverableContent: string;
      orderNumber: number;
    }) => {
      // Check if entry exists
      const { data: existing } = await supabase
        .from('portfolio_entries')
        .select('id')
        .eq('user_id', entry.userId)
        .eq('course_id', entry.courseId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('portfolio_entries')
          .update({
            title: entry.title,
            executive_summary: entry.executiveSummary,
            connective_narrative: entry.connectiveNarrative,
            deliverable_content: entry.deliverableContent,
            order_number: entry.orderNumber,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('portfolio_entries')
          .insert({
            user_id: entry.userId,
            course_id: entry.courseId,
            title: entry.title,
            executive_summary: entry.executiveSummary,
            connective_narrative: entry.connectiveNarrative,
            deliverable_content: entry.deliverableContent,
            order_number: entry.orderNumber,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio-entries'] });
      qc.invalidateQueries({ queryKey: ['available-deliverables'] });
    },
  });
}

/* ─── Mutation: Delete a portfolio entry ─── */

export function useDeletePortfolioEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('portfolio_entries')
        .delete()
        .eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio-entries'] });
      qc.invalidateQueries({ queryKey: ['available-deliverables'] });
    },
  });
}

/* ─── Mutation: Reorder entries ─── */

export function useReorderPortfolioEntries() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entries: { id: string; order_number: number }[]) => {
      // Update each entry's order_number
      for (const entry of entries) {
        const { error } = await supabase
          .from('portfolio_entries')
          .update({ order_number: entry.order_number })
          .eq('id', entry.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio-entries'] });
    },
  });
}
