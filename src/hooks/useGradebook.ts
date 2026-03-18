import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuizScore {
  progressId: string;
  lessonId: string;
  lessonTitle: string;
  score: number;
  adminOverrideScore: number | null;
  adminNotes: string | null;
  effectiveScore: number; // The score to display (override if exists, otherwise original)
}

export interface ActivityScore {
  progressId: string;
  lessonId: string;
  lessonTitle: string;
  score: number; // 0-100 percentage of steps completed
  adminOverrideScore: number | null;
  adminNotes: string | null;
  effectiveScore: number;
}

/** Represents a student's worksheet completion for a worksheet-type lesson */
export interface WorksheetScore {
  progressId: string;
  lessonId: string;
  lessonTitle: string;
  /** Number of answered exercises out of total */
  answeredCount: number;
  totalCount: number;
  /** Completion percentage (0-100) */
  completionPercent: number;
}

/**
 * Calculate a weighted combined grade from quiz, activity, and worksheet scores.
 * Weights: Quiz 50%, Activity 30%, Worksheet 20%
 * Only components with data contribute; weights redistribute proportionally.
 */
export function calculateCombinedGrade(
  quizScore: number, quizCount: number,
  activityScore: number, activityCount: number,
  worksheetScore: number, worksheetCount: number,
  weights?: { quizWeight: number; activityWeight: number; worksheetWeight: number; examWeight?: number; essayWeight?: number },
  examScore?: number, examCount?: number,
  essayScore?: number, essayCount?: number,
): { percentage: number; letter: string } {
  const w = weights || { quizWeight: 50, activityWeight: 30, worksheetWeight: 20, examWeight: 0, essayWeight: 0 };
  const components: { score: number; weight: number }[] = [];
  if (quizCount > 0) components.push({ score: quizScore, weight: w.quizWeight });
  if (activityCount > 0) components.push({ score: activityScore, weight: w.activityWeight });
  if (worksheetCount > 0) components.push({ score: worksheetScore, weight: w.worksheetWeight });
  if ((examCount ?? 0) > 0) components.push({ score: examScore ?? 0, weight: w.examWeight ?? 0 });
  if ((essayCount ?? 0) > 0) components.push({ score: essayScore ?? 0, weight: w.essayWeight ?? 0 });

  if (components.length === 0) return { percentage: 0, letter: '—' };

  const totalWeight = components.reduce((acc, c) => acc + c.weight, 0);
  if (totalWeight === 0) return { percentage: 0, letter: '—' };
  const weighted = components.reduce((acc, c) => acc + (c.score * c.weight / totalWeight), 0);
  const pct = Math.round(weighted);

  let letter: string;
  if (pct >= 93) letter = 'A';
  else if (pct >= 90) letter = 'A-';
  else if (pct >= 87) letter = 'B+';
  else if (pct >= 83) letter = 'B';
  else if (pct >= 80) letter = 'B-';
  else if (pct >= 77) letter = 'C+';
  else if (pct >= 73) letter = 'C';
  else if (pct >= 70) letter = 'C-';
  else if (pct >= 67) letter = 'D+';
  else if (pct >= 63) letter = 'D';
  else if (pct >= 60) letter = 'D-';
  else letter = 'F';

  return { percentage: pct, letter };
}

export interface StudentProgress {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  courses: CourseProgress[];
  overallProgress: number;
  totalQuizScore: number;
  quizCount: number;
  totalActivityScore: number;
  activityCount: number;
  totalWorksheetScore: number;
  worksheetCount: number;
  totalExamScore: number;
  examCount: number;
  totalEssayScore: number;
  essayCount: number;
  combinedGrade: { percentage: number; letter: string };
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  lessonsCompleted: number;
  totalLessons: number;
  progressPercent: number;
  quizScores: QuizScore[];
  activityScores: ActivityScore[];
  worksheetScores: WorksheetScore[];
  examScore: number | null;
  essayScore: number | null;
  projectStatus: 'draft' | 'submitted' | 'reviewed' | null;
  projectSubmittedAt: string | null;
}

