/**
 * @file useProfile.ts — User Profile & Achievement Stats Hooks
 *
 * PURPOSE: Manages user profile data (display name, bio, avatar, notification
 * preferences) and aggregates achievement statistics from multiple tables.
 *
 * AVATAR UPLOAD FLOW:
 *   File selected → compressed (max 800px, 0.8 quality) → uploadAvatar()
 *   → uploads to 'avatars' storage bucket → returns public URL
 *   → useUpdateAvatar() → saves URL to profiles table
 *
 * ACHIEVEMENT AGGREGATION (useUserAchievements):
 *   Runs 5 parallel queries against: purchases, user_progress, course_projects,
 *   discussions, discussion_comments — returns counts for badge checking.
 *   Cached with 5-minute stale time since achievements change infrequently.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email_notifications: boolean;
  course_updates: boolean;
  discussion_replies: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievements {
  coursesPurchased: number;
  lessonsCompleted: number;
  projectsSubmitted: number;
  projectsWithFeedback: number;
  discussionsStarted: number;
  commentsPosted: number;
  chaptersRead: number;
}

// Fetch user profile
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      displayName,
      bio,
    }: {
      userId: string;
      displayName?: string;
      bio?: string;
    }) => {
      const updates: Record<string, string | null> = {};
      if (displayName !== undefined) updates.display_name = displayName || null;
      if (bio !== undefined) updates.bio = bio || null;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
    },
  });
}

/**
 * Compress an image file before upload.
 * Resizes to max 800x800 and compresses to JPEG at 0.8 quality.
 * This reduces avatar file sizes from ~2-5MB to ~50-150KB.
 */
async function compressImage(file: File, maxSize = 800, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to compress image'));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload avatar with automatic image compression.
 * Compresses to max 800x800 JPEG before uploading.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Compress the image before uploading
  const compressedBlob = await compressImage(file);
  const fileName = `${userId}/avatar-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, compressedBlob, { 
      upsert: true,
      contentType: 'image/jpeg',
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return data.publicUrl;
}

// Update avatar URL in profile
export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      avatarUrl,
    }: {
      userId: string;
      avatarUrl: string;
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
    },
  });
}

// Update notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      emailNotifications,
      courseUpdates,
      discussionReplies,
    }: {
      userId: string;
      emailNotifications?: boolean;
      courseUpdates?: boolean;
      discussionReplies?: boolean;
    }) => {
      const updates: Record<string, boolean> = {};
      if (emailNotifications !== undefined) updates.email_notifications = emailNotifications;
      if (courseUpdates !== undefined) updates.course_updates = courseUpdates;
      if (discussionReplies !== undefined) updates.discussion_replies = discussionReplies;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
    },
  });
}

/**
 * Fetch user achievements with 5-minute cache.
 * Achievement counts change infrequently, so a longer stale time
 * reduces unnecessary database queries.
 */
export function useUserAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: ['achievements', userId],
    queryFn: async (): Promise<UserAchievements> => {
      if (!userId) {
        return {
          coursesPurchased: 0,
          lessonsCompleted: 0,
          projectsSubmitted: 0,
          projectsWithFeedback: 0,
          discussionsStarted: 0,
          commentsPosted: 0,
          chaptersRead: 0,
        };
      }

      // Fetch all stats in parallel
      // Fetch all stats in parallel (including textbook chapter bookmarks as "chapters read")
      const [
        purchasesResult,
        progressResult,
        projectsResult,
        discussionsResult,
        commentsResult,
        bookmarksResult,
      ] = await Promise.all([
        supabase.from('purchases').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('user_progress').select('id', { count: 'exact' }).eq('user_id', userId).eq('completed', true),
        supabase.from('course_projects').select('id, status, ai_feedback').eq('user_id', userId),
        supabase.from('discussions').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('discussion_comments').select('id', { count: 'exact' }).eq('user_id', userId),
        // Count distinct chapters the user has bookmarked (proxy for chapters read)
        supabase.from('user_textbook_bookmarks').select('chapter_id', { count: 'exact' }).eq('user_id', userId),
      ]);

      const projectsData = projectsResult.data || [];
      const projectsSubmitted = projectsData.filter(p => p.status === 'submitted' || p.status === 'reviewed').length;
      const projectsWithFeedback = projectsData.filter(p => p.ai_feedback !== null).length;

      return {
        coursesPurchased: purchasesResult.count || 0,
        lessonsCompleted: progressResult.count || 0,
        projectsSubmitted,
        projectsWithFeedback,
        discussionsStarted: discussionsResult.count || 0,
        commentsPosted: commentsResult.count || 0,
        chaptersRead: bookmarksResult.count || 0,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes — achievements change infrequently
  });
}
