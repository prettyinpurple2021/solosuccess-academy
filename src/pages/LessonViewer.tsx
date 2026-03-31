/**
 * @file LessonViewer.tsx — Main Lesson Viewing Page
 * 
 * The core learning experience. Displays a single lesson with:
 * - Sidebar navigation (desktop: always visible, mobile: sheet overlay)
 * - Lesson content rendered by LessonContent component
 * - Mark complete/incomplete toggle with XP awards
 * - Previous/Next lesson navigation
 * - AI Tutor chat panel (slide-in from right)
 * - Reading progress bar (scroll-based)
 * - Keyboard navigation (arrow keys, shortcuts)
 * - "Continue Later" bookmark feature
 * - Certificate generation on course completion
 * 
 * ROUTE: /courses/:courseId/lessons/:lessonId
 * 
 * ACCESS CONTROL:
 * - Requires authentication (via AppLayout)
 * - Requires course purchase (checked inline, shows lock screen)
 * 
 * COMPLETION FLOW:
 * 1. User clicks "Mark as Complete"
 * 2. Progress record upserted in user_progress table
 * 3. XP awarded via gamification system (+25 XP)
 * 4. Badge criteria checked after 1 second delay
 * 5. If ALL lessons in course are done → confetti + certificate generated
 * 
 * PRODUCTION TODO:
 * - Add lesson timer (track time spent per lesson)
 * - Add note-taking inline (currently only via AI tutor)
 * - Pre-fetch next lesson content for instant navigation
 * - Add lesson-level error boundary
 */
