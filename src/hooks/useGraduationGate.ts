/**
 * @file useGraduationGate.ts — Graduation Prerequisite Checker
 * 
 * Checks whether a student has completed ALL lessons across courses 1-9
 * before they can access the Course 10 graduation project.
 * 
 * WHY: The graduation project is a portfolio compilation of all 9 previous
 * course projects. Students must demonstrate mastery across the entire
 * curriculum before graduating.
 * 
 * WHAT IT CHECKS:
 * - For each of courses 1-9: total lessons vs completed lessons
 * - Returns per-course completion status and overall gate status
 * 
 * USED BY: CourseProject.tsx when the course is Course 10 (order_number = 10)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Per-course completion status for the gate UI */
export interface CourseCompletionStatus {
  courseId: string;
  courseTitle: string;
  orderNumber: number;
  projectTitle: string | null;
  totalLessons: number;
  completedLessons: number;
  isComplete: boolean;
  /** The student's best combined grade letter (from certificates or progress) */
  hasCertificate: boolean;
}

/** Overall graduation gate result */
export interface GraduationGateResult {
  /** Are ALL 9 prerequisite courses fully completed? */
  isUnlocked: boolean;
  /** How many of the 9 courses are fully complete */
  completedCourseCount: number;
  /** Detailed per-course breakdown */
  courses: CourseCompletionStatus[];
}

/**
 * Hook: Check if a student meets all graduation prerequisites.
 * Fetches courses 1-9, their lessons, user progress, and certificates.
 */
export function useGraduationGate(userId: string | undefined, graduationCourseId: string | undefined) {
  return useQuery({
    queryKey: ['graduation-gate', userId, graduationCourseId],
    queryFn: async (): Promise<GraduationGateResult> => {
      if (!userId) return { isUnlocked: false, completedCourseCount: 0, courses: [] };

      // 1. Get all courses except Course 10 (the graduation course)
      const { data: courses, error: cErr } = await supabase
        .from('courses')
        .select('id, title, order_number, project_title')
        .neq('id', graduationCourseId!)
        .order('order_number');
      if (cErr) throw cErr;
      if (!courses?.length) return { isUnlocked: false, completedCourseCount: 0, courses: [] };

      // 2. Get all lessons for these courses
      const courseIds = courses.map(c => c.id);
      const { data: lessons, error: lErr } = await supabase
        .from('lessons')
        .select('id, course_id')
        .in('course_id', courseIds);
      if (lErr) throw lErr;

      // 3. Get user's completed progress
      const { data: progress, error: pErr } = await supabase
        .from('user_progress')
        .select('lesson_id, completed')
        .eq('user_id', userId)
        .eq('completed', true);
      if (pErr) throw pErr;

      const completedSet = new Set(progress?.map(p => p.lesson_id) || []);

      // 4. Get certificates for badge display
      const { data: certificates } = await supabase
        .from('certificates')
        .select('course_id')
        .eq('user_id', userId);
      const certCourseIds = new Set(certificates?.map(c => c.course_id) || []);

      // 5. Build per-course status
      const courseStatuses: CourseCompletionStatus[] = courses.map(course => {
        const courseLessons = lessons?.filter(l => l.course_id === course.id) || [];
        const completedCount = courseLessons.filter(l => completedSet.has(l.id)).length;
        const total = courseLessons.length;

        return {
          courseId: course.id,
          courseTitle: course.title,
          orderNumber: course.order_number,
          projectTitle: course.project_title,
          totalLessons: total,
          completedLessons: completedCount,
          isComplete: total > 0 && completedCount >= total,
          hasCertificate: certCourseIds.has(course.id),
        };
      });

      const completedCourseCount = courseStatuses.filter(c => c.isComplete).length;

      return {
        isUnlocked: completedCourseCount >= courseStatuses.length,
        completedCourseCount,
        courses: courseStatuses,
      };
    },
    enabled: !!userId && !!graduationCourseId,
  });
}
