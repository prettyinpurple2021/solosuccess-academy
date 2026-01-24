import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProjectSubmissionForm } from '@/components/project/ProjectSubmissionForm';
import { ProjectFeedback } from '@/components/project/ProjectFeedback';
import { useCourse, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseProject } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Lock } from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function CourseProject() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: hasPurchased, isLoading: purchaseLoading } = useHasPurchasedCourse(user?.id, courseId);
  const { data: project } = useCourseProject(user?.id, courseId);

  const isLoading = authLoading || courseLoading || purchaseLoading;

  // Auth check
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <div className="cyber-grid absolute inset-0" />
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-orb-glow-primary" />
          <div className="glass-card p-8 text-center border-secondary/30 relative z-10">
            <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_hsl(var(--secondary)/0.3)]">
              <Lock className="h-8 w-8 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold mb-2 neon-text">Sign In Required</h1>
            <p className="text-muted-foreground mb-6">Please sign in to access this project.</p>
            <Button asChild variant="neon">
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
        <div className="cyber-grid absolute inset-0" />
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-orb-glow-primary" />
          <div className="glass-card p-8 relative z-10 flex flex-col items-center">
            <NeonSpinner size="lg" />
            <p className="text-muted-foreground mt-4">Loading project...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Purchase check
  if (!hasPurchased) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <div className="cyber-grid absolute inset-0" />
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl animate-orb-glow-secondary" />
          <div className="glass-card p-8 text-center border-warning/30 relative z-10">
            <div className="h-16 w-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_hsl(var(--warning)/0.3)]">
              <Lock className="h-8 w-8 text-warning" />
            </div>
            <h1 className="text-2xl font-bold mb-2 neon-text">Course Not Purchased</h1>
            <p className="text-muted-foreground mb-6">Purchase this course to access the project.</p>
            <Button asChild variant="neon">
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
        <div className="cyber-grid absolute inset-0" />
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full blur-3xl animate-orb-glow-accent" />
          <div className="glass-card p-8 text-center border-destructive/30 relative z-10">
            <h1 className="text-2xl font-bold mb-4 text-destructive">Course Not Found</h1>
            <Button asChild variant="neon">
              <Link to="/courses">Back to Courses</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // No project for this course
  if (!course.project_title) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <div className="cyber-grid absolute inset-0" />
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl animate-orb-glow-primary" />
          <div className="glass-card p-8 text-center relative z-10">
            <h1 className="text-2xl font-bold mb-2 neon-text">No Project Available</h1>
            <p className="text-muted-foreground mb-6">This course doesn't have a project assignment yet.</p>
            <Button asChild variant="neon">
              <Link to={`/courses/${courseId}`}>Back to Course</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      <div className="cyber-grid absolute inset-0" />
      <Header />
      
      <main className="flex-1 py-8 relative">
        {/* Animated glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl animate-orb-glow-primary" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl animate-orb-glow-secondary" style={{ animationDelay: '1s' }} />
        
        <div className="container max-w-4xl relative z-10">
          {/* Back navigation */}
          <Button variant="ghost" asChild className="mb-6 hover:bg-primary/10 hover:text-primary transition-all">
            <Link to={`/courses/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {course.title}
            </Link>
          </Button>

          <div className="space-y-8">
            {/* Project Form */}
            <ProjectSubmissionForm course={course} userId={user!.id} />

            {/* AI Feedback */}
            {project?.ai_feedback && (
              <ProjectFeedback project={project} />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
