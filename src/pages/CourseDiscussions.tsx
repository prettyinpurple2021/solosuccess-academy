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
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <div className="text-center glass-card p-8 rounded-lg relative z-10">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4 drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]" />
            <h1 className="text-2xl font-display font-bold mb-2 neon-text">Sign In Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access discussions.</p>
            <Button variant="neon" asChild>
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
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <Loader2 className="h-10 w-10 animate-spin text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]" />
        </main>
        <Footer />
      </div>
    );
  }

  // Purchase check
  if (!hasPurchased) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <div className="text-center glass-card p-8 rounded-lg relative z-10">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4 drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]" />
            <h1 className="text-2xl font-display font-bold mb-2 neon-text">Course Not Purchased</h1>
            <p className="text-muted-foreground mb-4">Purchase this course to join the discussion.</p>
            <Button variant="neon" asChild>
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
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <div className="text-center glass-card p-8 rounded-lg relative z-10">
            <h1 className="text-2xl font-display font-bold mb-4 neon-text">Course Not Found</h1>
            <Button variant="neon" asChild>
              <Link to="/courses">Back to Courses</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      <Header />
      
      <main className="flex-1 py-8 relative">
        <div className="cyber-grid" />
        
        {/* Animated glow orbs */}
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        
        <div className="container max-w-4xl relative z-10">
          {/* Back navigation */}
          <Button variant="ghost" asChild className="mb-6 hover:bg-primary/10 hover:text-primary transition-all">
            <Link to={`/courses/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {course.title}
            </Link>
          </Button>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-6 w-6 text-secondary drop-shadow-[0_0_10px_hsl(var(--secondary)/0.5)]" />
                <h1 className="text-2xl font-display font-bold neon-text">Discussion Board</h1>
              </div>
              <p className="text-muted-foreground">
                {course.discussion_question || 'Share your questions, insights, and connect with fellow founders.'}
              </p>
            </div>

            {!showCreateForm && (
              <Button variant="neon" onClick={() => setShowCreateForm(true)}>
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
              <Loader2 className="h-10 w-10 animate-spin text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]" />
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
