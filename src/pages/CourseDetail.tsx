import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCourse, useCourseLessons, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { phaseMetadata, formatPrice, getPhaseClasses, type CoursePhase } from '@/lib/courseData';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  ArrowRight,
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

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(courseId);
  const { data: hasPurchased } = useHasPurchasedCourse(user?.id, courseId);
  const { data: progressData } = useCourseProgress(user?.id, courseId);

  const isLoading = courseLoading || lessonsLoading;

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      navigate('/auth?mode=signup');
      return;
    }

    if (!course?.stripe_price_id) {
      toast({
        title: 'Error',
        description: 'This course is not available for purchase.',
        variant: 'destructive',
      });
      return;
    }

    setIsPurchasing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: course.stripe_price_id,
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <Button asChild>
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

  // Find completed lessons
  const completedLessonIds = new Set(
    progressData?.progress?.filter(p => p.completed).map(p => p.lesson_id) || []
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-muted/30 border-b py-12">
          <div className="container">
            <Button variant="ghost" asChild className="mb-6">
              <Link to="/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Courses
              </Link>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={phaseMeta.colorClass}>
                    {phaseMeta.icon} {phaseMeta.label}
                  </Badge>
                  <Badge variant="outline">Course {course.order_number}</Badge>
                </div>

                <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
                  {course.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-6">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{lessons?.length || 0} Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>AI Tutor Included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>Course Project</span>
                  </div>
                </div>
              </div>

              {/* Purchase/Access Card */}
              <div>
                <Card className="border-primary/20 shadow-lg">
                  <CardContent className="p-6">
                    {hasPurchased ? (
                      <>
                        <div className="flex items-center gap-2 text-success mb-4">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">You own this course</span>
                        </div>
                        
                        {/* Progress */}
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Your Progress</span>
                            <span className="font-medium">{progressPercent}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-2">
                            {progressData?.completedCount || 0} of {progressData?.lessonCount || 0} lessons completed
                          </p>
                        </div>

                        <Button className="w-full" size="lg" asChild>
                          <Link to={`/courses/${course.id}/lessons/${lessons?.[0]?.id}`}>
                            <Play className="mr-2 h-4 w-4" />
                            {progressData?.completedCount ? 'Continue Learning' : 'Start Course'}
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="text-center mb-6">
                          <div className="text-3xl font-bold text-foreground mb-2">
                            {formatPrice(course.price_cents)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            One-time payment, lifetime access
                          </p>
                        </div>

                        <Button 
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
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span>Full access to all lessons</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span>AI Tutor assistance</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span>Course project with AI feedback</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
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
        <section className="py-12">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lessons List */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-semibold mb-6">Course Content</h2>
                
                <div className="space-y-3">
                  {lessons?.map((lesson, index) => {
                    const isCompleted = completedLessonIds.has(lesson.id);
                    const isLocked = !hasPurchased;

                    return (
                      <Card 
                        key={lesson.id} 
                        className={`border-border/50 ${isLocked ? 'opacity-75' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Lesson Number/Status */}
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0
                              ${isCompleted 
                                ? 'bg-success text-success-foreground' 
                                : isLocked 
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-primary/10 text-primary'
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
                                  <Video className="h-4 w-4 text-muted-foreground" />
                                )}
                                {lesson.type === 'quiz' && (
                                  <Sparkles className="h-4 w-4 text-muted-foreground" />
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
                              <Button variant="ghost" size="sm" asChild>
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
                {/* Textbook Card */}
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookText className="h-5 w-5 text-amber-600" />
                      Interactive Textbook
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Read the course material in our interactive textbook format with page-turning animations.
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/courses/${course.id}/textbook`}>
                        <BookText className="mr-2 h-4 w-4" />
                        Open Textbook
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                {/* Project Card */}
                {course.project_title && (
                  <Card className="border-accent/20 bg-accent/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-accent" />
                        Course Project
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium mb-2">{course.project_title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {course.project_description}
                      </p>
                      {hasPurchased && (
                        <Button variant="outline" className="w-full" asChild>
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
                  <Card className="border-secondary/20 bg-secondary/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-secondary" />
                        Discussion Question
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {course.discussion_question}
                      </p>
                      {hasPurchased && (
                        <Button variant="outline" className="w-full" asChild>
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
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Download className="h-5 w-5 text-primary" />
                        Bonus Resource
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download your plug-and-play asset for this course.
                      </p>
                      <Button variant="outline" className="w-full">
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
