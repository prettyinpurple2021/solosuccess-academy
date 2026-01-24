import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DiscussionList } from '@/components/discussion/DiscussionList';
import { CreateDiscussionForm } from '@/components/discussion/CreateDiscussionForm';
import { useCourse, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseDiscussions } from '@/hooks/useDiscussions';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Lock, Loader2, Plus, MessageSquare } from 'lucide-react';

export default function CourseDiscussions() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: hasPurchased, isLoading: purchaseLoading } = useHasPurchasedCourse(user?.id, courseId);
  const { data: discussions, isLoading: discussionsLoading } = useCourseDiscussions(courseId);

  const isLoading = authLoading || courseLoading || purchaseLoading;

  // Auth check
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access discussions.</p>
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
            <p className="text-muted-foreground mb-4">Purchase this course to join the discussion.</p>
            <Button asChild>
              <Link to={`/courses/${courseId}`}>View Course</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Course not found
  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <Button asChild>
              <Link to="/courses">Back to Courses</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          {/* Back navigation */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to={`/courses/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {course.title}
            </Link>
          </Button>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-6 w-6 text-secondary" />
                <h1 className="text-2xl font-display font-bold">Discussion Board</h1>
              </div>
              <p className="text-muted-foreground">
                {course.discussion_question || 'Share your questions, insights, and connect with fellow founders.'}
              </p>
            </div>

            {!showCreateForm && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            )}
          </div>

          {/* Create form */}
          {showCreateForm && (
            <div className="mb-8">
              <CreateDiscussionForm
                courseId={courseId!}
                userId={user!.id}
                onSuccess={() => setShowCreateForm(false)}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}

          {/* Discussion list */}
          {discussionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DiscussionList discussions={discussions || []} courseId={courseId!} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
