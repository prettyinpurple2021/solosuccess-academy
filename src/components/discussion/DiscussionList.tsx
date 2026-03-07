/**
 * @file DiscussionList.tsx — Discussion Thread List with Upvoting
 *
 * PURPOSE: Renders a list of discussion threads for a course with author
 * avatars, pinned status, comment counts, vote counts, and relative timestamps.
 * Each discussion links to DiscussionDetail page.
 *
 * SORTING: Pinned discussions always appear first, then by creation date (newest first).
 *
 * VOTING: Students can upvote discussions to signal valuable threads.
 * Each user can upvote once per discussion (toggle on/off).
 */
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Discussion } from '@/hooks/useDiscussions';
import { useDiscussionVotes, useToggleVote } from '@/hooks/useDiscussionVotes';
import { MessageSquare, Pin, Clock, ThumbsUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionListProps {
  discussions: Discussion[];
  courseId: string;
}

export function DiscussionList({ discussions, courseId }: DiscussionListProps) {
  // Fetch vote data for all visible discussions
  const discussionIds = discussions.map((d) => d.id);
  const { data: voteData } = useDiscussionVotes(discussionIds);
  const toggleVote = useToggleVote();

  if (discussions.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No discussions yet</h3>
        <p className="text-muted-foreground">
          Be the first to start a conversation!
        </p>
      </div>
    );
  }

  const handleVote = (e: React.MouseEvent, discussionId: string) => {
    // Prevent navigation when clicking vote button
    e.preventDefault();
    e.stopPropagation();

    const hasVoted = voteData?.userVotes.has(discussionId) || false;
    toggleVote.mutate({ discussionId, hasVoted });
  };

  return (
    <div className="space-y-3">
      {discussions.map((discussion) => {
        const voteCount = voteData?.counts[discussion.id] || 0;
        const hasVoted = voteData?.userVotes.has(discussion.id) || false;

        return (
          <Link
            key={discussion.id}
            to={`/courses/${courseId}/discussions/${discussion.id}`}
          >
            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Vote Button */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleVote(e, discussion.id)}
                      className={`h-8 w-8 p-0 rounded-full transition-all ${
                        hasVoted
                          ? 'bg-primary/20 text-primary hover:bg-primary/30 shadow-[0_0_10px_hsl(var(--primary)/0.3)]'
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                      }`}
                      disabled={toggleVote.isPending}
                      title={hasVoted ? 'Remove upvote' : 'Upvote this discussion'}
                    >
                      <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
                    </Button>
                    <span className={`text-xs font-medium ${hasVoted ? 'text-primary' : 'text-muted-foreground'}`}>
                      {voteCount}
                    </span>
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={discussion.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {discussion.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h3 className="font-medium text-foreground line-clamp-1 flex-1">
                        {discussion.title}
                      </h3>
                      {discussion.is_pinned && (
                        <Badge variant="secondary" className="flex-shrink-0">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {discussion.content}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{discussion.profiles?.display_name || 'Anonymous'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {discussion.comment_count || 0} {discussion.comment_count === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
