import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { phaseMetadata, formatPrice, getPhaseClasses, type CoursePhase } from '@/lib/courseData';
import { ArrowRight, BookOpen, CheckCircle2, Lock, ShoppingCart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Courses() {
  const { data: courses, isLoading } = useCourses();
  const { user, isAuthenticated } = useAuth();

  // Fetch user purchases if authenticated
  const { data: purchases } = useQuery({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('purchases')
        .select('course_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map(p => p.course_id);
    },
    enabled: !!user?.id,
  });

  // Fetch user progress if authenticated
  const { data: progressData } = useQuery({
    queryKey: ['all-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      // Get all lessons grouped by course
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, course_id');
      
      // Get user progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id);

      // Calculate progress per course
      const courseProgress: Record<string, { total: number; completed: number }> = {};
      
      lessons?.forEach(lesson => {
        if (!courseProgress[lesson.course_id]) {
          courseProgress[lesson.course_id] = { total: 0, completed: 0 };
        }
        courseProgress[lesson.course_id].total++;
      });

      progress?.forEach(p => {
        if (p.completed) {
          const lesson = lessons?.find(l => l.id === p.lesson_id);
          if (lesson && courseProgress[lesson.course_id]) {
            courseProgress[lesson.course_id].completed++;
          }
        }
      });

      return courseProgress;
    },
    enabled: !!user?.id,
  });

  const purchasedCourseIds = new Set(purchases || []);

  // Group courses by phase
  const coursesByPhase = courses?.reduce((acc, course) => {
    const phase = course.phase as CoursePhase;
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(course);
    return acc;
  }, {} as Record<CoursePhase, typeof courses>);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          {/* Page Header */}
          <div className="max-w-3xl mb-12">
            <h1 className="text-4xl font-display font-bold mb-4">
              Course Catalog
            </h1>
            <p className="text-lg text-muted-foreground">
              10 comprehensive courses designed to take you from solo founder to successful entrepreneur. 
              Complete all courses to build your professional portfolio and pitch.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-16">
              {(['initialization', 'orchestration', 'launch'] as CoursePhase[]).map((phase) => {
                const meta = phaseMetadata[phase];
                const phaseCourses = coursesByPhase?.[phase] || [];

                return (
                  <section key={phase}>
                    {/* Phase Header */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`px-4 py-2 rounded-lg ${getPhaseClasses(phase)} border`}>
                        <span className="text-2xl mr-2">{meta.icon}</span>
                        <span className="font-semibold">{meta.label}</span>
                      </div>
                      <span className="text-muted-foreground">{meta.description}</span>
                    </div>

                    {/* Course Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {phaseCourses.map((course) => {
                        const isPurchased = purchasedCourseIds.has(course.id);
                        const progress = progressData?.[course.id];
                        const progressPercent = progress 
                          ? Math.round((progress.completed / progress.total) * 100) 
                          : 0;

                        return (
                          <Card 
                            key={course.id} 
                            className="group relative flex flex-col border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                          >
                            {/* Purchase Status Badge */}
                            <div className="absolute top-4 right-4">
                              {isPurchased ? (
                                <Badge className="bg-success/10 text-success border-success/30">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Owned
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  {formatPrice(course.price_cents)}
                                </Badge>
                              )}
                            </div>

                            <CardHeader className="flex-1">
                              <Badge variant="outline" className="w-fit text-xs mb-2">
                                Course {course.order_number}
                              </Badge>
                              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                {course.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-3">
                                {course.description}
                              </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-0">
                              {/* Progress bar for purchased courses */}
                              {isPurchased && progress && progress.total > 0 && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-medium">{progressPercent}%</span>
                                  </div>
                                  <Progress value={progressPercent} className="h-2" />
                                </div>
                              )}

                              {/* Project info */}
                              {course.project_title && (
                                <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                                  <div className="text-xs text-muted-foreground mb-1">Course Project</div>
                                  <div className="text-sm font-medium">{course.project_title}</div>
                                </div>
                              )}

                              {/* Action Button */}
                              {isAuthenticated ? (
                                isPurchased ? (
                                  <Button className="w-full" asChild>
                                    <Link to={`/courses/${course.id}`}>
                                      <BookOpen className="mr-2 h-4 w-4" />
                                      Continue Learning
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button className="w-full" variant="outline" asChild>
                                    <Link to={`/courses/${course.id}`}>
                                      <ShoppingCart className="mr-2 h-4 w-4" />
                                      View & Purchase
                                    </Link>
                                  </Button>
                                )
                              ) : (
                                <Button className="w-full" variant="outline" asChild>
                                  <Link to={`/courses/${course.id}`}>
                                    View Details
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
