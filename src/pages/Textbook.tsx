import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TextbookViewer } from '@/components/textbook/TextbookViewer';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/useCourses';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function Textbook() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: courses, isLoading } = useCourses();

  const course = courses?.find(c => c.id === courseId);

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

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Button asChild>
            <Link to="/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/50 to-background dark:from-stone-900/50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Back Link */}
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link to={`/courses/${courseId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Link>
            </Button>
          </div>

          {/* Textbook Viewer */}
          <TextbookViewer courseId={courseId!} courseName={course.title} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