import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCourse, useCourseLessons, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseProgress, useMarkLessonComplete, useSubmitQuizScore, useUpdateLessonNotes, useSubmitActivityScore } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { LessonContent } from '@/components/lesson/LessonContent';
import { LessonSidebar } from '@/components/lesson/LessonSidebar';
import { AITutorChat } from '@/components/lesson/AITutorChat';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { CertificateModal } from '@/components/certificates/CertificateModal';
import { LessonProgressBar } from '@/components/lesson/LessonProgressBar';
import { ReadingProgressBar } from '@/components/lesson/ReadingProgressBar';
import { KeyboardNavigation } from '@/components/lesson/KeyboardNavigation';
import { PageTransition, ContentTransition } from '@/components/lesson/PageTransition';
import { fireCourseCompletionConfetti } from '@/hooks/useConfetti';
import { useGamification } from '@/components/gamification/GamificationProvider';
import { useCourseCertificate, useGenerateCertificate } from '@/hooks/useCertificates';
import { useSetContinueLater } from '@/hooks/useContinueLater';
import { 
  ArrowLeft,
  ArrowRight, 
  Bot, 
  Bookmark,
  CheckCircle2, 
  Menu,
  Lock
} from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function LessonViewer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { toast } = useToast();
  const { awardXP, checkAndAwardBadges } = useGamification();
  const [showAITutor, setShowAITutor] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState<{
    verificationCode: string;
    issuedAt: string;
  } | null>(null);

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(courseId);
  const { data: hasPurchased, isLoading: purchaseLoading } = useHasPurchasedCourse(user?.id, courseId);
  const { data: progressData, isLoading: progressLoading } = useCourseProgress(user?.id, courseId);
  const { data: existingCertificate } = useCourseCertificate(user?.id, courseId);
  const generateCertificate = useGenerateCertificate();
  const markComplete = useMarkLessonComplete();
  const submitQuizScore = useSubmitQuizScore();
  const submitActivityScore = useSubmitActivityScore();
  const updateNotes = useUpdateLessonNotes();
  const setContinueLater = useSetContinueLater();

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

  // Retrieve the current lesson's saved progress record (for notes & quiz score)
  const currentProgress = progressData?.progress?.find(p => p.lesson_id === lessonId) ?? null;

  // Memoized toggle handlers for keyboard navigation - must be before early returns
  const handleToggleAITutor = useCallback(() => {
    setShowAITutor(prev => !prev);
  }, []);

  /** Called when a quiz is submitted — saves score and auto-marks complete if passed */
  const handleQuizSubmit = async (score: number) => {
    if (!user?.id || !lessonId || !currentLesson?.quiz_data) return;
    const { passingScore } = currentLesson.quiz_data;
    try {
      await submitQuizScore.mutateAsync({ userId: user.id, lessonId, score, passingScore });
      if (score >= passingScore) {
        toast({ title: '🎉 Quiz Passed!', description: `You scored ${score}%. Lesson marked complete!` });
        // Check for new badges
        await awardXP('LESSON_COMPLETE');
        setTimeout(() => checkAndAwardBadges(), 1000);
      } else {
        toast({ title: `Quiz submitted — ${score}%`, description: `You need ${passingScore}% to pass. Review the answers and try again!` });
      }
    } catch {
      toast({ title: 'Error saving quiz score', variant: 'destructive' });
    }
  };

  /** Called when activity step progress changes — saves score to DB */
  const handleActivityProgress = async (score: number) => {
    if (!user?.id || !lessonId) return;
    try {
      await submitActivityScore.mutateAsync({ userId: user.id, lessonId, score });
      if (score === 100) {
        toast({ title: '🎉 Activity Complete!', description: 'All steps completed. Great work!' });
        await awardXP('LESSON_COMPLETE');
        setTimeout(() => checkAndAwardBadges(), 1000);
      }
    } catch {
      // Silent fail — don't interrupt the student's flow
      console.error('Failed to save activity score');
    }
  };

  /** Called when worksheet or assignment responses are saved */
  const handleSaveNotes = async (notes: string) => {
    if (!user?.id || !lessonId) return;
    try {
      await updateNotes.mutateAsync({ userId: user.id, lessonId, notes });
      toast({ title: 'Saved', description: 'Your response has been saved.' });
    } catch {
      toast({ title: 'Error saving response', variant: 'destructive' });
    }
  };

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

      // Award XP if completing (not uncompleting)
      if (!isCompleted) {
        await awardXP('LESSON_COMPLETE');
        // Check for new badges after a short delay
        setTimeout(() => checkAndAwardBadges(), 1000);
      }

      // Fire confetti and generate certificate if completing the entire course
      if (willCompleteCourse) {
        fireCourseCompletionConfetti();
        
        // Generate certificate if one doesn't exist
        if (!existingCertificate && course) {
          try {
            const studentName = profile?.display_name || user.email?.split('@')[0] || 'Student';
            const cert = await generateCertificate.mutateAsync({
              userId: user.id,
              courseId: course.id,
              studentName,
              courseTitle: course.title,
            });
            
            setGeneratedCertificate({
              verificationCode: cert.verification_code,
              issuedAt: cert.issued_at,
            });
            setShowCertificateModal(true);
          } catch (certError) {
            console.error('Failed to generate certificate:', certError);
          }
        }
        
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
      {/* Reading Progress Bar */}
      <ReadingProgressBar />

      {/* Keyboard Navigation Helper */}
      <KeyboardNavigation
        courseId={courseId || ''}
        prevLessonId={prevLesson?.id}
        nextLessonId={nextLesson?.id}
        onToggleComplete={handleMarkComplete}
        onToggleAITutor={handleToggleAITutor}
      />

      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-primary/20 bg-background/60 backdrop-blur-xl flex items-center px-4 gap-4 sticky top-0 z-40 shadow-[0_4px_20px_hsl(var(--primary)/0.15)]">
        {/* Mobile Sidebar Toggle */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden hover:bg-primary/20">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 bg-background/90 backdrop-blur-xl border-r border-primary/30">
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

        {/* Continue later */}
        {user?.id && courseId && lessonId && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await setContinueLater.mutateAsync({
                  userId: user.id,
                  courseId,
                  lessonId,
                });
                toast({ title: 'Saved!', description: 'This lesson is set as your continue point. Find it on your Dashboard.' });
              } catch {
                toast({ title: 'Could not save', variant: 'destructive' });
              }
            }}
            disabled={setContinueLater.isPending}
            className="gap-2 border-primary/30 hover:bg-primary/10"
          >
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Continue later</span>
          </Button>
        )}

        {/* AI Tutor Button */}
        <Button
          variant={showAITutor ? 'neon' : 'outline'}
          size="sm"
          onClick={() => setShowAITutor(true)}
          className="gap-2 border-secondary/50 hover:border-secondary"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">AI Tutor</span>
        </Button>
      </header>

      {/* Lesson Progress Bar - Shows position in course */}
      <div className="py-3 border-b border-primary/10 bg-background/40 backdrop-blur-sm">
        <LessonProgressBar
          lessons={lessons || []}
          currentLessonId={lessonId || ''}
          courseId={courseId || ''}
          progress={progressData?.progress || []}
        />
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="h-full bg-background/40 backdrop-blur-xl border-r border-primary/20 overflow-auto">
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
          <PageTransition>
            <div className="max-w-4xl mx-auto p-6 md:p-8 lg:p-12">
              <ContentTransition>
                <div className="glass-card p-6 md:p-8">
                  <LessonContent
                    lesson={currentLesson}
                    savedNotes={currentProgress?.notes ?? null}
                    quizScore={currentProgress?.quiz_score ?? null}
                    quizAttempts={(currentProgress as any)?.quiz_attempts ?? 0}
                    activityScore={currentProgress?.activity_score ?? null}
                    onQuizSubmit={handleQuizSubmit}
                    onActivityProgress={handleActivityProgress}
                    onSaveNotes={handleSaveNotes}
                    isCompleted={isCompleted}
                    existingNotes={progressData?.progress?.find(p => p.lesson_id === lessonId)?.notes ?? null}
                    userId={user?.id}
                    courseId={courseId}
                  />

                  {/* Completion & Navigation */}
                  <div className="mt-12 pt-8 border-t border-primary/20 space-y-6">
                     {/* Mark Complete Button — hidden for assignment type since submission handles it */}
                    {currentLesson.type !== 'assignment' && (
                      <div className="flex justify-center">
                        <Button
                          variant={isCompleted ? 'outline' : 'neon'}
                          size="lg"
                          onClick={handleMarkComplete}
                          disabled={markComplete.isPending}
                          className="gap-2 transition-all duration-300"
                        >
                          <CheckCircle2 className={`h-5 w-5 transition-colors ${isCompleted ? 'text-success' : ''}`} />
                          {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                        </Button>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-4">
                      {prevLesson ? (
                        <Button variant="outline" asChild className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-300">
                          <Link to={`/courses/${courseId}/lessons/${prevLesson.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous:</span> 
                            <span className="max-w-[120px] truncate">{prevLesson.title}</span>
                          </Link>
                        </Button>
                      ) : (
                        <div />
                      )}

                      {nextLesson ? (
                        <Button asChild variant="neon" className="gap-2 transition-all duration-300">
                          <Link to={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                            <span className="hidden sm:inline">Next:</span> 
                            <span className="max-w-[120px] truncate">{nextLesson.title}</span>
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
              </ContentTransition>
            </div>
          </PageTransition>
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

      {/* Certificate Modal */}
      {generatedCertificate && course && (
        <CertificateModal
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          studentName={profile?.display_name || user?.email?.split('@')[0] || 'Student'}
          courseTitle={course.title}
          courseOrderNumber={course.order_number}
          verificationCode={generatedCertificate.verificationCode}
          issuedAt={generatedCertificate.issuedAt}
        />
      )}
    </div>
  );
}