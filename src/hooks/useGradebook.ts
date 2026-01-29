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

export interface StudentProgress {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  courses: CourseProgress[];
  overallProgress: number;
  totalQuizScore: number;
  quizCount: number;
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  lessonsCompleted: number;
  totalLessons: number;
  progressPercent: number;
  quizScores: QuizScore[];
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
        .select('id, user_id, lesson_id, completed, quiz_score, admin_override_score, admin_notes')
        .in('user_id', userIds);

      if (progressError) throw progressError;

      // Fetch all course projects
      const { data: projects, error: projectsError } = await supabase
        .from('course_projects')
        .select('user_id, course_id, status, submitted_at')
        .in('user_id', userIds);

      if (projectsError) throw projectsError;

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

        return {
          userId,
          displayName: profile?.display_name || 'Unknown Student',
          avatarUrl: profile?.avatar_url || null,
          email: null, // We don't expose email for privacy
          courses: courseProgressList,
          overallProgress: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0,
          totalQuizScore: avgQuizScore,
          quizCount: allQuizScores.length,
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
