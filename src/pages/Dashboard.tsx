import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { phaseMetadata, formatPrice, getPhaseClasses, type CoursePhase } from '@/lib/courseData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  Trophy, 
  Target,
  Clock,
  Sparkles,
  Play
} from 'lucide-react';

function DashboardContent() {
  const { user, profile } = useAuth();
  const { data: courses } = useCourses();

  // Fetch user purchases
  const { data: purchases } = useQuery({
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
  const { data: progressData } = useQuery({
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">
              Welcome back, {profile?.display_name || 'Founder'}! 👋
            </h1>
            <p className="text-muted-foreground">
              Track your progress and continue your journey to success.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Courses Owned</p>
                    <p className="text-2xl font-bold">{purchasedCount}/{totalCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lessons Complete</p>
                    <p className="text-2xl font-bold">{completedLessons}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                    <p className="text-2xl font-bold">{overallProgress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Achievements</p>
                    <p className="text-2xl font-bold">{completedLessons > 0 ? 1 : 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Continue Learning */}
              {continueCourse && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Play className="h-4 w-4" />
                      <span className="text-sm font-medium">Continue Learning</span>
                    </div>
                    <CardTitle>{(continueCourse.courses as any)?.title}</CardTitle>
                    <CardDescription>
                      {(continueCourse.courses as any)?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {courseProgressMap.get(continueCourse.course_id)?.completed || 0}/
                          {courseProgressMap.get(continueCourse.course_id)?.total || 0} lessons
                        </span>
                      </div>
                      <Progress 
                        value={
                          ((courseProgressMap.get(continueCourse.course_id)?.completed || 0) / 
                          (courseProgressMap.get(continueCourse.course_id)?.total || 1)) * 100
                        } 
                        className="h-2" 
                      />
                    </div>
                    <Button asChild>
                      <Link to={`/courses/${continueCourse.course_id}`}>
                        Continue Course
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Purchased Courses */}
              <div>
                <h2 className="text-xl font-semibold mb-4">My Courses</h2>
                {purchases && purchases.length > 0 ? (
                  <div className="grid gap-4">
                    {purchases.map((purchase) => {
                      const course = purchase.courses as any;
                      const progress = courseProgressMap.get(purchase.course_id);
                      const progressPercent = progress 
                        ? Math.round((progress.completed / progress.total) * 100)
                        : 0;

                      return (
                        <Card key={purchase.id} className="border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getPhaseClasses(course?.phase)}`}>
                                <span className="text-lg font-bold">{course?.order_number}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{course?.title}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                  <Progress value={progressPercent} className="flex-1 h-2" />
                                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {progressPercent}%
                                  </span>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
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
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="font-medium mb-2">No courses yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start your journey by purchasing your first course.
                      </p>
                      <Button asChild>
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
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Your Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {courses?.slice(0, 10).map((course) => {
                    const isPurchased = purchasedCourseIds.has(course.id);
                    const progress = courseProgressMap.get(course.id);
                    const isComplete = progress && progress.completed === progress.total && progress.total > 0;

                    return (
                      <Link 
                        key={course.id}
                        to={`/courses/${course.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium
                          ${isComplete 
                            ? 'bg-success text-success-foreground' 
                            : isPurchased 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isComplete ? <CheckCircle2 className="h-4 w-4" /> : course.order_number}
                        </div>
                        <span className={`text-sm truncate ${!isPurchased && 'text-muted-foreground'}`}>
                          {course.title}
                        </span>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
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
      </main>

      <Footer />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
