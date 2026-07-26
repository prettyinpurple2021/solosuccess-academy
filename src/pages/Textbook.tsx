import { useParams, Link } from 'react-router-dom';
import { TextbookViewer } from '@/components/textbook/TextbookViewer';
import { Button } from '@/components/ui/button';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { useCourse, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { useSetContinueLater } from '@/hooks/useContinueLater';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bookmark, Lock } from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function Textbook() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: hasPurchased, isLoading: purchaseLoading } = useHasPurchasedCourse(user?.id, courseId);
  const setContinueLater = useSetContinueLater();

  const isLoading = courseLoading || purchaseLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="glass-card p-8 text-center max-w-md">
          <h1 className="text-2xl font-display font-bold mb-4 neon-text">Course not found</h1>
          <Button asChild variant="neon">
            <Link to="/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!hasPurchased) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="glass-card p-8 text-center max-w-md mx-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2 neon-text">Course Not Purchased</h1>
          <p className="text-muted-foreground mb-6">You need to purchase this course to access the textbook.</p>
          <Button asChild variant="neon">
            <Link to={`/courses/${courseId}`}>View Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-4 px-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <CourseBreadcrumb
          segments={[
            { label: course.title, href: `/courses/${courseId}` },
            { label: 'Textbook' },
          ]}
          className="flex-1 min-w-0"
        />
        {user?.id && courseId && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await setContinueLater.mutateAsync({
                  userId: user.id,
                  courseId,
                  lessonId: null,
                  textbookPage: null,
                });
                toast({ title: 'Saved!', description: 'Textbook is set as your continue point. Find it on your Dashboard.' });
              } catch {
                toast({ title: 'Could not save', variant: 'destructive' });
              }
            }}
            disabled={setContinueLater.isPending}
            className="gap-2 border-primary/30 hover:bg-primary/10"
          >
            <Bookmark className="h-4 w-4" />
            Continue later
          </Button>
        )}
      </div>

      {/* Textbook Viewer — full width, no container constraint */}
      <TextbookViewer courseId={courseId!} courseName={course.title} />
    </div>
  );
}
