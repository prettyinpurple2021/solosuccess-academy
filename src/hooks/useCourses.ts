import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Course, Lesson } from '@/lib/courseData';

// Fetch all published courses
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('order_number', { ascending: true });

      if (error) throw error;
      return data as Course[];
    },
  });
}

// Fetch a single course by ID
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async (): Promise<Course | null> => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      return data as Course | null;
    },
    enabled: !!courseId,
  });
}

// Fetch lessons for a course
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

// Fetch user purchases
export function useUserPurchases(userId: string | undefined) {
  return useQuery({
    queryKey: ['purchases', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('purchases')
        .select('*, courses(*)')
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Check if user has purchased a specific course
export function useHasPurchasedCourse(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['purchase', userId, courseId],
    queryFn: async (): Promise<boolean> => {
      if (!userId || !courseId) return false;

      const { data, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!courseId,
  });
}
