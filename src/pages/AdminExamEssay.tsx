/**
 * AdminExamEssay – Admin page combining the Final Exam Generator,
 * Final Essay Generator, and a Bulk Generate All button.
 * 
 * WHY: Centralises the generation of end-of-course assessments
 * (mixed-format exams and AI-graded essays) in one place.
 */
import { useState, useCallback } from 'react';
import { useAdminCourses } from '@/hooks/useAdmin';
import { FinalExamGenerator } from '@/components/admin/FinalExamGenerator';
import { FinalEssayGenerator } from '@/components/admin/FinalEssayGenerator';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

// Represents the status of a single generation job
interface JobStatus {
  courseId: string;
  courseTitle: string;
  examStatus: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  essayStatus: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  examError?: string;
  essayError?: string;
}

export default function AdminExamEssay() {
  const { data: courses, isLoading } = useAdminCourses();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Bulk generation state
  const [bulkRunning, setBulkRunning] = useState(false);
  const [jobs, setJobs] = useState<JobStatus[]>([]);

  // Map courses to the shape expected by the generators
  const courseList = (courses || []).map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
  }));

  /**
   * Runs the bulk-generate-assessments edge function for each course
   * sequentially (one exam + one essay per course) to avoid timeouts.
   */
  const handleBulkGenerate = useCallback(async () => {
    if (!courseList.length) return;
    setBulkRunning(true);

    // Initialize job statuses
    const initialJobs: JobStatus[] = courseList.map(c => ({
      courseId: c.id,
      courseTitle: c.title,
      examStatus: 'pending',
      essayStatus: 'pending',
    }));
    setJobs(initialJobs);

    // Check which already exist so we can skip them
    const { data: existingExams } = await supabase
      .from('course_final_exams' as any)
      .select('course_id');
    const { data: existingEssays } = await supabase
      .from('course_essays' as any)
      .select('course_id');

    const examIds = new Set((existingExams || []).map((e: any) => e.course_id));
    const essayIds = new Set((existingEssays || []).map((e: any) => e.course_id));

    // Mark already-existing ones as skipped
    setJobs(prev => prev.map(j => ({
      ...j,
      examStatus: examIds.has(j.courseId) ? 'skipped' : 'pending',
      essayStatus: essayIds.has(j.courseId) ? 'skipped' : 'pending',
    })));

    let examsDone = 0;
    let essaysDone = 0;
    let errors = 0;

    // Process each course sequentially
    for (let i = 0; i < courseList.length; i++) {
      const course = courseList[i];
      const needExam = !examIds.has(course.id);
      const needEssay = !essayIds.has(course.id);

      // Generate exam if needed
      if (needExam) {
        setJobs(prev => prev.map(j =>
          j.courseId === course.id ? { ...j, examStatus: 'running' } : j
        ));

        try {
          const { data, error } = await supabase.functions.invoke('bulk-generate-assessments', {
            body: { courseId: course.id, type: 'exam' },
          });
          if (error || data?.error) throw new Error(error?.message || data?.error);

          setJobs(prev => prev.map(j =>
            j.courseId === course.id ? { ...j, examStatus: 'done' } : j
          ));
          examsDone++;
        } catch (err: any) {
          setJobs(prev => prev.map(j =>
            j.courseId === course.id ? { ...j, examStatus: 'error', examError: err.message } : j
          ));
          errors++;
        }
      }

      // Generate essay if needed
      if (needEssay) {
        setJobs(prev => prev.map(j =>
          j.courseId === course.id ? { ...j, essayStatus: 'running' } : j
        ));

        try {
          const { data, error } = await supabase.functions.invoke('bulk-generate-assessments', {
            body: { courseId: course.id, type: 'essay' },
          });
          if (error || data?.error) throw new Error(error?.message || data?.error);

          setJobs(prev => prev.map(j =>
            j.courseId === course.id ? { ...j, essayStatus: 'done' } : j
          ));
          essaysDone++;
        } catch (err: any) {
          setJobs(prev => prev.map(j =>
            j.courseId === course.id ? { ...j, essayStatus: 'error', essayError: err.message } : j
          ));
          errors++;
        }
      }
    }

    // Invalidate queries so individual generators refresh
    queryClient.invalidateQueries({ queryKey: ['final-exam'] });
    queryClient.invalidateQueries({ queryKey: ['course-essay'] });

    toast({
      title: 'Bulk generation complete!',
      description: `${examsDone} exams, ${essaysDone} essays created. ${errors} errors.`,
      variant: errors > 0 ? 'destructive' : 'default',
    });

    setBulkRunning(false);
  }, [courseList, queryClient, toast]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  // Helper to render a status icon
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'done': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'skipped': return <Badge variant="outline" className="text-xs px-1.5 py-0">exists</Badge>;
      default: return <span className="h-4 w-4 rounded-full bg-muted-foreground/20 block" />;
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
          <FileText className="h-8 w-8 text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold neon-text">Exam & Essay Generator</h1>
          <p className="text-muted-foreground">
            Create mixed-format final exams and AI-graded essay assignments
          </p>
        </div>
      </div>

      {/* Bulk Generate All Card */}
      <Card className="glass-card border-primary/30 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Zap className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
            Bulk Generate All Assessments
          </CardTitle>
          <CardDescription>
            Generate final exams and essays for all {courseList.length} courses that don't have them yet. Processes one at a time to avoid timeouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleBulkGenerate}
            disabled={bulkRunning || courseList.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            {bulkRunning ? (
              <>
                <NeonSpinner size="sm" />
                Generating... (this takes several minutes)
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Generate All Missing Exams & Essays
              </>
            )}
          </Button>

          {/* Progress tracker */}
          {jobs.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Progress</p>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {jobs.map(j => (
                  <div key={j.courseId} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/10 border border-border/30">
                    <span className="truncate flex-1 font-medium">{j.courseTitle}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground">Exam</span>
                      <StatusIcon status={j.examStatus} />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground">Essay</span>
                      <StatusIcon status={j.essayStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual generators */}
      <div className="grid gap-8 lg:grid-cols-2">
        <FinalExamGenerator courses={courseList} />
        <FinalEssayGenerator courses={courseList} />
      </div>
    </div>
  );
}
