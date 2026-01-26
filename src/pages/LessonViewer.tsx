import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCourse, useCourseLessons, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseProgress, useMarkLessonComplete } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LessonContent } from '@/components/lesson/LessonContent';
import { LessonSidebar } from '@/components/lesson/LessonSidebar';
import { AITutorChat } from '@/components/lesson/AITutorChat';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { fireCourseCompletionConfetti } from '@/hooks/useConfetti';
import { 
  ArrowLeft,
  ArrowRight, 
  Bot, 
  CheckCircle2, 
  Menu,
  Lock
} from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function LessonViewer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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

    // Calculate if this will complete the course
    const currentlyCompleted = progressData?.completedCount ?? 0;
    const totalLessons = progressData?.lessonCount ?? 0;
    const willCompleteCourse = !isCompleted && currentlyCompleted + 1 === totalLessons;

    try {
      await markComplete.mutateAsync({
        userId: user.id,
        lessonId,
        completed: !isCompleted,
      });

      // Fire confetti if completing the entire course
      if (willCompleteCourse) {
        fireCourseCompletionConfetti();
        toast({
          title: '🎉 Course Completed!',
          description: `Congratulations! You've finished all lessons in ${course?.title}!`,
        });
      } else {
        toast({
          title: isCompleted ? 'Marked as incomplete' : 'Lesson completed!',
          description: isCompleted 
            ? 'Progress updated' 
            : nextLesson 
              ? 'Great work! Ready for the next lesson?' 
              : 'Congratulations on completing this lesson!',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="xl" />
      </div>
    );
  }

  // Check purchase status
  if (!hasPurchased) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="glass-card p-8 text-center max-w-md mx-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2 neon-text">Course Not Purchased</h1>
          <p className="text-muted-foreground mb-6">You need to purchase this course to access the lessons.</p>
          <Button asChild variant="neon">
            <Link to={`/courses/${courseId}`}>View Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Lesson not found
  if (!currentLesson) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="glass-card p-8 text-center max-w-md mx-4">
          <h1 className="text-2xl font-display font-bold mb-2 neon-text">Lesson Not Found</h1>
          <p className="text-muted-foreground mb-6">This lesson doesn't exist.</p>
          <Button asChild variant="neon">
            <Link to={`/courses/${courseId}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-primary/20 bg-black/60 backdrop-blur-xl flex items-center px-4 gap-4 sticky top-0 z-40 shadow-[0_4px_20px_rgba(168,85,247,0.15)]">
        {/* Mobile Sidebar Toggle */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden hover:bg-primary/20">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 bg-black/90 backdrop-blur-xl border-r border-primary/30">
            <LessonSidebar
              lessons={lessons || []}
              currentLessonId={lessonId || ''}
              courseId={courseId || ''}
              progress={progressData?.progress || []}
            />
          </SheetContent>
        </Sheet>

        {/* Breadcrumb Navigation */}
        <CourseBreadcrumb
          segments={[
            { label: course?.title || 'Course', href: `/courses/${courseId}` },
            { label: currentLesson.title },
          ]}
          className="flex-1 min-w-0"
        />

        {/* AI Tutor Button */}
        <Button
          variant={showAITutor ? 'neon' : 'outline'}
          size="sm"
          onClick={() => setShowAITutor(true)}
          className="gap-2 border-cyan-500/50 hover:border-cyan-400"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">AI Tutor</span>
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="h-full bg-black/40 backdrop-blur-xl border-r border-primary/20 overflow-auto">
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
            <div className="glass-card p-6 md:p-8">
              <LessonContent lesson={currentLesson} />

              {/* Completion & Navigation */}
              <div className="mt-12 pt-8 border-t border-primary/20 space-y-6">
                {/* Mark Complete Button */}
                <div className="flex justify-center">
                  <Button
                    variant={isCompleted ? 'outline' : 'neon'}
                    size="lg"
                    onClick={handleMarkComplete}
                    disabled={markComplete.isPending}
                    className="gap-2"
                  >
                    <CheckCircle2 className={`h-5 w-5 ${isCompleted ? 'text-green-400' : ''}`} />
                    {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                  {prevLesson ? (
                    <Button variant="outline" asChild className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
                      <Link to={`/courses/${courseId}/lessons/${prevLesson.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous:</span> {prevLesson.title}
                      </Link>
                    </Button>
                  ) : (
                    <div />
                  )}

                  {nextLesson ? (
                    <Button asChild variant="neon" className="gap-2">
                      <Link to={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                        <span className="hidden sm:inline">Next:</span> {nextLesson.title}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="neon" className="gap-2">
                      <Link to={`/courses/${courseId}`}>
                        Complete Course
                        <CheckCircle2 className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
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