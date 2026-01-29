import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, format, eachDayOfInterval, subDays } from 'date-fns';

export interface RevenueData {
  date: string;
  amount: number;
  count: number;
}

export interface CourseCompletionData {
  courseTitle: string;
  completions: number;
  totalLessons: number;
}

export interface EngagementData {
  date: string;
  activeUsers: number;
  lessonsCompleted: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalStudents: number;
  totalCompletions: number;
  averageEngagement: number;
  revenueGrowth: number;
  studentGrowth: number;
}

// Fetch revenue data by month
export function useRevenueAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: async (): Promise<RevenueData[]> => {
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      
      const { data, error } = await supabase
        .from('purchases')
        .select('amount_cents, purchased_at')
        .gte('purchased_at', sixMonthsAgo.toISOString())
        .order('purchased_at');

      if (error) throw error;

      // Group by month
      const monthlyData: Record<string, { amount: number; count: number }> = {};
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'MMM yyyy');
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }

      data?.forEach((purchase) => {
        const monthKey = format(new Date(purchase.purchased_at), 'MMM yyyy');
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].amount += purchase.amount_cents / 100;
          monthlyData[monthKey].count += 1;
        }
      });

      return Object.entries(monthlyData).map(([date, { amount, count }]) => ({
        date,
        amount,
        count,
      }));
    },
  });
}

// Fetch course completion data
export function useCourseCompletionAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'completions'],
    queryFn: async (): Promise<CourseCompletionData[]> => {
      // Get all courses with their lessons count
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title');

      if (coursesError) throw coursesError;

      // Get lesson counts per course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('course_id');

      if (lessonsError) throw lessonsError;

      // Get completed lessons grouped by course
      const { data: completedProgress, error: progressError } = await supabase
        .from('user_progress')
        .select('lesson_id, lessons!inner(course_id)')
        .eq('completed', true);

      if (progressError) throw progressError;

      // Calculate metrics per course
      const courseMetrics: CourseCompletionData[] = (courses || []).map((course) => {
        const courseLessons = lessons?.filter((l) => l.course_id === course.id).length || 0;
        const courseCompletions = completedProgress?.filter(
          (p) => (p.lessons as any)?.course_id === course.id
        ).length || 0;

        return {
          courseTitle: course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title,
          completions: courseCompletions,
          totalLessons: courseLessons,
        };
      });

      return courseMetrics.filter((c) => c.totalLessons > 0);
    },
  });
}

// Fetch daily engagement data
export function useEngagementAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'engagement'],
    queryFn: async (): Promise<EngagementData[]> => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      // Get user progress activity
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('user_id, completed_at, updated_at')
        .gte('updated_at', thirtyDaysAgo.toISOString());

      if (progressError) throw progressError;

      // Create daily buckets
      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });
      const dailyData: Record<string, { users: Set<string>; completions: number }> = {};

      days.forEach((day) => {
        const dayKey = format(day, 'MMM dd');
        dailyData[dayKey] = { users: new Set(), completions: 0 };
      });

      progressData?.forEach((progress) => {
        const dayKey = format(new Date(progress.updated_at), 'MMM dd');
        if (dailyData[dayKey]) {
          dailyData[dayKey].users.add(progress.user_id);
          if (progress.completed_at) {
            dailyData[dayKey].completions += 1;
          }
        }
      });

      return Object.entries(dailyData).map(([date, { users, completions }]) => ({
        date,
        activeUsers: users.size,
        lessonsCompleted: completions,
      }));
    },
  });
}

// Fetch analytics summary
export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async (): Promise<AnalyticsSummary> => {
      const thisMonth = startOfMonth(new Date());
      const lastMonth = startOfMonth(subMonths(new Date(), 1));

      // Total revenue
      const { data: allPurchases } = await supabase
        .from('purchases')
        .select('amount_cents, purchased_at');

      const totalRevenue = allPurchases?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;
      
      const thisMonthRevenue = allPurchases
        ?.filter((p) => new Date(p.purchased_at) >= thisMonth)
        .reduce((sum, p) => sum + p.amount_cents, 0) || 0;
      
      const lastMonthRevenue = allPurchases
        ?.filter((p) => {
          const date = new Date(p.purchased_at);
          return date >= lastMonth && date < thisMonth;
        })
        .reduce((sum, p) => sum + p.amount_cents, 0) || 0;

      const revenueGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Unique students (from purchases)
      const uniqueStudents = new Set(allPurchases?.map((p) => p.purchased_at)).size;
      
      // Get distinct user count from gamification
      const { count: studentCount } = await supabase
        .from('user_gamification')
        .select('*', { count: 'exact', head: true });

      // Completed lessons
      const { count: completionsCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true);

      // Average XP (engagement proxy)
      const { data: gamificationData } = await supabase
        .from('user_gamification')
        .select('total_xp');

      const avgXP = gamificationData?.length 
        ? gamificationData.reduce((sum, g) => sum + g.total_xp, 0) / gamificationData.length 
        : 0;

      return {
        totalRevenue: totalRevenue / 100,
        totalStudents: studentCount || 0,
        totalCompletions: completionsCount || 0,
        averageEngagement: Math.round(avgXP),
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        studentGrowth: 0,
      };
    },
  });
}
