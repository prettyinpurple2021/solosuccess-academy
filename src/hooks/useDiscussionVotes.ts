/**
 * @file useDiscussionVotes.ts — Hooks for discussion upvoting
 *
 * HOW IT WORKS:
 * - Each user can upvote a discussion once (toggle on/off)
 * - Vote counts are fetched alongside discussions
 * - Uses the discussion_votes table with RLS policies
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Fetch vote counts and user's votes for a list of discussion IDs */
export function useDiscussionVotes(discussionIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['discussion-votes', discussionIds, user?.id],
    queryFn: async () => {
      if (!discussionIds.length) return { counts: {}, userVotes: new Set<string>() };

      // Get all votes for these discussions
      const { data: votes, error } = await supabase
        .from('discussion_votes' as any)
        .select('discussion_id, user_id')
        .in('discussion_id', discussionIds);

      if (error) throw error;

      // Count votes per discussion
      const counts: Record<string, number> = {};
      const userVotes = new Set<string>();

      (votes || []).forEach((v: any) => {
        counts[v.discussion_id] = (counts[v.discussion_id] || 0) + 1;
        if (v.user_id === user?.id) {
          userVotes.add(v.discussion_id);
        }
      });

      return { counts, userVotes };
    },
    enabled: discussionIds.length > 0 && !!user,
  });
}

/** Toggle vote on a discussion (upvote/remove upvote) */
export function useToggleVote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      discussionId,
      hasVoted,
    }: {
      discussionId: string;
      hasVoted: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in to vote');

      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('discussion_votes' as any)
          .delete()
          .eq('user_id', user.id)
          .eq('discussion_id', discussionId);
        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase
          .from('discussion_votes' as any)
          .insert({ user_id: user.id, discussion_id: discussionId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all vote queries to refresh counts
      queryClient.invalidateQueries({ queryKey: ['discussion-votes'] });
    },
  });
}
