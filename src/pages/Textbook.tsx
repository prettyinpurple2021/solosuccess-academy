import { useParams, Link } from 'react-router-dom';
import { TextbookViewer } from '@/components/textbook/TextbookViewer';
import { Button } from '@/components/ui/button';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { useCourses } from '@/hooks/useCourses';
import { ArrowLeft } from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function Textbook() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: courses, isLoading } = useCourses();

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
        {/* Breadcrumb */}
        <CourseBreadcrumb
          segments={[
            { label: course.title, href: `/courses/${courseId}` },
            { label: 'Textbook' },
          ]}
          className="mb-6"
        />

        {/* Textbook Viewer */}
        <TextbookViewer courseId={courseId!} courseName={course.title} />
      </div>
    </div>
  );
}