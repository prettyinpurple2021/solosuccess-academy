import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TextbookViewer } from '@/components/textbook/TextbookViewer';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/useCourses';
import { ArrowLeft } from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function Textbook() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: courses, isLoading } = useCourses();

  const course = courses?.find(c => c.id === courseId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <NeonSpinner size="xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <div className="glass-card p-8 text-center max-w-md">
            <h1 className="text-2xl font-display font-bold mb-4 neon-text">Course not found</h1>
            <Button asChild variant="neon">
              <Link to="/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Link>
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

      <main className="flex-1 py-8">
        <div className="container">
          {/* Back Link */}
          <div className="mb-6">
            <Button variant="ghost" asChild className="hover:bg-primary/20 hover:text-primary">
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