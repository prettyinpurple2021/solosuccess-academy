import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProjectSubmissionForm } from '@/components/project/ProjectSubmissionForm';
import { ProjectFeedback } from '@/components/project/ProjectFeedback';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { useCourse, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseProject } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Lock } from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function CourseProject() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isLoading: authLoading } = useAuth();

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: hasPurchased, isLoading: purchaseLoading } = useHasPurchasedCourse(user?.id, courseId);
  const { data: project } = useCourseProject(user?.id, courseId);

  const isLoading = authLoading || courseLoading || purchaseLoading;

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  // Purchase check
  if (!hasPurchased) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="glass-card p-8 text-center border-warning/30 max-w-md">
          <div className="h-16 w-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_hsl(var(--warning)/0.3)]">
            <Lock className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold mb-2 neon-text">Course Not Purchased</h1>
          <p className="text-muted-foreground mb-6">Purchase this course to access the project.</p>
          <Button asChild variant="neon">
            <Link to={`/courses/${courseId}`}>View Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Course not found
  if (!course) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="glass-card p-8 text-center border-destructive/30 max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Course Not Found</h1>
          <Button asChild variant="neon">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  // No project for this course
  if (!course.project_title) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="glass-card p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2 neon-text">No Project Available</h1>
          <p className="text-muted-foreground mb-6">This course doesn't have a project assignment yet.</p>
          <Button asChild variant="neon">
            <Link to={`/courses/${courseId}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <CourseBreadcrumb
          segments={[
            { label: course.title, href: `/courses/${courseId}` },
            { label: 'Project' },
          ]}
          className="mb-6"
        />

        <div className="space-y-8">
          {/* Project Form */}
          <ProjectSubmissionForm course={course} userId={user!.id} />

          {/* AI Feedback */}
          {project?.ai_feedback && (
            <ProjectFeedback project={project} />
          )}
        </div>
      </div>
    </div>
  );
}