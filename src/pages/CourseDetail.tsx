import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCourse, useCourseLessons, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useCourseCertificate } from '@/hooks/useCertificates';
import { downloadCertificate } from '@/lib/certificateGenerator';
import { phaseMetadata, formatPrice, getPhaseClasses, type CoursePhase } from '@/lib/courseData';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  ArrowRight,
  Award,
  BookOpen, 
  BookText,
  CheckCircle2, 
  Clock, 
  Download,
  Lock,
  MessageSquare,
  Play,
  ShoppingCart,
  Sparkles,
  Target,
  FileText,
  Video
} from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { PageMeta } from '@/components/layout/PageMeta';
import { ErrorView } from '@/components/ui/error-view';

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { data: course, isLoading: courseLoading, isError: courseError, error: courseErr, refetch: refetchCourse } = useCourse(courseId);
  const { data: lessons, isLoading: lessonsLoading, isError: lessonsError, error: lessonsErr, refetch: refetchLessons } = useCourseLessons(courseId);
  const { data: hasPurchased } = useHasPurchasedCourse(user?.id, courseId);
  const { data: progressData } = useCourseProgress(user?.id, courseId);
  const { data: certificate } = useCourseCertificate(user?.id, courseId);

  const isLoading = courseLoading || lessonsLoading;
  const isError = courseError || lessonsError;
  const error = courseErr ?? lessonsErr;
  const refetch = () => {
    refetchCourse();
    refetchLessons();
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      navigate('/auth?mode=signup');
      return;
    }

    if (!course) {
      toast({
        title: 'Error',
        description: 'This course is not available for purchase.',
        variant: 'destructive',
      });
      return;
    }

    setIsPurchasing(true);

    try {
      // Only send courseId — stripe_price_id is looked up server-side for security
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          courseId: course.id,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Purchase Error',
        description: error.message || 'Failed to initiate purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <NeonSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <ErrorView
            message={error?.message}
            onRetry={refetch}
            backTo="/courses"
            backLabel="Back to courses"
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <div className="text-center glass-card p-8 rounded-lg">
            <h1 className="text-2xl font-bold mb-4 neon-text">Course Not Found</h1>
            <Button variant="neon" asChild>
              <Link to="/courses">Back to Courses</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const phaseMeta = phaseMetadata[course.phase as CoursePhase];
  const progressPercent = progressData?.lessonCount 
    ? Math.round((progressData.completedCount / progressData.lessonCount) * 100)
    : 0;
  const isCourseComplete = progressPercent === 100;

  // Find completed lessons
  const completedLessonIds = new Set(
    progressData?.progress?.filter(p => p.completed).map(p => p.lesson_id) || []
  );

  const handleDownloadCertificate = () => {
    if (!certificate || !course) return;
    downloadCertificate({
      studentName: certificate.student_name,
      courseTitle: certificate.course_title,
      courseOrderNumber: course.order_number,
      verificationCode: certificate.verification_code,
      issuedAt: certificate.issued_at,
    });
    toast({
      title: 'Certificate Downloaded',
      description: 'Your certificate PDF has been saved.',
    });
  };

  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      <PageMeta
        title={course.title}
        description={course.description ?? undefined}
        path={`/courses/${course.id}`}
      />
      <Header />
      
      <main className="flex-1 relative">
        {/* Cyber grid overlay */}
        <div className="cyber-grid" />
        
        {/* Hero Section */}
        <section className="relative py-12 border-b border-primary/20">
          {/* Animated glow orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-orb-glow-primary" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-orb-glow-secondary" style={{ animationDelay: '1.5s' }} />
          
          <div className="container relative z-10">
            <Button variant="ghost" asChild className="mb-6 hover:bg-primary/10 hover:text-primary transition-all">
              <Link to="/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Courses
              </Link>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`${phaseMeta.colorClass} shadow-[0_0_15px_currentColor/0.3]`}>
                    {phaseMeta.icon} {phaseMeta.label}
                  </Badge>
                  <Badge variant="outline" className="border-primary/30 bg-primary/10">
                    Course {course.order_number}
                  </Badge>
                </div>

                <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 neon-text">
                  {course.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-6">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  {hasPurchased && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Your progress: {progressData?.completedCount ?? 0}/{progressData?.lessonCount ?? 0} lessons</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>{lessons?.length || 0} Lessons</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
                    <MessageSquare className="h-4 w-4 text-secondary" />
                    <span>AI Tutor Included</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                    <Target className="h-4 w-4 text-accent" />
                    <span>Course Project</span>
                  </div>
                </div>
              </div>

              {/* Purchase/Access Card */}
              <div>
                <Card className="glass-card border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
                  <CardContent className="p-6">
                    {hasPurchased ? (
                      <>
                        <div className="flex items-center gap-2 text-success mb-4">
                          <CheckCircle2 className="h-5 w-5 drop-shadow-[0_0_8px_hsl(var(--success))]" />
                          <span className="font-medium">You own this course</span>
                        </div>
                        
                        {/* Progress Ring */}
                        <div className="flex flex-col items-center mb-6">
                          <ProgressRing 
                            progress={progressPercent} 
                            size="lg"
                            label={`${progressData?.completedCount || 0}/${progressData?.lessonCount || 0}`}
                            sublabel="lessons"
                          />
                        </div>

                        <Button variant="neon" className="w-full" size="lg" asChild>
                          <Link to={`/courses/${course.id}/lessons/${lessons?.[0]?.id}`}>
                            <Play className="mr-2 h-4 w-4" />
                            {progressData?.completedCount ? 'Continue Learning' : 'Start Course'}
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="text-center mb-6">
                          <div className="text-3xl font-bold text-foreground mb-2 neon-text">
                            {formatPrice(course.price_cents)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            One-time payment, lifetime access
                          </p>
                        </div>

                        <Button 
                          variant="neon"
                          className="w-full" 
                          size="lg" 
                          onClick={handlePurchase}
                          disabled={isPurchasing}
                        >
                          {isPurchasing ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Purchase Course
                            </>
                          )}
                        </Button>

                        <ul className="mt-6 space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success drop-shadow-[0_0_6px_hsl(var(--success))]" />
                            <span>Full access to all lessons</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success drop-shadow-[0_0_6px_hsl(var(--success))]" />
                            <span>AI Tutor assistance</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success drop-shadow-[0_0_6px_hsl(var(--success))]" />
                            <span>Course project with AI feedback</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success drop-shadow-[0_0_6px_hsl(var(--success))]" />
                            <span>Discussion board access</span>
                          </li>
                        </ul>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content */}
        <section className="py-12 relative z-10">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lessons List */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-display font-semibold mb-6 neon-text">Course Content</h2>
                
                <div className="space-y-3">
                  {lessons?.map((lesson, index) => {
                    const isCompleted = completedLessonIds.has(lesson.id);
                    const isLocked = !hasPurchased;

                    return (
                      <Card 
                        key={lesson.id} 
                        className={`glass-card border-primary/20 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_25px_hsl(var(--primary)/0.2)] ${isLocked ? 'opacity-60' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Lesson Number/Status */}
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                              ${isCompleted 
                                ? 'bg-success/20 text-success border border-success/30 shadow-[0_0_15px_hsl(var(--success)/0.4)]' 
                                : isLocked 
                                  ? 'bg-muted/50 text-muted-foreground border border-muted'
                                  : 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : isLocked ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <span className="text-sm font-medium">{index + 1}</span>
                              )}
                            </div>

                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium truncate">{lesson.title}</h3>
                                {lesson.type === 'video' && (
                                  <Video className="h-4 w-4 text-secondary" />
                                )}
                                {lesson.type === 'quiz' && (
                                  <Sparkles className="h-4 w-4 text-accent" />
                                )}
                              </div>
                              {lesson.duration_minutes && (
                                <p className="text-sm text-muted-foreground">
                                  {lesson.duration_minutes} min
                                </p>
                              )}
                            </div>

                            {/* Action */}
                            {!isLocked && (
                              <Button variant="outline" size="sm" asChild className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                                <Link to={`/courses/${course.id}/lessons/${lesson.id}`}>
                                  {isCompleted ? 'Review' : 'Start'}
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Certificate Card (if course is complete) */}
                {certificate && isCourseComplete && (
                  <Card className="glass-card border-accent/30 hover:border-accent/50 hover:shadow-[0_0_25px_hsl(var(--accent)/0.2)] transition-all duration-300 overflow-hidden">
                    <div className="bg-gradient-to-r from-accent/20 to-primary/20 p-4 border-b border-accent/20">
                      <div className="flex items-center gap-2 text-accent">
                        <Award className="h-5 w-5 drop-shadow-[0_0_8px_hsl(var(--accent))]" />
                        <span className="font-display font-semibold">Course Complete!</span>
                      </div>
                    </div>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Congratulations! You've earned your certificate for this course.
                      </p>
                      <Button 
                        variant="neon" 
                        className="w-full gap-2"
                        onClick={handleDownloadCertificate}
                      >
                        <Download className="h-4 w-4" />
                        Download Certificate
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Code: <span className="font-mono text-primary">{certificate.verification_code}</span>
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Final Exam Card */}
                {hasPurchased && (
                  <Card className="glass-card border-secondary/30 hover:border-secondary/50 hover:shadow-[0_0_25px_hsl(var(--secondary)/0.2)] transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 font-display">
                        <FileText className="h-5 w-5 text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary)/0.5)]" />
                        Final Exam
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Test your knowledge with the course final exam — mixed format questions covering all lessons.
                      </p>
                      <Button variant="outline" className="w-full border-secondary/30 hover:bg-secondary/10 hover:border-secondary/50 hover:shadow-[0_0_15px_hsl(var(--secondary)/0.3)]" asChild>
                        <Link to={`/courses/${course.id}/final-exam`}>
                          <FileText className="mr-2 h-4 w-4" />
                          Take Final Exam
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Textbook Card */}
                <Card className="glass-card border-amber-500/30 hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 font-display">
                      <BookText className="h-5 w-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      Interactive Textbook
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Read the course material in our interactive textbook format with page-turning animations.
                    </p>
                    <Button variant="outline" className="w-full border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]" asChild>
                      <Link to={`/courses/${course.id}/textbook`}>
                        <BookText className="mr-2 h-4 w-4" />
                        Open Textbook
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Project Card */}
                {course.project_title && (
                  <Card className="glass-card border-accent/30 hover:border-accent/50 hover:shadow-[0_0_25px_hsl(var(--accent)/0.2)] transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 font-display">
                        <Target className="h-5 w-5 text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.5)]" />
                        Course Project
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium mb-2">{course.project_title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {course.project_description}
                      </p>
                      {hasPurchased && (
                        <Button variant="outline" className="w-full border-accent/30 hover:bg-accent/10 hover:border-accent/50 hover:shadow-[0_0_15px_hsl(var(--accent)/0.3)]" asChild>
                          <Link to={`/courses/${course.id}/project`}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Project
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Discussion Question */}
                {course.discussion_question && (
                  <Card className="glass-card border-secondary/30 hover:border-secondary/50 hover:shadow-[0_0_25px_hsl(var(--secondary)/0.2)] transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 font-display">
                        <MessageSquare className="h-5 w-5 text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary)/0.5)]" />
                        Discussion Question
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {course.discussion_question}
                      </p>
                      {hasPurchased && (
                        <Button variant="outline" className="w-full border-secondary/30 hover:bg-secondary/10 hover:border-secondary/50 hover:shadow-[0_0_15px_hsl(var(--secondary)/0.3)]" asChild>
                          <Link to={`/courses/${course.id}/discussions`}>
                            Join Discussion
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Plug and Play Asset */}
                {course.plug_and_play_asset && hasPurchased && (
                  <Card className="glass-card border-primary/30 hover:border-primary/50 hover:shadow-[0_0_25px_hsl(var(--primary)/0.2)] transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 font-display">
                        <Download className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                        Bonus Resource
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download your plug-and-play asset for this course.
                      </p>
                      <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                        <Download className="mr-2 h-4 w-4" />
                        Download Asset
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
