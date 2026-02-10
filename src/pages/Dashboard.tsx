import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { useCertificateCount } from '@/hooks/useCertificates';
import { useContinueLater } from '@/hooks/useContinueLater';
import { phaseMetadata, formatPrice, getPhaseClasses, type CoursePhase } from '@/lib/courseData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowRight, 
  BookOpen, 
  Bookmark,
  CheckCircle2, 
  Trophy, 
  Target,
  Clock,
  Sparkles,
  Play,
  Zap,
  Terminal
} from 'lucide-react';
import { PageMeta } from '@/components/layout/PageMeta';
import { ErrorView } from '@/components/ui/error-view';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { data: courses } = useCourses();
  const { data: certificateCount } = useCertificateCount(user?.id);
  const { data: continueLater } = useContinueLater(user?.id);

  // Fetch user purchases
  const { data: purchases, isError: purchasesError, error: purchasesErr, refetch: refetchPurchases } = useQuery({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('purchases')
        .select('*, courses(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all progress data
  const { data: progressData, isError: progressError, error: progressErr, refetch: refetchProgress } = useQuery({
    queryKey: ['all-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return { progress: [], lessons: [] };
      
      const [lessonsResult, progressResult] = await Promise.all([
        supabase.from('lessons').select('id, course_id'),
        supabase.from('user_progress').select('*').eq('user_id', user.id),
      ]);

      return {
        lessons: lessonsResult.data || [],
        progress: progressResult.data || [],
      };
    },
    enabled: !!user?.id,
  });

  // Calculate overall stats
  const purchasedCourseIds = new Set(purchases?.map(p => p.course_id) || []);
  const totalCourses = courses?.length || 10;
  const purchasedCount = purchasedCourseIds.size;
  
  // Calculate lessons completed
  const completedLessons = progressData?.progress?.filter(p => p.completed).length || 0;
  const totalLessonsInPurchased = progressData?.lessons?.filter(
    l => purchasedCourseIds.has(l.course_id)
  ).length || 0;
  
  const overallProgress = totalLessonsInPurchased > 0 
    ? Math.round((completedLessons / totalLessonsInPurchased) * 100) 
    : 0;

  // Get course progress details
  const courseProgressMap = new Map<string, { total: number; completed: number }>();
  progressData?.lessons?.forEach(lesson => {
    if (!courseProgressMap.has(lesson.course_id)) {
      courseProgressMap.set(lesson.course_id, { total: 0, completed: 0 });
    }
    const current = courseProgressMap.get(lesson.course_id)!;
    current.total++;
  });
  progressData?.progress?.forEach(p => {
    if (p.completed) {
      const lesson = progressData.lessons?.find(l => l.id === p.lesson_id);
      if (lesson) {
        const current = courseProgressMap.get(lesson.course_id);
        if (current) current.completed++;
      }
    }
  });

  // Find the course to continue (first incomplete purchased course)
  const continueCourse = purchases?.find(p => {
    const progress = courseProgressMap.get(p.course_id);
    return progress && progress.completed < progress.total;
  });

  const dataError = purchasesError || progressError;
  const dataErrorMessage = purchasesErr?.message ?? progressErr?.message;
  const refetchData = () => {
    refetchPurchases();
    refetchProgress();
  };

  if (dataError) {
    return (
      <div className="py-8">
        <PageMeta title="Dashboard" path="/dashboard" noIndex />
        <ErrorView
          message={dataErrorMessage}
          onRetry={refetchData}
          backTo="/dashboard"
          backLabel="Refresh dashboard"
        />
      </div>
    );
  }

  return (
    <div className="py-8">
      <PageMeta title="Dashboard" path="/dashboard" noIndex />
      <div className="container">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="h-6 w-6 text-primary" />
            <Badge variant="outline" className="font-mono border-primary/30 bg-primary/10">
              &gt; COMMAND_CENTER
            </Badge>
          </div>
          <h1 className="text-4xl font-display font-bold mb-3">
            <span className="text-foreground">WELCOME BACK,</span>{' '}
            <span className="text-gradient">{profile?.display_name?.toUpperCase() || 'FOUNDER'}</span>
          </h1>
          <p className="text-muted-foreground font-mono">
            Track your progress and continue your journey to success.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <Card className="glass-card glass-card-hover group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(270_80%_60%/0.4)] transition-all">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-mono">Courses Owned</p>
                  <p className="text-3xl font-display font-bold text-gradient">{purchasedCount}/{totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card glass-card-hover group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-success/10 border border-success/30 flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(142_80%_50%/0.4)] transition-all">
                  <CheckCircle2 className="h-7 w-7 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-mono">Lessons Complete</p>
                  <p className="text-3xl font-display font-bold text-success">{completedLessons}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card glass-card-hover group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(185_80%_50%/0.4)] transition-all">
                  <Target className="h-7 w-7 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-mono">Overall Progress</p>
                  <p className="text-3xl font-display font-bold text-secondary">{overallProgress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card glass-card-hover group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(320_80%_60%/0.4)] transition-all">
                  <Trophy className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-mono">Certificates</p>
                  <p className="text-3xl font-display font-bold text-accent">{certificateCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Link to="/certificates" className="hidden" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue later (bookmark) */}
            {continueLater && (
              <Card className="glass-card border-secondary/30 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 via-transparent to-transparent" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-2 text-secondary mb-2">
                    <Bookmark className="h-5 w-5" />
                    <span className="text-sm font-display font-medium tracking-wide">CONTINUE HERE</span>
                  </div>
                  <CardTitle className="text-xl">
                    {continueLater.course?.title ?? 'Course'} – {continueLater.lesson_id
                      ? (continueLater.lesson?.title ?? 'Lesson')
                      : 'Textbook'}
                  </CardTitle>
                  <CardDescription>
                    Pick up where you left off.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Button variant="outline" className="border-secondary/30 hover:bg-secondary/10" asChild>
                    <Link to={continueLater.lesson_id
                      ? `/courses/${continueLater.course_id}/lessons/${continueLater.lesson_id}`
                      : `/courses/${continueLater.course_id}/textbook`}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Continue Learning */}
            {continueCourse && (
              <Card className="glass-card border-primary/30 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Play className="h-5 w-5" />
                    <span className="text-sm font-display font-medium tracking-wide">CONTINUE LEARNING</span>
                  </div>
                  <CardTitle className="text-2xl">{(continueCourse.courses as any)?.title}</CardTitle>
                  <CardDescription>
                    {(continueCourse.courses as any)?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-muted-foreground font-mono">Progress</span>
                      <span className="font-display font-medium text-primary">
                        {courseProgressMap.get(continueCourse.course_id)?.completed || 0}/
                        {courseProgressMap.get(continueCourse.course_id)?.total || 0} lessons
                      </span>
                    </div>
                    <Progress 
                      value={
                        ((courseProgressMap.get(continueCourse.course_id)?.completed || 0) / 
                        (courseProgressMap.get(continueCourse.course_id)?.total || 1)) * 100
                      } 
                      className="h-3" 
                    />
                  </div>
                  <Button variant="neon" asChild>
                    <Link to={`/courses/${continueCourse.course_id}`}>
                      <Zap className="mr-2 h-4 w-4" />
                      Continue Course
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Purchased Courses */}
            <div>
              <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-gradient">YOUR COURSES</span>
              </h2>
              
              {purchases && purchases.length > 0 ? (
                <div className="space-y-4">
                  {purchases.map((purchase) => {
                    const course = purchase.courses as any;
                    const progress = courseProgressMap.get(purchase.course_id);
                    const progressPercent = progress 
                      ? Math.round((progress.completed / progress.total) * 100) 
                      : 0;
                    const phaseMeta = phaseMetadata[course?.phase as CoursePhase];

                    return (
                      <Card key={purchase.id} className="glass-card glass-card-hover">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getPhaseClasses(course?.phase)} shadow-[0_0_15px_currentColor/0.3]`}>
                              <span className="text-lg">{phaseMeta?.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs border-primary/30">
                                  Course {course?.order_number}
                                </Badge>
                                {progressPercent === 100 && (
                                  <Badge className="bg-success/20 text-success border-success/30">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Complete
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-display font-medium truncate">{course?.title}</h3>
                              <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="text-muted-foreground font-mono">
                                    {progress?.completed || 0}/{progress?.total || 0} lessons
                                  </span>
                                  <span className="font-display text-primary">{progressPercent}%</span>
                                </div>
                                <Progress value={progressPercent} className="h-1.5" />
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild className="flex-shrink-0 border-primary/30 hover:bg-primary/10">
                              <Link to={`/courses/${purchase.course_id}`}>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="glass-card border-dashed border-primary/30">
                  <CardContent className="py-16 text-center">
                    <BookOpen className="h-14 w-14 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="font-display font-medium text-xl mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-6 font-mono text-sm">
                      Start your journey by purchasing your first course.
                    </p>
                    <Button variant="neon" asChild>
                      <Link to="/courses">Browse Courses</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Roadmap */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-display">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-gradient">YOUR ROADMAP</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {courses?.slice(0, 10).map((course) => {
                  const isPurchased = purchasedCourseIds.has(course.id);
                  const progress = courseProgressMap.get(course.id);
                  const isComplete = progress && progress.completed === progress.total && progress.total > 0;

                  return (
                    <Link 
                      key={course.id}
                      to={`/courses/${course.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-all group border border-transparent hover:border-primary/30"
                    >
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-display font-bold transition-all
                        ${isComplete 
                          ? 'bg-success text-success-foreground shadow-[0_0_15px_hsl(142_80%_50%/0.5)]' 
                          : isPurchased 
                            ? 'bg-primary/20 text-primary border border-primary/30' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : course.order_number}
                      </div>
                      <span className={`text-sm truncate font-mono ${!isPurchased && 'text-muted-foreground'} group-hover:text-primary transition-colors`}>
                        {course.title}
                      </span>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-display">
                  <Zap className="h-5 w-5 text-secondary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/courses">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse All Courses
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/profile">
                    <Target className="mr-2 h-4 w-4" />
                    View Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
