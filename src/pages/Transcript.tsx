/**
 * @file Transcript.tsx — Student Transcript Page
 * 
 * Protected route showing per-course grades, completion %, and certificates.
 * Now uses useStudentGrades for accurate weighted grades instead of dummy
 * completion-based grades.
 */
import { useMemo } from 'react';
import { GraduationCap, Award, BookOpen, TrendingUp, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageMeta } from '@/components/layout/PageMeta';
import { useAuth } from '@/hooks/useAuth';
import { useUserCertificates } from '@/hooks/useCertificates';
import { useStudentGrades } from '@/hooks/useStudentGrades';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { cn } from '@/lib/utils';

/** Map letter grade to a Tailwind color class */
function gradeColor(letter: string) {
  if (letter.startsWith('A')) return 'text-green-400';
  if (letter.startsWith('B')) return 'text-blue-400';
  if (letter.startsWith('C')) return 'text-yellow-400';
  if (letter.startsWith('D')) return 'text-orange-400';
  if (letter === 'F') return 'text-destructive';
  return 'text-muted-foreground';
}

export default function Transcript() {
  const { user } = useAuth();
  const { data: grades, isLoading: loadingGrades } = useStudentGrades(user?.id);
  const { data: certificates, isLoading: loadingCerts } = useUserCertificates(user?.id);

  const isLoading = loadingGrades || loadingCerts;

  /* Build transcript rows from real grade data */
  const transcriptRows = useMemo(() => {
    if (!grades) return [];
    return grades.map(g => ({
      ...g,
      hasCertificate: !!certificates?.find(c => c.course_id === g.courseId),
      certificateCode: certificates?.find(c => c.course_id === g.courseId)?.verification_code || null,
    }));
  }, [grades, certificates]);

  /* Calculate overall GPA from real weighted grades */
  const overallGPA = useMemo(() => {
    const gradePoints: Record<string, number> = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0,
    };
    const validRows = transcriptRows.filter(r => r.combinedGrade.letter !== '—');
    if (validRows.length === 0) return null;
    const totalPoints = validRows.reduce((sum, r) => sum + (gradePoints[r.combinedGrade.letter] ?? 0), 0);
    return (totalPoints / validRows.length).toFixed(2);
  }, [transcriptRows]);

  const totalLessons = grades?.reduce((s, g) => s + g.totalLessons, 0) ?? 0;
  const completedLessons = grades?.reduce((s, g) => s + g.completedLessons, 0) ?? 0;

  const phaseLabel = (phase: string) => {
    if (phase === 'initialization') return 'Phase 1';
    if (phase === 'orchestration') return 'Phase 2';
    if (phase === 'launch') return 'Phase 3';
    return phase;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Transcript — SoloSuccess Academy" description="View your academic transcript and grades." />

      <div className="container max-w-4xl py-8 md:py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
              <GraduationCap className="h-7 w-7 text-primary" />
              Student Transcript
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Your complete academic record</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/30 print:hidden"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Transcript
          </Button>
        </div>

        {/* GPA Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-display font-bold text-gradient">
                {overallGPA ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-1">Overall GPA</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-3xl font-display font-bold">
                {completedLessons}
                <span className="text-lg text-muted-foreground">/{totalLessons}</span>
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-1">Lessons Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-3xl font-display font-bold">{certificates?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">Certificates Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Course Rows */}
        {transcriptRows.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No enrolled courses yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Purchase a course to see your transcript here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {transcriptRows.map(row => (
              <Card
                key={row.courseId}
                className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] border-primary/30 font-mono">
                          {phaseLabel(row.phase)}
                        </Badge>
                        {row.hasCertificate && (
                          <Badge className="bg-accent/20 text-accent border-accent/30 text-[10px]">
                            <Award className="h-3 w-3 mr-1" />
                            Certified
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm truncate">{row.courseTitle}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>{row.completedLessons}/{row.totalLessons} lessons</span>
                          <span>{row.completionPercent}%</span>
                        </div>
                        <Progress value={row.completionPercent} className="h-1.5" />
                      </div>
                    </div>

                    {/* Grade */}
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                      <p className={cn('text-3xl font-display font-bold', gradeColor(row.combinedGrade.letter))}>
                        {row.combinedGrade.letter}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{row.combinedGrade.percentage}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
