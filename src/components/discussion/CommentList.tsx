import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  type DiscussionComment, 
  useCreateComment, 
  useDeleteComment 
} from '@/hooks/useDiscussions';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Reply, Trash2, MessageSquare } from 'lucide-react';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().trim().min(5, 'Comment must be at least 5 characters').max(2000, 'Comment must be less than 2000 characters'),
});

interface CommentListProps {
  comments: DiscussionComment[];
  discussionId: string;
  userId: string;
}

export function CommentList({ comments, discussionId, userId }: CommentListProps) {
  const { toast } = useToast();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
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
      await createComment.mutateAsync({
        discussionId,
        userId,
        content: result.data.content,
      });

      setNewComment('');
      toast({ title: 'Comment posted!' });
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
      await createComment.mutateAsync({
        discussionId,
        userId,
        content: result.data.content,
        parentCommentId: parentId,
      });

      setReplyingTo(null);
      setReplyContent('');
      toast({ title: 'Reply posted!' });
    } catch (error: any) {
      toast({
        title: 'Failed to post reply',
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
          </div>

          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
            {comment.content}
          </p>

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
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => handleDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>

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
