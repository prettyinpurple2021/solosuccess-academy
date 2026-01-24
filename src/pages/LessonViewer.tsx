import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCourse, useCourseLessons, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseProgress, useMarkLessonComplete } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LessonContent } from '@/components/lesson/LessonContent';
import { LessonSidebar } from '@/components/lesson/LessonSidebar';
import { AITutorChat } from '@/components/lesson/AITutorChat';
import { 
  ArrowLeft, 
  ArrowRight, 
  Bot, 
  CheckCircle2, 
  Menu,
  Lock
} from 'lucide-react';

export default function LessonViewer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showAITutor, setShowAITutor] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(courseId);
  const { data: hasPurchased, isLoading: purchaseLoading } = useHasPurchasedCourse(user?.id, courseId);
  const { data: progressData, isLoading: progressLoading } = useCourseProgress(user?.id, courseId);
  const markComplete = useMarkLessonComplete();

  const isLoading = courseLoading || lessonsLoading || purchaseLoading || progressLoading;

  // Find current lesson and navigation
  const currentLesson = lessons?.find(l => l.id === lessonId);
  const currentIndex = lessons?.findIndex(l => l.id === lessonId) ?? -1;
  const prevLesson = currentIndex > 0 ? lessons?.[currentIndex - 1] : null;
  const nextLesson = currentIndex < (lessons?.length ?? 0) - 1 ? lessons?.[currentIndex + 1] : null;

  // Check if current lesson is completed
  const isCompleted = progressData?.progress?.some(
    p => p.lesson_id === lessonId && p.completed
  ) ?? false;

  const handleMarkComplete = async () => {
    if (!user?.id || !lessonId) return;

    try {
      await markComplete.mutateAsync({
        userId: user.id,
        lessonId,
        completed: !isCompleted,
      });

      toast({
        title: isCompleted ? 'Marked as incomplete' : 'Lesson completed!',
        description: isCompleted 
          ? 'Progress updated' 
          : nextLesson 
            ? 'Great work! Ready for the next lesson?' 
            : 'Congratulations on completing this lesson!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Redirect to auth if not authenticated
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access this lesson.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Check purchase status
  if (!hasPurchased) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Course Not Purchased</h1>
          <p className="text-muted-foreground mb-4">You need to purchase this course to access the lessons.</p>
          <Button asChild>
            <Link to={`/courses/${courseId}`}>View Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Lesson not found
  if (!currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Lesson Not Found</h1>
          <p className="text-muted-foreground mb-4">This lesson doesn't exist.</p>
          <Button asChild>
            <Link to={`/courses/${courseId}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-4 sticky top-0 z-40">
        {/* Mobile Sidebar Toggle */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <LessonSidebar
              lessons={lessons || []}
              currentLessonId={lessonId || ''}
              courseId={courseId || ''}
              progress={progressData?.progress || []}
            />
          </SheetContent>
        </Sheet>

        {/* Back to Course */}
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to={`/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{course?.title}</span>
          </Link>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Lesson Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentLesson.title}</p>
        </div>

        {/* AI Tutor Button */}
        <Button
          variant={showAITutor ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowAITutor(true)}
          className="gap-2"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">AI Tutor</span>
        </Button>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <LessonSidebar
              lessons={lessons || []}
              currentLessonId={lessonId || ''}
              courseId={courseId || ''}
              progress={progressData?.progress || []}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-8 lg:p-12">
            <LessonContent lesson={currentLesson} />

            {/* Completion & Navigation */}
            <div className="mt-12 pt-8 border-t space-y-6">
              {/* Mark Complete Button */}
              <div className="flex justify-center">
                <Button
                  variant={isCompleted ? 'outline' : 'default'}
                  size="lg"
                  onClick={handleMarkComplete}
                  disabled={markComplete.isPending}
                  className="gap-2"
                >
                  <CheckCircle2 className={`h-5 w-5 ${isCompleted ? 'text-success' : ''}`} />
                  {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                </Button>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                {prevLesson ? (
                  <Button variant="outline" asChild className="gap-2">
                    <Link to={`/courses/${courseId}/lessons/${prevLesson.id}`}>
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous:</span> {prevLesson.title}
                    </Link>
                  </Button>
                ) : (
                  <div />
                )}

                {nextLesson ? (
                  <Button asChild className="gap-2">
                    <Link to={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                      <span className="hidden sm:inline">Next:</span> {nextLesson.title}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="gap-2">
                    <Link to={`/courses/${courseId}`}>
                      Complete Course
                      <CheckCircle2 className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* AI Tutor Chat */}
      <AITutorChat
        courseTitle={course?.title || ''}
        lessonTitle={currentLesson.title}
        lessonContent={currentLesson.content}
        isOpen={showAITutor}
        onClose={() => setShowAITutor(false)}
      />
    </div>
  );
}
