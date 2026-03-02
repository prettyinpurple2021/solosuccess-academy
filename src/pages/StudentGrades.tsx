/**
 * @file StudentGrades.tsx — Detailed Grade Breakdown Page
 * 
 * Shows students their per-course grades with weighted component breakdown:
 * quizzes, activities, worksheets, final exam, and final essay scores.
 * Uses the same calculateCombinedGrade logic as the admin gradebook.
 */
import { GraduationCap, BookOpen, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageMeta } from '@/components/layout/PageMeta';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useStudentGrades } from '@/hooks/useStudentGrades';
import { useGradeSettings, getWeightsForCourse } from '@/hooks/useGradeSettings';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { cn } from '@/lib/utils';

/** Map letter grade to a semantic Tailwind color class */
function gradeColor(letter: string) {
  if (letter.startsWith('A')) return 'text-green-400';
  if (letter.startsWith('B')) return 'text-blue-400';
  if (letter.startsWith('C')) return 'text-yellow-400';
  if (letter.startsWith('D')) return 'text-orange-400';
  if (letter === 'F') return 'text-destructive';
  return 'text-muted-foreground';
}

/** Render a single score cell with label */
function ScoreCell({ label, value, count }: { label: string; value: number | null; count: number }) {
  const display = count > 0 ? `${value ?? 0}%` : '—';
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground font-mono mb-1">{label}</p>
      <p className={cn('text-sm font-medium', count > 0 ? 'text-foreground' : 'text-muted-foreground/50')}>
        {display}
      </p>
    </div>
  );
}

export default function StudentGrades() {
  const { user } = useAuth();
  const { data: grades, isLoading } = useStudentGrades(user?.id);
  const { data: gradeSettings } = useGradeSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="My Grades — SoloSuccess Academy" description="View your detailed grade breakdown." />

      <div className="container max-w-4xl py-8 md:py-12 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-primary" />
            My Grades
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Detailed breakdown of your scores across all components
          </p>
        </div>

        {/* Weight explanation */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardContent className="p-4 flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your final grade is calculated using weighted averages. Weights may vary by course. 
              Components you haven't attempted yet are excluded and their weight is redistributed.
            </p>
          </CardContent>
        </Card>

        {/* Course grade cards */}
        {!grades?.length ? (
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No courses enrolled yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {grades.map(g => {
              const weights = getWeightsForCourse(gradeSettings, g.courseId);
              return (
                <Card key={g.courseId} className="bg-card/50 backdrop-blur-sm border-primary/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className="text-[10px] border-primary/30 font-mono mb-1">
                          {g.phase === 'initialization' ? 'Phase 1' : g.phase === 'orchestration' ? 'Phase 2' : 'Phase 3'}
                        </Badge>
                        <CardTitle className="text-base">{g.courseTitle}</CardTitle>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-3xl font-display font-bold', gradeColor(g.combinedGrade.letter))}>
                          {g.combinedGrade.letter}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{g.combinedGrade.percentage}%</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Score breakdown row */}
                    <div className="grid grid-cols-5 gap-2 p-3 rounded-lg bg-background/50 border border-primary/10">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <ScoreCell label={`Quiz (${weights.quizWeight}%)`} value={g.quizAvg} count={g.quizCount} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{g.quizCount} quiz{g.quizCount !== 1 ? 'zes' : ''} scored</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <ScoreCell label={`Activity (${weights.activityWeight}%)`} value={g.activityAvg} count={g.activityCount} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{g.activityCount} activit{g.activityCount !== 1 ? 'ies' : 'y'} scored</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <ScoreCell label={`Worksheet (${weights.worksheetWeight}%)`} value={g.worksheetAvg} count={g.worksheetCount} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{g.worksheetCount} worksheet{g.worksheetCount !== 1 ? 's' : ''} scored</TooltipContent>
                      </Tooltip>
                      <ScoreCell label={`Exam (${weights.examWeight}%)`} value={g.examScore} count={g.examScore !== null ? 1 : 0} />
                      <ScoreCell label={`Essay (${weights.essayWeight}%)`} value={g.essayScore} count={g.essayScore !== null ? 1 : 0} />
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{g.completedLessons}/{g.totalLessons} lessons completed</span>
                        <span>{g.completionPercent}%</span>
                      </div>
                      <Progress value={g.completionPercent} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
