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

// Upload avatar
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

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

// Fetch user achievements
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
        };
      }

      // Fetch all stats in parallel
      const [
        purchasesResult,
        progressResult,
        projectsResult,
        discussionsResult,
        commentsResult,
      ] = await Promise.all([
        supabase.from('purchases').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('user_progress').select('id', { count: 'exact' }).eq('user_id', userId).eq('completed', true),
        supabase.from('course_projects').select('id, status, ai_feedback').eq('user_id', userId),
        supabase.from('discussions').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('discussion_comments').select('id', { count: 'exact' }).eq('user_id', userId),
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
      };
    },
    enabled: !!userId,
  });
}