// Fetch all students with their progress (admin only)
export function useGradebook() {
  return useQuery({
    queryKey: ['gradebook'],
    queryFn: async (): Promise<StudentProgress[]> => {
      // Get all purchases to find enrolled students
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('user_id, course_id');

      if (purchasesError) throw purchasesError;
      if (!purchases?.length) return [];

      // Get unique user IDs
      const userIds = [...new Set(purchases.map(p => p.user_id))];

      // Fetch profiles for all users using public view
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_public' as any)
        .select('id, display_name, avatar_url')
        .in('id', userIds) as { data: { id: string; display_name: string | null; avatar_url: string | null }[] | null; error: any };

      if (profilesError) throw profilesError;

      // Fetch all courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .order('order_number');

      if (coursesError) throw coursesError;

      // Fetch all lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, course_id, title, type');

      if (lessonsError) throw lessonsError;

      // Fetch all user progress (including admin override fields)
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('id, user_id, lesson_id, completed, quiz_score, activity_score, worksheet_answers, admin_override_score, admin_notes')
        .in('user_id', userIds);

      if (progressError) throw progressError;

      // Fetch all course projects
      const { data: projects, error: projectsError } = await supabase
        .from('course_projects')
        .select('user_id, course_id, status, submitted_at')
        .in('user_id', userIds);

      if (projectsError) throw projectsError;

      // Fetch exam attempts (best score per user per exam)
      const { data: examAttempts, error: examError } = await supabase
        .from('student_exam_attempts')
        .select('user_id, exam_id, score, passed')
        .in('user_id', userIds)
        .not('score', 'is', null);

      if (examError) throw examError;

      // Fetch final exams to map exam_id -> course_id
      const { data: finalExams, error: feError } = await supabase
        .from('course_final_exams')
        .select('id, course_id');

      if (feError) throw feError;

      // Fetch essay submissions with AI scores
      const { data: essaySubs, error: essaySubError } = await supabase
        .from('student_essay_submissions')
        .select('user_id, essay_id, ai_score')
        .in('user_id', userIds)
        .not('ai_score', 'is', null);

      if (essaySubError) throw essaySubError;

      // Fetch essays to map essay_id -> course_id
      const { data: courseEssays, error: ceError } = await supabase
        .from('course_essays')
        .select('id, course_id');

      if (ceError) throw ceError;

      // Build the gradebook data
      const studentData: StudentProgress[] = userIds.map(userId => {
        const profile = profiles?.find(p => p.id === userId);
        const userPurchases = purchases.filter(p => p.user_id === userId);
        const userProgress = progressData?.filter(p => p.user_id === userId) || [];
        const userProjects = projects?.filter(p => p.user_id === userId) || [];

        const courseProgressList: CourseProgress[] = userPurchases.map(purchase => {
          const course = courses?.find(c => c.id === purchase.course_id);
          const courseLessons = lessons?.filter(l => l.course_id === purchase.course_id) || [];
          const completedLessons = userProgress.filter(p => 
            courseLessons.some(l => l.id === p.lesson_id) && p.completed
          );
          
          // Get quiz scores for this course (including admin overrides)
          const quizScores: QuizScore[] = userProgress
            .filter(p => {
              const lesson = courseLessons.find(l => l.id === p.lesson_id);
              return lesson?.type === 'quiz' && (p.quiz_score !== null || p.admin_override_score !== null);
            })
            .map(p => {
              const lesson = courseLessons.find(l => l.id === p.lesson_id);
              const originalScore = p.quiz_score ?? 0;
              const overrideScore = p.admin_override_score;
              return {
                progressId: p.id,
                lessonId: p.lesson_id,
                lessonTitle: lesson?.title || 'Unknown',
                score: originalScore,
                adminOverrideScore: overrideScore,
                adminNotes: p.admin_notes,
                effectiveScore: overrideScore ?? originalScore,
              };
            });

          // Get activity scores for this course
          const activityScores: ActivityScore[] = userProgress
            .filter(p => {
              const lesson = courseLessons.find(l => l.id === p.lesson_id);
              return lesson?.type === 'activity' && (p.activity_score !== null || p.admin_override_score !== null);
            })
            .map(p => {
              const lesson = courseLessons.find(l => l.id === p.lesson_id);
              const originalScore = p.activity_score ?? 0;
              const overrideScore = p.admin_override_score;
              return {
                progressId: p.id,
                lessonId: p.lesson_id,
                lessonTitle: lesson?.title || 'Unknown',
                score: originalScore,
                adminOverrideScore: overrideScore,
                adminNotes: p.admin_notes,
                effectiveScore: overrideScore ?? originalScore,
              };
            });

          // Get worksheet completion scores for this course
          const worksheetScores: WorksheetScore[] = userProgress
            .filter(p => {
              const lesson = courseLessons.find(l => l.id === p.lesson_id);
              return lesson?.type === 'worksheet' && p.worksheet_answers !== null;
            })
            .map(p => {
              const lesson = courseLessons.find(l => l.id === p.lesson_id);
              const answers = p.worksheet_answers as Record<string, any> | null;
              let answeredCount = 0;
              let totalCount = 0;
              if (answers && typeof answers === 'object') {
                const values = Object.values(answers);
                totalCount = values.length;
                answeredCount = values.filter(v => 
                  v !== null && v !== undefined && v !== '' && 
                  !(typeof v === 'string' && v.trim() === '')
                ).length;
              }
              const completionPercent = totalCount > 0 
                ? Math.round((answeredCount / totalCount) * 100) 
                : 0;
              return {
                progressId: p.id,
                lessonId: p.lesson_id,
                lessonTitle: lesson?.title || 'Unknown',
                answeredCount,
                totalCount,
                completionPercent,
              };
            });

          // Get best exam score for this course
          const courseExam = finalExams?.find(e => e.course_id === purchase.course_id);
          const userExamAttempts = courseExam
            ? (examAttempts?.filter(a => a.user_id === userId && a.exam_id === courseExam.id) || [])
            : [];
          const bestExamScore = userExamAttempts.length > 0
            ? Math.max(...userExamAttempts.map(a => a.score ?? 0))
            : null;

          // Get best essay score for this course
          const courseEssay = courseEssays?.find(e => e.course_id === purchase.course_id);
          const userEssaySubs = courseEssay
            ? (essaySubs?.filter(s => s.user_id === userId && s.essay_id === courseEssay.id) || [])
            : [];
          const bestEssayScore = userEssaySubs.length > 0
            ? Math.max(...userEssaySubs.map(s => s.ai_score ?? 0))
            : null;

          const project = userProjects.find(p => p.course_id === purchase.course_id);

          return {
            courseId: purchase.course_id,
            courseTitle: course?.title || 'Unknown Course',
            lessonsCompleted: completedLessons.length,
            totalLessons: courseLessons.length,
            progressPercent: courseLessons.length > 0 
              ? Math.round((completedLessons.length / courseLessons.length) * 100) 
              : 0,
            quizScores,
            activityScores,
            worksheetScores,
            examScore: bestExamScore,
            essayScore: bestEssayScore,
            projectStatus: project?.status || null,
            projectSubmittedAt: project?.submitted_at || null,
          };
        });

        // Calculate overall stats
        const totalLessons = courseProgressList.reduce((acc, c) => acc + c.totalLessons, 0);
        const totalCompleted = courseProgressList.reduce((acc, c) => acc + c.lessonsCompleted, 0);
        const allQuizScores = courseProgressList.flatMap(c => c.quizScores);
        const avgQuizScore = allQuizScores.length > 0 
          ? Math.round(allQuizScores.reduce((acc, q) => acc + q.effectiveScore, 0) / allQuizScores.length) 
          : 0;
        const allActivityScores = courseProgressList.flatMap(c => c.activityScores);
        const avgActivityScore = allActivityScores.length > 0
          ? Math.round(allActivityScores.reduce((acc, a) => acc + a.effectiveScore, 0) / allActivityScores.length)
          : 0;
        const allWorksheetScores = courseProgressList.flatMap(c => c.worksheetScores);
        const avgWorksheetScore = allWorksheetScores.length > 0
          ? Math.round(allWorksheetScores.reduce((acc, w) => acc + w.completionPercent, 0) / allWorksheetScores.length)
          : 0;

        // Exam: average best scores across courses
        const examScores = courseProgressList.filter(c => c.examScore !== null).map(c => c.examScore!);
        const avgExamScore = examScores.length > 0
          ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length)
          : 0;

        // Essay: average best scores across courses
        const essayScoresArr = courseProgressList.filter(c => c.essayScore !== null).map(c => c.essayScore!);
        const avgEssayScore = essayScoresArr.length > 0
          ? Math.round(essayScoresArr.reduce((a, b) => a + b, 0) / essayScoresArr.length)
          : 0;

        return {
          userId,
          displayName: profile?.display_name || 'Unknown Student',
          avatarUrl: profile?.avatar_url || null,
          email: null,
          courses: courseProgressList,
          overallProgress: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0,
          totalQuizScore: avgQuizScore,
          quizCount: allQuizScores.length,
          totalActivityScore: avgActivityScore,
          activityCount: allActivityScores.length,
          totalWorksheetScore: avgWorksheetScore,
          worksheetCount: allWorksheetScores.length,
          totalExamScore: avgExamScore,
          examCount: examScores.length,
          totalEssayScore: avgEssayScore,
          essayCount: essayScoresArr.length,
          combinedGrade: calculateCombinedGrade(
            avgQuizScore, allQuizScores.length,
            avgActivityScore, allActivityScores.length,
            avgWorksheetScore, allWorksheetScores.length,
            undefined,
            avgExamScore, examScores.length,
            avgEssayScore, essayScoresArr.length,
          ),
        };
      });

      return studentData.sort((a, b) => b.overallProgress - a.overallProgress);
    },
  });
}

// Fetch single student details
export function useStudentDetails(userId: string | undefined) {
  return useQuery({
    queryKey: ['student-details', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: purchases } = await supabase
        .from('purchases')
        .select('*, courses(*)')
        .eq('user_id', userId);

      const { data: progress } = await supabase
        .from('user_progress')
        .select('*, lessons(*)')
        .eq('user_id', userId);

      const { data: projects } = await supabase
        .from('course_projects')
        .select('*')
        .eq('user_id', userId);

      return {
        profile,
        purchases,
        progress,
        projects,
      };
    },
    enabled: !!userId,
  });
}
