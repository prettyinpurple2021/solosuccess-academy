/**
 * @file CommentList.tsx — Threaded Comment System for Discussions
 *
 * PURPOSE: Renders a list of comments with support for nested replies,
 * comment creation, editing, deletion (own comments only), and gamification
 * (awards XP for posting comments via GamificationProvider).
 *
 * THREADING: Comments with parent_comment_id are grouped under their parent.
 * Top-level comments render inline reply forms when "Reply" is clicked.
 *
 * NOTIFICATIONS: When a comment is posted on someone else's discussion,
 * the notify-discussion-reply edge function is invoked (non-blocking).
 *
 * VALIDATION: Uses Zod schema — min 5 chars, max 2000 chars.
 */
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/components/gamification/GamificationProvider';
import { 
  type DiscussionComment, 
  useCreateComment, 
  useDeleteComment,
  useEditComment,
} from '@/hooks/useDiscussions';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Reply, Trash2, MessageSquare, Edit2, Check, X } from 'lucide-react';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().trim().min(5, 'Comment must be at least 5 characters').max(2000, 'Comment must be less than 2000 characters'),
});

interface CommentListProps {
  comments: DiscussionComment[];
  discussionId: string;
  userId: string;
  discussionAuthorId?: string;
}

export function CommentList({ comments, discussionId, userId, discussionAuthorId }: CommentListProps) {
  const { toast } = useToast();
  const { awardXP, checkAndAwardBadges } = useGamification();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const editComment = useEditComment();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = commentSchema.safeParse({ content: newComment });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    try {
      const newCommentData = await createComment.mutateAsync({
        discussionId,
        userId,
        content: result.data.content,
      });

      setNewComment('');
      toast({ title: 'Comment posted!' });

      if (discussionAuthorId && discussionAuthorId !== userId) {
        try {
          await supabase.functions.invoke('notify-discussion-reply', {
            body: { discussionId, commentId: newCommentData.id },
          });
        } catch {
          // Non-blocking: notification failure should not affect UX
        }
      }

      await awardXP('COMMENT_POST');
      setTimeout(() => checkAndAwardBadges(), 1000);
    } catch (error: any) {
      toast({
        title: 'Failed to post comment',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    const result = commentSchema.safeParse({ content: replyContent });
    if (!result.success) {
      toast({
        title: 'Invalid reply',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    try {
      const newReplyData = await createComment.mutateAsync({
        discussionId,
        userId,
        content: result.data.content,
        parentCommentId: parentId,
      });

      setReplyingTo(null);
      setReplyContent('');
      toast({ title: 'Reply posted!' });

      if (discussionAuthorId && discussionAuthorId !== userId) {
        try {
          await supabase.functions.invoke('notify-discussion-reply', {
            body: { discussionId, commentId: newReplyData.id },
          });
        } catch {
          // Non-blocking
        }
      }

      await awardXP('COMMENT_POST');
      setTimeout(() => checkAndAwardBadges(), 1000);
    } catch (error: any) {
      toast({
        title: 'Failed to post reply',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  /** Start editing a comment — pre-fills the edit textarea */
  const handleStartEdit = (comment: DiscussionComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  /** Save the edited comment */
  const handleSaveEdit = async (commentId: string) => {
    const result = commentSchema.safeParse({ content: editContent });
    if (!result.success) {
      toast({
        title: 'Invalid edit',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    try {
      await editComment.mutateAsync({
        commentId,
        discussionId,
        content: result.data.content,
      });
      setEditingId(null);
      setEditContent('');
      toast({ title: 'Comment updated!' });
    } catch (error: any) {
      toast({
        title: 'Failed to update comment',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ commentId, discussionId });
      toast({ title: 'Comment deleted' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Group comments by parent
  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const repliesByParent: Record<string, DiscussionComment[]> = {};
  comments.filter(c => c.parent_comment_id).forEach(c => {
    if (!repliesByParent[c.parent_comment_id!]) {
      repliesByParent[c.parent_comment_id!] = [];
    }
    repliesByParent[c.parent_comment_id!].push(c);
  });

  /** Check if a comment was edited (updated_at differs from created_at by >1s) */
  const wasEdited = (comment: DiscussionComment) => {
    const created = new Date(comment.created_at).getTime();
    const updated = new Date(comment.updated_at).getTime();
    return (updated - created) > 1000;
  };

  const renderComment = (comment: DiscussionComment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : ''}`}>
      <div className="flex gap-3">
        <Avatar className={isReply ? 'h-8 w-8' : 'h-10 w-10'}>
          <AvatarImage src={comment.profiles?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {comment.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {comment.profiles?.display_name || 'Anonymous'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {wasEdited(comment) && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>

          {/* Edit mode or display mode */}
          {editingId === comment.id ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                maxLength={2000}
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveEdit(comment.id)}
                  disabled={editComment.isPending}
                  className="h-7"
                >
                  {editComment.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditingId(null); setEditContent(''); }}
                  className="h-7"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          {/* Action buttons (only show when not editing) */}
          {editingId !== comment.id && (
            <div className="flex items-center gap-2 mt-2">
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                    setReplyContent('');
                  }}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {comment.user_id === userId && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleStartEdit(comment)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                maxLength={2000}
                className="text-sm"
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={createComment.isPending}
                >
                  {createComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Reply'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {repliesByParent[comment.id]?.map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* New comment form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          maxLength={2000}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">{newComment.length}/2000</p>
          <Button type="submit" disabled={createComment.isPending || !newComment.trim()}>
            {createComment.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-2" />
            )}
            Post Comment
          </Button>
        </div>
      </form>

      {/* Comments */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Be the first to respond!</p>
        </div>
      ) : (
        <div className="space-y-6 pt-4 border-t">
          {topLevelComments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
