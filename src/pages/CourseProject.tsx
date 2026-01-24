import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProjectSubmissionForm } from '@/components/project/ProjectSubmissionForm';
import { ProjectFeedback } from '@/components/project/ProjectFeedback';
import { useCourse, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseProject } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Lock, Loader2 } from 'lucide-react';

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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access this project.</p>
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
            <p className="text-muted-foreground mb-4">Purchase this course to access the project.</p>
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

  // No project for this course
  if (!course.project_title) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">No Project Available</h1>
            <p className="text-muted-foreground mb-4">This course doesn't have a project assignment yet.</p>
            <Button asChild>
              <Link to={`/courses/${courseId}`}>Back to Course</Link>
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
