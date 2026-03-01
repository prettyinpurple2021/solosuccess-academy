/**
 * @file useDiscussions.ts — Discussion Forum Data Hooks
 *
 * PURPOSE: CRUD operations for course discussion threads and comments.
 * Supports threaded replies (parent_comment_id), pinned discussions,
 * comment count aggregation, comment editing, and real-time updates.
 *
 * PRIVACY NOTE: Uses profiles_public view (not profiles table) to fetch
 * display names and avatars, ensuring email/notification preferences are
 * never exposed to other students.
 *
 * DATA MODEL:
 *   courses → discussions (1:N) → discussion_comments (1:N, self-referencing for threads)
 *
 * SECURITY: RLS policies ensure users can only delete their own comments/discussions.
 * Admin can pin/delete any discussion.
 *
 * REAL-TIME: Subscriptions to discussions and discussion_comments tables
 * provide live updates when other students post or edit.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

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

// Fetch discussions for a course with pagination
export function useCourseDiscussions(courseId: string | undefined, page = 0, pageSize = 20) {
  return useQuery({
    queryKey: ['discussions', courseId, page, pageSize],
    queryFn: async (): Promise<{ discussions: Discussion[]; totalCount: number }> => {
      if (!courseId) return { discussions: [], totalCount: 0 };

      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Get discussions with count
      const { data: discussions, error, count } = await supabase
        .from('discussions')
        .select('*', { count: 'exact' })
        .eq('course_id', courseId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (!discussions || discussions.length === 0) return { discussions: [], totalCount: count || 0 };

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(discussions.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles_public' as any)
        .select('id, display_name, avatar_url')
        .in('id', userIds) as { data: { id: string; display_name: string | null; avatar_url: string | null }[] | null };

      const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      profiles?.forEach(p => {
        profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });

      // Get comment counts
      const discussionIds = discussions.map(d => d.id);
      const { data: commentCounts, error: countError } = await supabase
        .from('discussion_comments')
        .select('discussion_id')
        .in('discussion_id', discussionIds);

      if (countError) throw countError;

      const counts: Record<string, number> = {};
      commentCounts?.forEach(c => {
        counts[c.discussion_id] = (counts[c.discussion_id] || 0) + 1;
      });

      return {
        discussions: discussions.map(d => ({
          ...d,
          profiles: profileMap[d.user_id] || { display_name: null, avatar_url: null },
          comment_count: counts[d.id] || 0,
        })),
        totalCount: count || 0,
      };
    },
    enabled: !!courseId,
  });
}

// Fetch single discussion with comments
export function useDiscussion(discussionId: string | undefined) {
  return useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: async (): Promise<Discussion | null> => {
      if (!discussionId) return null;

      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .eq('id', discussionId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const { data: profile } = await supabase
        .from('profiles_public' as any)
        .select('display_name, avatar_url')
        .eq('id', data.user_id)
        .single() as { data: { display_name: string | null; avatar_url: string | null } | null };

      return {
        ...data,
        profiles: profile || { display_name: null, avatar_url: null },
      };
    },
    enabled: !!discussionId,
  });
}

// Fetch comments for a discussion with pagination
export function useDiscussionComments(discussionId: string | undefined, page = 0, pageSize = 50) {
  return useQuery({
    queryKey: ['discussion-comments', discussionId, page, pageSize],
    queryFn: async (): Promise<DiscussionComment[]> => {
      if (!discussionId) return [];

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('discussion_comments')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true })
        .range(from, to);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles_public' as any)
        .select('id, display_name, avatar_url')
        .in('id', userIds) as { data: { id: string; display_name: string | null; avatar_url: string | null }[] | null };

      const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      profiles?.forEach(p => {
        profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });

      return data.map(c => ({
        ...c,
        profiles: profileMap[c.user_id] || { display_name: null, avatar_url: null },
      }));
    },
    enabled: !!discussionId,
  });
}

/**
 * Real-time subscription for discussion updates.
 * Listens for new/edited/deleted discussions and comments.
 */
export function useDiscussionRealtime(discussionId: string | undefined, courseId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!discussionId && !courseId) return;

    const channel = supabase
      .channel(`discussion-realtime-${discussionId || courseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussion_comments',
          ...(discussionId ? { filter: `discussion_id=eq.${discussionId}` } : {}),
        },
        () => {
          if (discussionId) {
            queryClient.invalidateQueries({ queryKey: ['discussion-comments', discussionId] });
          }
          if (courseId) {
            queryClient.invalidateQueries({ queryKey: ['discussions', courseId] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussions',
          ...(courseId ? { filter: `course_id=eq.${courseId}` } : {}),
        },
        () => {
          if (courseId) {
            queryClient.invalidateQueries({ queryKey: ['discussions', courseId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [discussionId, courseId, queryClient]);
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

/**
 * Edit an existing comment.
 * Only the comment author can edit (enforced by RLS).
 */
export function useEditComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      discussionId,
      content,
    }: {
      commentId: string;
      discussionId: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('discussion_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussion-comments', variables.discussionId] });
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
