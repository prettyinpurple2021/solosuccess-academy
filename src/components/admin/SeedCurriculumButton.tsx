import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { curriculumCourses, curriculumStats } from '@/lib/curriculumData';
import { Database, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface SeedProgress {
  currentCourse: string;
  completedCourses: number;
  totalCourses: number;
  totalLessonsInserted: number;
}

export function SeedCurriculumButton() {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState<SeedProgress | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const seedCurriculum = async () => {
    setIsSeeding(true);
    setResult(null);
    setProgress({
      currentCourse: '',
      completedCourses: 0,
      totalCourses: curriculumCourses.length,
      totalLessonsInserted: 0,
    });

    try {
      let totalLessonsInserted = 0;

      for (let i = 0; i < curriculumCourses.length; i++) {
        const course = curriculumCourses[i];
        
        setProgress({
          currentCourse: course.title,
          completedCourses: i,
          totalCourses: curriculumCourses.length,
          totalLessonsInserted,
        });

        // Check if course already has lessons
        const { data: existingLessons, error: checkError } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', course.courseId);

        if (checkError) {
          throw new Error(`Failed to check existing lessons for ${course.title}: ${checkError.message}`);
        }

        // Skip if course already has lessons
        if (existingLessons && existingLessons.length > 0) {
          console.log(`Skipping ${course.title} - already has ${existingLessons.length} lessons`);
          continue;
        }

        // Prepare lessons for bulk insert
        const lessonsToInsert = course.lessons.map((lesson, index) => ({
          course_id: course.courseId,
          title: lesson.title,
          type: lesson.type,
          content: lesson.content,
          order_number: index + 1,
          is_published: true,
          duration_minutes: lesson.type === 'text' ? 15 : lesson.type === 'quiz' ? 20 : 30,
        }));

        // Bulk insert lessons for this course
        const { error: insertError } = await supabase
          .from('lessons')
          .insert(lessonsToInsert);

        if (insertError) {
          throw new Error(`Failed to insert lessons for ${course.title}: ${insertError.message}`);
        }

        totalLessonsInserted += lessonsToInsert.length;
      }

      setProgress({
        currentCourse: 'Complete!',
        completedCourses: curriculumCourses.length,
        totalCourses: curriculumCourses.length,
        totalLessonsInserted,
      });

      setResult({
        success: true,
        message: `Successfully seeded ${totalLessonsInserted} lessons across ${curriculumCourses.length} courses!`,
      });

      toast({
        title: 'Curriculum seeded successfully!',
        description: `${totalLessonsInserted} lessons have been created.`,
      });

    } catch (error: any) {
      console.error('Seed error:', error);
      setResult({
        success: false,
        message: error.message || 'An unexpected error occurred',
      });
      toast({
        title: 'Seeding failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const progressPercent = progress
    ? (progress.completedCourses / progress.totalCourses) * 100
    : 0;

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Seed Curriculum Data</CardTitle>
        </div>
        <CardDescription>
          Bulk insert all {curriculumStats.totalLessons} lessons across {curriculumStats.totalCourses} courses.
          Courses that already have lessons will be skipped.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Preview */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            <span className="text-muted-foreground mr-1">Text:</span> {curriculumStats.byType.text}
          </Badge>
          <Badge variant="outline">
            <span className="text-muted-foreground mr-1">Quiz:</span> {curriculumStats.byType.quiz}
          </Badge>
          <Badge variant="outline">
            <span className="text-muted-foreground mr-1">Assignment:</span> {curriculumStats.byType.assignment}
          </Badge>
          <Badge variant="outline">
            <span className="text-muted-foreground mr-1">Activity:</span> {curriculumStats.byType.activity}
          </Badge>
        </div>

        {/* Progress Display */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {progress.currentCourse}
              </span>
              <span className="font-medium">
                {progress.completedCourses}/{progress.totalCourses} courses
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.totalLessonsInserted} lessons inserted
            </p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            result.success ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
          }`}>
            {result.success ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{result.message}</span>
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={seedCurriculum} 
          disabled={isSeeding}
          className="w-full"
          size="lg"
        >
          {isSeeding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Seeding Curriculum...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Seed All Lessons
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
