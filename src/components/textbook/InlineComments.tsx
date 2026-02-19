/**
 * @file InlineComments.tsx — Paragraph-Level Discussion Threads
 *
 * PURPOSE: Lets students start discussions on specific paragraphs in the
 * textbook. Shows a small comment icon on hover that reveals a thread panel.
 * Similar to Google Docs comments but for collaborative learning.
 *
 * DATA FLOW:
 *   textbook_comments table → grouped by paragraph_index → threaded view
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface InlineCommentsProps {
  /** The textbook page ID */
  pageId: string;
  /** Which paragraph (0-indexed) */
  paragraphIndex: number;
}

interface TextbookComment {
  id: string;
  user_id: string;
  page_id: string;
  paragraph_index: number;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches comments for a specific page+paragraph from the DB.
 */
function usePageComments(pageId: string, paragraphIndex: number) {
  return useQuery({
    queryKey: ['textbook-comments', pageId, paragraphIndex],
    queryFn: async (): Promise<TextbookComment[]> => {
      const { data, error } = await supabase
        .from('textbook_comments')
        .select('*')
        .eq('page_id', pageId)
        .eq('paragraph_index', paragraphIndex)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as TextbookComment[];
    },
    enabled: !!pageId,
  });
}

/**
 * Returns the count of comments for each paragraph on a page.
 */
export function usePageCommentCounts(pageId: string) {
  return useQuery({
    queryKey: ['textbook-comment-counts', pageId],
    queryFn: async (): Promise<Record<number, number>> => {
      const { data, error } = await supabase
        .from('textbook_comments')
        .select('paragraph_index')
        .eq('page_id', pageId);
      if (error) throw error;

      const counts: Record<number, number> = {};
      (data || []).forEach((c: any) => {
        counts[c.paragraph_index] = (counts[c.paragraph_index] || 0) + 1;
      });
      return counts;
    },
    enabled: !!pageId,
  });
}

export function InlineCommentButton({ pageId, paragraphIndex, commentCount }: {
  pageId: string;
  paragraphIndex: number;
  commentCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Comment indicator button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full text-xs transition-all",
          "hover:bg-primary/20 hover:border-primary/40",
          commentCount > 0
            ? "bg-primary/10 border border-primary/30 text-primary"
            : "opacity-0 group-hover:opacity-60 border border-transparent text-muted-foreground"
        )}
        title={commentCount > 0 ? `${commentCount} comment${commentCount > 1 ? 's' : ''}` : 'Add comment'}
      >
        <MessageCircle className="h-3 w-3" />
        {commentCount > 0 && <span>{commentCount}</span>}
      </button>

      {/* Thread panel */}
      <AnimatePresence>
        {isOpen && (
          <CommentThread
            pageId={pageId}
            paragraphIndex={paragraphIndex}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function CommentThread({ pageId, paragraphIndex, onClose }: {
  pageId: string;
  paragraphIndex: number;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: comments = [], isLoading } = usePageComments(pageId, paragraphIndex);
  const [newComment, setNewComment] = useState('');

  // Create comment mutation
  const createComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('textbook_comments')
        .insert({
          user_id: user.id,
          page_id: pageId,
          paragraph_index: paragraphIndex,
          content,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['textbook-comments', pageId, paragraphIndex] });
      queryClient.invalidateQueries({ queryKey: ['textbook-comment-counts', pageId] });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to post comment', description: err.message, variant: 'destructive' });
    },
  });

  // Delete comment mutation
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('textbook_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textbook-comments', pageId, paragraphIndex] });
      queryClient.invalidateQueries({ queryKey: ['textbook-comment-counts', pageId] });
    },
  });

  const handleSubmit = () => {
    const trimmed = newComment.trim();
    if (!trimmed || trimmed.length < 2) return;
    createComment.mutate(trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="fixed right-4 top-1/4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-black/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.3)] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-display font-semibold text-cyan-300">Discussion</span>
          <span className="text-xs text-muted-foreground">¶{paragraphIndex + 1}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 hover:bg-destructive/20">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments list */}
      <ScrollArea className="max-h-60">
        <div className="p-3 space-y-3">
          {comments.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No comments yet. Be the first to discuss!
            </p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white/5 rounded-lg p-2.5 border border-primary/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                {user?.id === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteComment.mutate(comment.id)}
                    className="h-5 w-5 hover:bg-destructive/20"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-foreground/80">{comment.content}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* New comment input */}
      {user && (
        <div className="p-3 border-t border-primary/20">
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[60px] text-sm bg-black/30 border-primary/20 focus:border-primary resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <Button
            size="sm"
            variant="neon"
            onClick={handleSubmit}
            disabled={!newComment.trim() || createComment.isPending}
            className="mt-2 w-full gap-1"
          >
            <Send className="h-3 w-3" />
            Post
          </Button>
        </div>
      )}
    </motion.div>
  );
}
