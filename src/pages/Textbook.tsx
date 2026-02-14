import { useParams, Link } from 'react-router-dom';
import { TextbookViewer } from '@/components/textbook/TextbookViewer';
import { Button } from '@/components/ui/button';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { useSetContinueLater } from '@/hooks/useContinueLater';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function Textbook() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: courses, isLoading } = useCourses();
  const setContinueLater = useSetContinueLater();
  const course = courses?.find(c => c.id === courseId);

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

  return (
    <div className="flex-1 py-8">
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
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

        {/* Textbook Viewer */}
        <TextbookViewer courseId={courseId!} courseName={course.title} />
      </div>
    </div>
  );
}