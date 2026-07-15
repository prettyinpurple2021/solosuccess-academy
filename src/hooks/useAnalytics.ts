import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  startOfMonth,
  subMonths,
  format,
  eachDayOfInterval,
  subDays,
  differenceInCalendarDays,
} from 'date-fns';

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

// A single monthly cohort of paying students (grouped by first-purchase month).
export interface CohortRow {
  cohortKey: string; // e.g. "2026-05"
  cohortLabel: string; // e.g. "May 2026"
  size: number;
  avgRevenue: number;
  avgLessonsCompleted: number;
  avgXp: number;
  // Retention as % of cohort active in week N after joining (weeks 0-7)
  retention: number[];
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

// Cohort analytics: group paying students by first-purchase month and
// measure weekly retention + engagement for the last 6 cohorts.
export function useCohortAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'cohorts'],
    queryFn: async (): Promise<CohortRow[]> => {
      const WEEKS = 8;
      const MONTHS = 6;
      const earliestCohortStart = startOfMonth(subMonths(new Date(), MONTHS - 1));

      // 1. Every purchase (need earliest per user to form cohort + total revenue per user).
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('user_id, purchased_at, amount_cents');
      if (purchasesError) throw purchasesError;

      // Build per-user aggregates
      const perUser = new Map<
        string,
        { firstPurchase: Date; revenueCents: number }
      >();
      purchases?.forEach((p) => {
        const when = new Date(p.purchased_at);
        const existing = perUser.get(p.user_id);
        if (!existing) {
          perUser.set(p.user_id, {
            firstPurchase: when,
            revenueCents: p.amount_cents,
          });
        } else {
          existing.revenueCents += p.amount_cents;
          if (when < existing.firstPurchase) existing.firstPurchase = when;
        }
      });

      // Bucket users into recent monthly cohorts
      const cohorts = new Map<
        string,
        { label: string; userIds: Set<string>; revenueCents: number }
      >();
      for (let i = MONTHS - 1; i >= 0; i--) {
        const monthDate = startOfMonth(subMonths(new Date(), i));
        const key = format(monthDate, 'yyyy-MM');
        cohorts.set(key, {
          label: format(monthDate, 'MMM yyyy'),
          userIds: new Set(),
          revenueCents: 0,
        });
      }
      perUser.forEach(({ firstPurchase, revenueCents }, userId) => {
        if (firstPurchase < earliestCohortStart) return;
        const key = format(startOfMonth(firstPurchase), 'yyyy-MM');
        const bucket = cohorts.get(key);
        if (!bucket) return;
        bucket.userIds.add(userId);
        bucket.revenueCents += revenueCents;
      });

      const cohortUserIds = Array.from(cohorts.values()).flatMap((c) =>
        Array.from(c.userIds),
      );
      if (cohortUserIds.length === 0) {
        return Array.from(cohorts.entries()).map(([cohortKey, c]) => ({
          cohortKey,
          cohortLabel: c.label,
          size: 0,
          avgRevenue: 0,
          avgLessonsCompleted: 0,
          avgXp: 0,
          retention: new Array(WEEKS).fill(0),
        }));
      }

      // 2. Activity days per user (drives the retention heatmap)
      const { data: activityDays, error: activityErr } = await supabase
        .from('user_activity_days')
        .select('user_id, activity_date')
        .in('user_id', cohortUserIds)
        .gte('activity_date', format(earliestCohortStart, 'yyyy-MM-dd'));
      if (activityErr) throw activityErr;

      // 3. Lessons completed per user
      const { data: completions, error: completionsErr } = await supabase
        .from('user_progress')
        .select('user_id')
        .eq('completed', true)
        .in('user_id', cohortUserIds);
      if (completionsErr) throw completionsErr;

      const lessonsByUser = new Map<string, number>();
      completions?.forEach((row) => {
        lessonsByUser.set(row.user_id, (lessonsByUser.get(row.user_id) ?? 0) + 1);
      });

      // 4. XP per user
      const { data: gamification, error: gamErr } = await supabase
        .from('user_gamification')
        .select('user_id, total_xp')
        .in('user_id', cohortUserIds);
      if (gamErr) throw gamErr;

      const xpByUser = new Map<string, number>();
      gamification?.forEach((row) => xpByUser.set(row.user_id, row.total_xp));

      // Retention: for each user, which weeks-since-first-purchase they were active
      const userWeeks = new Map<string, Set<number>>();
      activityDays?.forEach((row) => {
        const meta = perUser.get(row.user_id);
        if (!meta) return;
        const days = differenceInCalendarDays(
          new Date(row.activity_date),
          meta.firstPurchase,
        );
        if (days < 0) return;
        const week = Math.floor(days / 7);
        if (week >= WEEKS) return;
        if (!userWeeks.has(row.user_id)) userWeeks.set(row.user_id, new Set());
        userWeeks.get(row.user_id)!.add(week);
      });

      return Array.from(cohorts.entries()).map(([cohortKey, c]) => {
        const ids = Array.from(c.userIds);
        const size = ids.length;
        const retention = new Array(WEEKS).fill(0);
        if (size > 0) {
          for (let w = 0; w < WEEKS; w++) {
            const active = ids.filter((uid) => userWeeks.get(uid)?.has(w)).length;
            retention[w] = Math.round((active / size) * 100);
          }
        }
        const totalLessons = ids.reduce(
          (sum, uid) => sum + (lessonsByUser.get(uid) ?? 0),
          0,
        );
        const totalXp = ids.reduce(
          (sum, uid) => sum + (xpByUser.get(uid) ?? 0),
          0,
        );
        return {
          cohortKey,
          cohortLabel: c.label,
          size,
          avgRevenue: size > 0 ? Math.round(c.revenueCents / size) / 100 : 0,
          avgLessonsCompleted:
            size > 0 ? Math.round((totalLessons / size) * 10) / 10 : 0,
          avgXp: size > 0 ? Math.round(totalXp / size) : 0,
          retention,
        };
      });
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
