import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CommentList } from '@/components/discussion/CommentList';
import { useCourse, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useDiscussion, useDiscussionComments, useDeleteDiscussion } from '@/hooks/useDiscussions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Lock, Loader2, Pin, Trash2, Clock } from 'lucide-react';

export default function DiscussionDetail() {
  const { courseId, discussionId } = useParams<{ courseId: string; discussionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: hasPurchased, isLoading: purchaseLoading } = useHasPurchasedCourse(user?.id, courseId);
  const { data: discussion, isLoading: discussionLoading } = useDiscussion(discussionId);
  const { data: comments, isLoading: commentsLoading } = useDiscussionComments(discussionId);
  const deleteDiscussion = useDeleteDiscussion();

  const isLoading = authLoading || courseLoading || purchaseLoading || discussionLoading;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this discussion?')) return;

    try {
      await deleteDiscussion.mutateAsync({ discussionId: discussionId!, courseId: courseId! });
      toast({ title: 'Discussion deleted' });
      navigate(`/courses/${courseId}/discussions`);
    } catch (error: any) {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Auth check
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to view this discussion.</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  // Purchase check
  if (!hasPurchased) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Course Not Purchased</h1>
            <p className="text-muted-foreground mb-4">Purchase this course to view discussions.</p>
            <Button asChild>
              <Link to={`/courses/${courseId}`}>View Course</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Discussion not found
  if (!discussion) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Discussion Not Found</h1>
            <Button asChild>
              <Link to={`/courses/${courseId}/discussions`}>Back to Discussions</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isAuthor = discussion.user_id === user?.id;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          {/* Back navigation */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to={`/courses/${courseId}/discussions`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Discussions
            </Link>
          </Button>

          {/* Discussion */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={discussion.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {discussion.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h1 className="text-xl font-bold">{discussion.title}</h1>
                    {discussion.is_pinned && (
                      <Badge variant="secondary">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {discussion.profiles?.display_name || 'Anonymous'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {isAuthor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleDelete}
                    disabled={deleteDiscussion.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{discussion.content}</p>
            </CardContent>
          </Card>

          {/* Comments */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Responses ({comments?.length || 0})
            </h2>

            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommentList
                comments={comments || []}
                discussionId={discussionId!}
                userId={user!.id}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
