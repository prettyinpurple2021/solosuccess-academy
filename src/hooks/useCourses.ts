/**
 * @file useCourses.ts — Student-Facing Course Data Hooks
 * 
 * Provides React Query hooks for fetching course and lesson data
 * from the student's perspective (only published courses).
 * 
 * HOOKS IN THIS FILE:
 * - useCourses()                    → Fetch all published courses
 * - useCourse(courseId)             → Fetch a single course by ID
 * - useCourseLessons(courseId)      → Fetch all lessons for a course
 * - useUserPurchases(userId)        → Fetch user's purchased courses
 * - useHasPurchasedCourse(uid, cid) → Check if user bought a specific course
 * 
 * DATA FLOW:
 * Component → useCourses() → TanStack Query cache → Supabase SDK → PostgreSQL
 * 
 * SECURITY NOTE:
 * - Published courses are public (no auth required to view catalog)
 * - Purchase data requires auth (RLS enforces user_id match)
 * - Stripe IDs are excluded from the select query to avoid leaking them
 * 
 * PRODUCTION TODO:
 * - Add pagination for course listings if catalog grows beyond 20+ courses
 * - Add search/filter hooks for course discovery
 * - Consider prefetching course detail when hovering over course cards
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Course, Lesson } from '@/lib/courseData';

/**
 * Fetch all published courses, ordered by order_number.
 * 
 * NOTE: The select() explicitly lists columns to EXCLUDE stripe_product_id
 * and stripe_price_id from the response. This is a security measure to
 * prevent Stripe IDs from being exposed in the browser's network tab.
 */
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, phase, order_number, price_cents, project_title, project_description, discussion_question, plug_and_play_asset, is_published, created_at, updated_at')
        .eq('is_published', true)
        .order('order_number', { ascending: true });

      if (error) throw error;
      return data as Course[];
    },
  });
}

/**
 * Fetch a single course by its ID.
 * Only returns published courses (students can't access unpublished).
 * 
 * @param courseId - UUID of the course (from URL params)
 * @returns Course object or null if not found/unpublished
 */
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async (): Promise<Course | null> => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, phase, order_number, price_cents, project_title, project_description, discussion_question, plug_and_play_asset, is_published, created_at, updated_at')
        .eq('id', courseId)
        .eq('is_published', true)
        .maybeSingle();  // Returns null instead of error if no match

      if (error) throw error;
      return data as Course | null;
    },
    enabled: !!courseId,  // Don't run query if courseId is undefined
  });
}

/**
 * Fetch all lessons for a specific course, ordered by order_number.
 * Used on the course detail page to show the lesson list.
 * 
 * @param courseId - UUID of the course
 * @returns Array of Lesson objects
 */
export function useCourseLessons(courseId: string | undefined) {
  return useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async (): Promise<Lesson[]> => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number', { ascending: true });

      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!courseId,
  });
}

/**
 * Fetch all courses the user has purchased.
 * Joins with the courses table to get full course details.
 * 
 * Used on the Dashboard to show "My Courses."
 * 
 * @param userId - The authenticated user's ID
 * @returns Array of purchase records with nested course data
 */
export function useUserPurchases(userId: string | undefined) {
  return useQuery({
    queryKey: ['purchases', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('purchases')
        .select('*, courses(*)')  // Join: purchases ← courses
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

/**
 * Check if a user has purchased a specific course.
 * Returns a boolean — used to show/hide "Start Learning" vs "Buy Now" buttons.
 * 
 * @param userId - The authenticated user's ID
 * @param courseId - The course to check
 * @returns true if purchased, false otherwise
 */
export function useHasPurchasedCourse(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['purchase', userId, courseId],
    queryFn: async (): Promise<boolean> => {
      if (!userId || !courseId) return false;

      // Use the database function which includes admin bypass logic
      // (admins are treated as having purchased every course)
      const { data, error } = await supabase
        .rpc('has_purchased_course', {
          _user_id: userId,
          _course_id: courseId,
        });

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!courseId,
  });
}
