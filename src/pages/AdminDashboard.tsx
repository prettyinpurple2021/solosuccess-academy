import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LessonList } from '@/components/admin/LessonList';
import { CourseEditor } from '@/components/admin/CourseEditor';
import { TextbookEditor } from '@/components/admin/TextbookEditor';
import { SeedCurriculumButton } from '@/components/admin/SeedCurriculumButton';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, useAdminCourses, useUpdateCourse } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Shield, 
  BookOpen, 
  Eye, 
  EyeOff,
  Users,
  DollarSign,
  Plus,
  BookText
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(user?.id);
  const { data: courses, isLoading: coursesLoading } = useAdminCourses();
  const updateCourse = useUpdateCourse();
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  const isLoading = authLoading || adminLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <div className="cyber-grid absolute inset-0" />
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="glass-card p-8 relative z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }} />
            <p className="text-muted-foreground mt-4">Loading admin dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not authenticated or not admin - redirect
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const togglePublish = async (courseId: string, currentlyPublished: boolean) => {
    try {
      await updateCourse.mutateAsync({
        courseId,
        updates: { is_published: !currentlyPublished },
      });
      toast({ title: currentlyPublished ? 'Course unpublished' : 'Course published!' });
    } catch (error: any) {
      toast({
        title: 'Failed to update',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);

  const handleManageCourse = (courseId: string, tab: string) => {
    setSelectedCourseId(courseId);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      <div className="cyber-grid absolute inset-0" />
      <Header />

      <main className="flex-1 py-8 relative">
        {/* Animated glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
              <Shield className="h-8 w-8 text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold neon-text">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage courses, lessons, and content</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <div className="glass-card border-primary/30 p-6 hover:border-primary/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.3)] group-hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)] transition-all">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{courses?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </div>
            <div className="glass-card border-success/30 p-6 hover:border-success/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/20 shadow-[0_0_15px_hsl(var(--success)/0.3)] group-hover:shadow-[0_0_25px_hsl(var(--success)/0.5)] transition-all">
                  <Eye className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {courses?.filter(c => c.is_published).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </div>
            </div>
            <div className="glass-card border-info/30 p-6 hover:border-info/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-info/20 shadow-[0_0_15px_hsl(var(--info)/0.3)] group-hover:shadow-[0_0_25px_hsl(var(--info)/0.5)] transition-all">
                  <Users className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">—</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </div>
            <div className="glass-card border-warning/30 p-6 hover:border-warning/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/20 shadow-[0_0_15px_hsl(var(--warning)/0.3)] group-hover:shadow-[0_0_25px_hsl(var(--warning)/0.5)] transition-all">
                  <DollarSign className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">—</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-background/50 border border-primary/30 backdrop-blur-md">
              <TabsTrigger 
                value="courses"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
              >
                Courses
              </TabsTrigger>
              <TabsTrigger 
                value="lessons" 
                disabled={!selectedCourseId}
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
              >
                Lessons {selectedCourse && `(${selectedCourse.title})`}
              </TabsTrigger>
              <TabsTrigger 
                value="textbook" 
                disabled={!selectedCourseId}
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
              >
                <BookText className="h-4 w-4 mr-2" />
                Textbook
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-4">
              {/* Seed Curriculum Button */}
              <SeedCurriculumButton />

              {/* Create Course Button / Form */}
              {!isCreatingCourse ? (
                <div className="flex justify-end">
                  <Button variant="neon" onClick={() => setIsCreatingCourse(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                  </Button>
                </div>
              ) : (
                <CourseEditor onClose={() => setIsCreatingCourse(false)} />
              )}

              {coursesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }} />
                </div>
              ) : (
                <div className="grid gap-4">
                  {courses?.length === 0 ? (
                    <div className="glass-card border-primary/30 py-12 text-center">
                      <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                        <BookOpen className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-medium mb-2 neon-text">No courses yet</h4>
                      <p className="text-muted-foreground mb-4">
                        Create your first course to get started.
                      </p>
                      <Button variant="neon" onClick={() => setIsCreatingCourse(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Course
                      </Button>
                    </div>
                  ) : (
                    courses?.map((course) => (
                      <div 
                        key={course.id} 
                        className="glass-card border-primary/20 hover:border-primary/40 transition-all group"
                      >
                        <div className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{course.title}</h3>
                                <Badge 
                                  variant={course.is_published ? 'default' : 'secondary'}
                                  className={
                                    course.is_published 
                                      ? 'bg-success/20 text-success border-success/30' 
                                      : 'bg-muted/50 text-muted-foreground border-muted-foreground/30'
                                  }
                                >
                                  {course.is_published ? 'Published' : 'Draft'}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="border-secondary/50 text-secondary"
                                >
                                  {course.phase}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {course.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => togglePublish(course.id, course.is_published)}
                                disabled={updateCourse.isPending}
                                className={
                                  course.is_published 
                                    ? 'border-warning/50 hover:border-warning hover:bg-warning/10 hover:text-warning' 
                                    : 'border-success/50 hover:border-success hover:bg-success/10 hover:text-success'
                                }
                              >
                                {course.is_published ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Publish
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManageCourse(course.id, 'lessons')}
                                className="border-primary/50 hover:border-primary hover:bg-primary/10 hover:text-primary"
                              >
                                Lessons
                              </Button>
                              <Button
                                variant="neon"
                                size="sm"
                                onClick={() => handleManageCourse(course.id, 'textbook')}
                              >
                                <BookText className="mr-2 h-4 w-4" />
                                Textbook
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="lessons">
              {selectedCourseId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold neon-text">{selectedCourse?.title}</h2>
                      <p className="text-sm text-muted-foreground">{selectedCourse?.description}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedCourseId(null);
                        setActiveTab('courses');
                      }}
                      className="border-primary/50 hover:border-primary hover:bg-primary/10 hover:text-primary"
                    >
                      Back to Courses
                    </Button>
                  </div>
                  <LessonList courseId={selectedCourseId} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="textbook">
              {selectedCourseId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold neon-text">{selectedCourse?.title} - Textbook</h2>
                      <p className="text-sm text-muted-foreground">Manage interactive textbook content</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedCourseId(null);
                        setActiveTab('courses');
                      }}
                      className="border-primary/50 hover:border-primary hover:bg-primary/10 hover:text-primary"
                    >
                      Back to Courses
                    </Button>
                  </div>
                  <TextbookEditor courseId={selectedCourseId} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
