/**
 * @file useStudentGrades.ts — Hook for fetching a student's own grades
 * 
 * Fetches lessons, user_progress, exam attempts, and essay submissions
 * for the current user, then calculates weighted grades per course
 * using the same calculateCombinedGrade function the admin gradebook uses.
 * 
 * WHY: The Transcript page previously used dummy completion-based grades.
 * This hook provides accurate, weighted grades matching the admin view.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateCombinedGrade } from '@/hooks/useGradebook';
import { useGradeSettings, getWeightsForCourse, type GradeWeights } from '@/hooks/useGradeSettings';

/** Per-course grade breakdown for the student */
export interface StudentCourseGrade {
  courseId: string;
  courseTitle: string;
  phase: string;
  /** Average quiz score (0-100) across quiz-type lessons */
  quizAvg: number;
  quizCount: number;
  /** Average activity score (0-100) */
  activityAvg: number;
  activityCount: number;
  /** Average worksheet completion (0-100) */
  worksheetAvg: number;
  worksheetCount: number;
  /** Best final exam score (0-100) or null */
  examScore: number | null;
  /** Best essay score (0-100) or null */
  essayScore: number | null;
  /** Combined weighted grade */
  combinedGrade: { percentage: number; letter: string };
  /** Lesson completion stats */
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
}

/**
 * Fetch the current student's per-course grade breakdown.
 * Uses the same logic as the admin gradebook but scoped to one user.
 */
export function useStudentGrades(userId: string | undefined) {
  const { data: gradeSettings } = useGradeSettings();

  return useQuery({
    queryKey: ['student-grades', userId],
    queryFn: async (): Promise<StudentCourseGrade[]> => {
      if (!userId) return [];

      // 1. Get purchased courses
      const { data: purchases, error: pErr } = await supabase
        .from('purchases')
        .select('course_id');
      if (pErr) throw pErr;
      if (!purchases?.length) return [];

      const courseIds = purchases.map(p => p.course_id);

      // 2. Fetch courses for titles/phases
      const { data: courses, error: cErr } = await supabase
        .from('courses')
        .select('id, title, phase, order_number')
        .in('id', courseIds)
        .order('order_number');
      if (cErr) throw cErr;

      // 3. Fetch lessons for these courses
      const { data: lessons, error: lErr } = await supabase
        .from('lessons')
        .select('id, course_id, type')
        .in('course_id', courseIds);
      if (lErr) throw lErr;

      // 4. Fetch user progress
      const { data: progress, error: prErr } = await supabase
        .from('user_progress')
        .select('lesson_id, completed, quiz_score, activity_score, worksheet_answers, admin_override_score')
        .eq('user_id', userId);
      if (prErr) throw prErr;

      // 5. Fetch exam attempts + exam→course mapping
      const { data: finalExams } = await supabase
        .from('course_final_exams')
        .select('id, course_id')
        .in('course_id', courseIds);

      const examIds = finalExams?.map(e => e.id) || [];
      const { data: examAttempts } = await supabase
        .from('student_exam_attempts')
        .select('exam_id, score')
        .eq('user_id', userId)
        .not('score', 'is', null)
        .in('exam_id', examIds.length > 0 ? examIds : ['00000000-0000-0000-0000-000000000000']);

      // 6. Fetch essay submissions + essay→course mapping
      const { data: courseEssays } = await supabase
        .from('course_essays')
        .select('id, course_id')
        .in('course_id', courseIds);

      const essayIds = courseEssays?.map(e => e.id) || [];
      const { data: essaySubs } = await supabase
        .from('student_essay_submissions')
        .select('essay_id, ai_score, admin_score')
        .eq('user_id', userId)
        .in('essay_id', essayIds.length > 0 ? essayIds : ['00000000-0000-0000-0000-000000000000']);

      // 7. Build per-course grades
      return (courses || []).map(course => {
        const courseLessons = lessons?.filter(l => l.course_id === course.id) || [];
        const lessonIds = new Set(courseLessons.map(l => l.id));
        const courseProgress = progress?.filter(p => lessonIds.has(p.lesson_id)) || [];

        // Quiz scores
        const quizLessons = courseLessons.filter(l => l.type === 'quiz');
        const quizScores = courseProgress
          .filter(p => quizLessons.some(l => l.id === p.lesson_id) && (p.quiz_score !== null || p.admin_override_score !== null))
          .map(p => p.admin_override_score ?? p.quiz_score ?? 0);
        const quizAvg = quizScores.length > 0
          ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
          : 0;

        // Activity scores
        const actLessons = courseLessons.filter(l => l.type === 'activity');
        const actScores = courseProgress
          .filter(p => actLessons.some(l => l.id === p.lesson_id) && (p.activity_score !== null || p.admin_override_score !== null))
          .map(p => p.admin_override_score ?? p.activity_score ?? 0);
        const activityAvg = actScores.length > 0
          ? Math.round(actScores.reduce((a, b) => a + b, 0) / actScores.length)
          : 0;

        // Worksheet scores
        const wsLessons = courseLessons.filter(l => l.type === 'worksheet');
        const wsScores = courseProgress
          .filter(p => wsLessons.some(l => l.id === p.lesson_id) && p.worksheet_answers !== null)
          .map(p => {
            const answers = p.worksheet_answers as Record<string, any> | null;
            if (!answers || typeof answers !== 'object') return 0;
            const vals = Object.values(answers);
            const total = vals.length;
            const answered = vals.filter(v => v !== null && v !== undefined && v !== '' && !(typeof v === 'string' && v.trim() === '')).length;
            return total > 0 ? Math.round((answered / total) * 100) : 0;
          });
        const worksheetAvg = wsScores.length > 0
          ? Math.round(wsScores.reduce((a, b) => a + b, 0) / wsScores.length)
          : 0;

        // Exam score (best attempt)
        const courseExam = finalExams?.find(e => e.course_id === course.id);
        const examAtts = courseExam
          ? (examAttempts?.filter(a => a.exam_id === courseExam.id) || [])
          : [];
        const examScore = examAtts.length > 0
          ? Math.max(...examAtts.map(a => a.score ?? 0))
          : null;

        // Essay score (best submission — admin score takes priority)
        const courseEssay = courseEssays?.find(e => e.course_id === course.id);
        const essSubs = courseEssay
          ? (essaySubs?.filter(s => s.essay_id === courseEssay.id) || [])
          : [];
        const essayScore = essSubs.length > 0
          ? Math.max(...essSubs.map(s => (s.admin_score ?? s.ai_score ?? 0)))
          : null;

        // Combined weighted grade
        const weights = getWeightsForCourse(gradeSettings, course.id);
        const combinedGrade = calculateCombinedGrade(
          quizAvg, quizScores.length,
          activityAvg, actScores.length,
          worksheetAvg, wsScores.length,
          weights,
          examScore ?? 0, examScore !== null ? 1 : 0,
          essayScore ?? 0, essayScore !== null ? 1 : 0,
        );

        const completedLessons = courseProgress.filter(p => p.completed).length;

        return {
          courseId: course.id,
          courseTitle: course.title,
          phase: course.phase,
          quizAvg,
          quizCount: quizScores.length,
          activityAvg,
          activityCount: actScores.length,
          worksheetAvg,
          worksheetCount: wsScores.length,
          examScore,
          essayScore,
          combinedGrade,
          completedLessons,
          totalLessons: courseLessons.length,
          completionPercent: courseLessons.length > 0
            ? Math.round((completedLessons / courseLessons.length) * 100)
            : 0,
        };
      });
    },
    enabled: !!userId && !!gradeSettings,
  });
}
