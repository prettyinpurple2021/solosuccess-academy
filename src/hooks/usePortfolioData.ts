/**
 * @file usePortfolioData.ts — Aggregates data for portfolio PDF generation
 * 
 * Fetches all 9 course projects' submissions, grades, and certificates
 * to feed into the portfolioGenerator PDF builder.
 * 
 * DATA SOURCES:
 * - courses table → title, project_title, project_description
 * - project_milestone_submissions → milestone-based submissions
 * - course_projects → legacy single submissions (fallback)
 * - useStudentGrades → grade data per course
 * - certificates → verification codes
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStudentGrades } from '@/hooks/useStudentGrades';
import type { PortfolioCourseEntry, PortfolioData } from '@/lib/portfolioGenerator';

/**
 * Hook: Aggregate all data needed for the portfolio PDF.
 * Only fetches for courses 1-9 (excludes the graduation course).
 */
export function usePortfolioData(
  userId: string | undefined,
  graduationCourseId: string | undefined,
  studentName: string
) {
  const { data: grades } = useStudentGrades(userId);

  return useQuery({
    queryKey: ['portfolio-data', userId, graduationCourseId],
    queryFn: async (): Promise<PortfolioData> => {
      if (!userId) throw new Error('Not authenticated');

      // 1. Get courses 1-9 (exclude graduation course)
      const { data: courses, error: cErr } = await supabase
        .from('courses')
        .select('id, title, order_number, project_title, project_description')
        .neq('id', graduationCourseId!)
        .order('order_number');
      if (cErr) throw cErr;

      // 2. Get all milestones for these courses
      const courseIds = courses?.map(c => c.id) || [];
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('id, course_id, title, order_number')
        .in('course_id', courseIds)
        .order('order_number');

      // 3. Get all milestone submissions for this user
      const milestoneIds = milestones?.map(m => m.id) || [];
      const { data: milestoneSubs } = await supabase
        .from('project_milestone_submissions')
        .select('milestone_id, submission_content, status')
        .eq('user_id', userId)
        .in('milestone_id', milestoneIds.length > 0 ? milestoneIds : ['00000000-0000-0000-0000-000000000000']);

      // 4. Get legacy course_projects as fallback
      const { data: legacyProjects } = await supabase
        .from('course_projects')
        .select('course_id, submission_content')
        .eq('user_id', userId)
        .in('course_id', courseIds);

      // 5. Get certificates
      const { data: certificates } = await supabase
        .from('certificates')
        .select('course_id, verification_code')
        .eq('user_id', userId);

      // 6. Build entries
      const entries: PortfolioCourseEntry[] = (courses || []).map(course => {
        // Get submission text from milestones (preferred) or legacy project
        const courseMilestones = milestones?.filter(m => m.course_id === course.id) || [];
        let submissionText = '';

        if (courseMilestones.length > 0) {
          // Concatenate milestone submissions in order
          const milestoneTexts = courseMilestones.map(m => {
            const sub = milestoneSubs?.find(s => s.milestone_id === m.id);
            if (!sub?.submission_content) return '';
            return `### Milestone ${m.order_number}: ${m.title}\n\n${sub.submission_content}`;
          }).filter(Boolean);
          submissionText = milestoneTexts.join('\n\n---\n\n');
        } else {
          // Fallback to legacy project
          const legacy = legacyProjects?.find(p => p.course_id === course.id);
          submissionText = legacy?.submission_content || '';
        }

        // Grade from useStudentGrades
        const grade = grades?.find(g => g.courseId === course.id);
        const cert = certificates?.find(c => c.course_id === course.id);

        return {
          orderNumber: course.order_number,
          courseTitle: course.title,
          projectTitle: course.project_title || 'Course Project',
          projectDescription: course.project_description || '',
          gradePercent: grade?.combinedGrade.percentage ?? 0,
          gradeLetter: grade?.combinedGrade.letter ?? '—',
          submissionText,
          certificateCode: cert?.verification_code ?? null,
        };
      });

      return {
        studentName,
        generatedAt: new Date().toISOString(),
        entries,
      };
    },
    enabled: !!userId && !!graduationCourseId && !!grades,
  });
}
