import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LessonList } from '@/components/admin/LessonList';
import { CourseEditor } from '@/components/admin/CourseEditor';
import { TextbookEditor } from '@/components/admin/TextbookEditor';
import { SeedCurriculumButton } from '@/components/admin/SeedCurriculumButton';
import { BulkGenerateButton } from '@/components/admin/BulkGenerateButton';
import { BulkGenerateTextbooksButton } from '@/components/admin/BulkGenerateTextbooksButton';
import { BulkGenerateSupplementalButton } from '@/components/admin/BulkGenerateSupplementalButton';
import { QuickGenerateDialog } from '@/components/admin/QuickGenerateDialog';
import { useAdminCourses, useUpdateCourse } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  BookOpen, 
  Eye, 
  EyeOff,
  Users,
  DollarSign,
  Plus,
  BookText,
  Sparkles,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function AdminDashboard() {
  const { data: courses, isLoading: coursesLoading } = useAdminCourses();
  const updateCourse = useUpdateCourse();
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  // Fetch real student count (unique users with purchases or progress)
  const { data: studentCount } = useQuery({
    queryKey: ['admin-student-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Fetch real revenue (sum of purchases)
  const { data: totalRevenue } = useQuery({
    queryKey: ['admin-total-revenue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('purchases')
        .select('amount_cents');
      if (!data) return 0;
      return data.reduce((sum, p) => sum + p.amount_cents, 0);
    },
  });

  if (coursesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
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
    <div className="p-4 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
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
              <p className="text-2xl font-bold text-foreground">{studentCount ?? '—'}</p>
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
              <p className="text-2xl font-bold text-foreground">
                {totalRevenue != null 
                  ? (totalRevenue / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) 
                  : '—'}
              </p>
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
          {/* Quick Access Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Analytics Dashboard Link */}
            <Card className="border-2 border-dashed border-warning/40 bg-warning/5 hover:border-warning/60 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/20">
                      <DollarSign className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Analytics</h3>
                      <p className="text-sm text-muted-foreground">
                        Revenue & engagement metrics
                      </p>
                    </div>
                  </div>
                  <Button asChild className="bg-warning/20 text-warning border-warning/30 hover:bg-warning/30">
                    <Link to="/admin/analytics">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Open
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Content Generator Link */}
            <Card className="border-2 border-dashed border-primary/40 bg-primary/5 hover:border-primary/60 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">AI Generator</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate content with AI
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="neon">
                    <Link to="/admin/content-generator">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Open
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gradebook Link */}
            <Card className="border-2 border-dashed border-info/40 bg-info/5 hover:border-info/60 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-info/20">
                      <GraduationCap className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Gradebook</h3>
                      <p className="text-sm text-muted-foreground">
                        Student progress & scores
                      </p>
                    </div>
                  </div>
                  <Button asChild className="bg-info/20 text-info border-info/30 hover:bg-info/30">
                    <Link to="/admin/gradebook">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Open
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seed Curriculum Button */}
          <SeedCurriculumButton />
          <BulkGenerateButton />
          <BulkGenerateTextbooksButton />
          <BulkGenerateSupplementalButton />

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
              <NeonSpinner size="lg" />
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
                    <div className="p-4 min-w-0">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
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

                        <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-full">
                          <QuickGenerateDialog
                            courseId={course.id}
                            courseTitle={course.title}
                            courseDescription={course.description}
                          />
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
                            title="Manage Textbook"
                          >
                            <BookText className="h-4 w-4" />
                            <span className="hidden xl:inline ml-2">Textbook</span>
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
              {/* Breadcrumb + Back button */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setSelectedCourseId(null);
                    setActiveTab('courses');
                  }}
                  className="hover:bg-primary/10 hover:text-primary shrink-0"
                  title="Back to Courses"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <CourseBreadcrumb
                  segments={[
                    { label: 'Admin', href: '/admin' },
                    { label: selectedCourse?.title || 'Course' },
                    { label: 'Lessons' },
                  ]}
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold neon-text">{selectedCourse?.title}</h2>
                <p className="text-sm text-muted-foreground">{selectedCourse?.description}</p>
              </div>
              <LessonList courseId={selectedCourseId} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="textbook">
          {selectedCourseId && (
            <div className="space-y-4">
              {/* Breadcrumb + Back button */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setSelectedCourseId(null);
                    setActiveTab('courses');
                  }}
                  className="hover:bg-primary/10 hover:text-primary shrink-0"
                  title="Back to Courses"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <CourseBreadcrumb
                  segments={[
                    { label: 'Admin', href: '/admin' },
                    { label: selectedCourse?.title || 'Course' },
                    { label: 'Textbook' },
                  ]}
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold neon-text">{selectedCourse?.title} - Textbook</h2>
                <p className="text-sm text-muted-foreground">Manage interactive textbook content</p>
              </div>
              <TextbookEditor courseId={selectedCourseId} courseTitle={selectedCourse?.title} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}