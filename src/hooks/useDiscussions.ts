import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Discussion {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  comment_count?: number;
}

export interface DiscussionComment {
  id: string;
  discussion_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Fetch discussions for a course
export function useCourseDiscussions(courseId: string | undefined) {
  return useQuery({
    queryKey: ['discussions', courseId],
    queryFn: async (): Promise<Discussion[]> => {
      if (!courseId) return [];

      // Get discussions
      const { data: discussions, error } = await supabase
        .from('discussions')
        .select(`
          *,
          profiles (display_name, avatar_url)
        `)
        .eq('course_id', courseId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get comment counts
      const discussionIds = discussions?.map(d => d.id) || [];
      if (discussionIds.length === 0) return discussions as Discussion[];

      const { data: commentCounts, error: countError } = await supabase
        .from('discussion_comments')
        .select('discussion_id')
        .in('discussion_id', discussionIds);

      if (countError) throw countError;

      // Count comments per discussion
      const counts: Record<string, number> = {};
      commentCounts?.forEach(c => {
        counts[c.discussion_id] = (counts[c.discussion_id] || 0) + 1;
      });

      return discussions?.map(d => ({
        ...d,
        comment_count: counts[d.id] || 0,
      })) as Discussion[];
    },
    enabled: !!courseId,
  });
}

// Fetch single discussion with comments
export function useDiscussion(discussionId: string | undefined) {
  return useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: async () => {
      if (!discussionId) return null;

      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          profiles (display_name, avatar_url)
        `)
        .eq('id', discussionId)
        .single();

      if (error) throw error;
      return data as Discussion;
    },
    enabled: !!discussionId,
  });
}

// Fetch comments for a discussion
export function useDiscussionComments(discussionId: string | undefined) {
  return useQuery({
    queryKey: ['discussion-comments', discussionId],
    queryFn: async (): Promise<DiscussionComment[]> => {
      if (!discussionId) return [];

      const { data, error } = await supabase
        .from('discussion_comments')
        .select(`
          *,
          profiles (display_name, avatar_url)
        `)
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as DiscussionComment[];
    },
    enabled: !!discussionId,
  });
}

// Create a new discussion
export function useCreateDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      userId,
      title,
      content,
    }: {
      courseId: string;
      userId: string;
      title: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('discussions')
        .insert({
          course_id: courseId,
          user_id: userId,
          title,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussions', variables.courseId] });
    },
  });
}

// Create a comment
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      discussionId,
      userId,
      content,
      parentCommentId,
    }: {
      discussionId: string;
      userId: string;
      content: string;
      parentCommentId?: string;
    }) => {
      const { data, error } = await supabase
        .from('discussion_comments')
        .insert({
          discussion_id: discussionId,
          user_id: userId,
          content,
          parent_comment_id: parentCommentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussion-comments', variables.discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

// Delete a discussion
export function useDeleteDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ discussionId, courseId }: { discussionId: string; courseId: string }) => {
      const { error } = await supabase
        .from('discussions')
        .delete()
        .eq('id', discussionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussions', variables.courseId] });
    },
  });
}

// Delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, discussionId }: { commentId: string; discussionId: string }) => {
      const { error } = await supabase
        .from('discussion_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussion-comments', variables.discussionId] });
    },
  });
}
