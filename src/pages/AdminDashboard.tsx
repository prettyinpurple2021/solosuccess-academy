import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LessonList } from '@/components/admin/LessonList';
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
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(user?.id);
  const { data: courses, isLoading: coursesLoading } = useAdminCourses();
  const updateCourse = useUpdateCourse();
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const isLoading = authLoading || adminLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage courses, lessons, and content</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{courses?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Eye className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {courses?.filter(c => c.is_published).length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">—</p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <DollarSign className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">—</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="lessons" disabled={!selectedCourseId}>
                Lessons {selectedCourse && `(${selectedCourse.title})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-4">
              {coursesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {courses?.map((course) => (
                    <Card key={course.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{course.title}</h3>
                              <Badge variant={course.is_published ? 'default' : 'secondary'}>
                                {course.is_published ? 'Published' : 'Draft'}
                              </Badge>
                              <Badge variant="outline">{course.phase}</Badge>
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
                              variant="default"
                              size="sm"
                              onClick={() => setSelectedCourseId(course.id)}
                            >
                              Manage Lessons
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="lessons">
              {selectedCourseId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedCourse?.title}</h2>
                      <p className="text-sm text-muted-foreground">{selectedCourse?.description}</p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedCourseId(null)}>
                      Back to Courses
                    </Button>
                  </div>
                  <LessonList courseId={selectedCourseId} />
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
