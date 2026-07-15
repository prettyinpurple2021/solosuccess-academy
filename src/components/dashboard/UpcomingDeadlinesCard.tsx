/**
 * @file UpcomingDeadlinesCard.tsx — Learner deadlines & next-up nudges
 *
 * Aggregates two "action items" surfaces for the student home:
 *  1. Capstone projects marked `needs_revision` by an admin (must be resubmitted).
 *  2. The next unfinished lesson per purchased course (soft "keep going" nudge).
 *
 * Data is fetched here (self-contained) so the Dashboard doesn't need to be
 * restructured. Queries reuse cached tanstack-query keys where possible.
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight, CalendarClock, PlayCircle } from 'lucide-react';

interface RevisionRow {
  id: string;
  course_id: string;
  admin_notes: string | null;
  graded_at: string | null;
  courses: { title: string | null } | null;
}

interface NextLessonRow {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  orderNumber: number;
}

export function UpcomingDeadlinesCard() {
  const { user } = useAuth();

  // 1) Projects marked "needs revision" — student must act.
  const { data: revisions } = useQuery({
    queryKey: ['dashboard-needs-revision', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<RevisionRow[]> => {
      const { data, error } = await supabase
        .from('course_projects')
        .select('id, course_id, admin_notes, graded_at, courses(title)')
        .eq('user_id', user!.id)
        .eq('admin_status', 'needs_revision')
        .order('graded_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RevisionRow[];
    },
  });

  // 2) Next unfinished lesson per purchased course.
  const { data: nextLessons } = useQuery({
    queryKey: ['dashboard-next-lessons', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<NextLessonRow[]> => {
      const { data: purchases, error: pErr } = await supabase
        .from('purchases')
        .select('course_id, courses(title)')
        .eq('user_id', user!.id);
      if (pErr) throw pErr;
      const courseIds = (purchases ?? []).map((p) => p.course_id);
      if (courseIds.length === 0) return [];

      const [{ data: lessons, error: lErr }, { data: progress, error: prErr }] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, course_id, title, order_number, is_published')
          .in('course_id', courseIds)
          .eq('is_published', true)
          .order('order_number', { ascending: true }),
        supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user!.id),
      ]);
      if (lErr) throw lErr;
      if (prErr) throw prErr;

      const completed = new Set(
        (progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id),
      );
      const titleByCourse = new Map<string, string>();
      (purchases ?? []).forEach((p) => {
        const t = (p as { courses: { title: string | null } | null }).courses?.title;
        titleByCourse.set(p.course_id, t || 'Course');
      });

      const seen = new Set<string>();
      const result: NextLessonRow[] = [];
      for (const l of lessons ?? []) {
        if (seen.has(l.course_id)) continue;
        if (completed.has(l.id)) continue;
        seen.add(l.course_id);
        result.push({
          courseId: l.course_id,
          courseTitle: titleByCourse.get(l.course_id) || 'Course',
          lessonId: l.id,
          lessonTitle: l.title || `Lesson ${l.order_number ?? ''}`.trim(),
          orderNumber: l.order_number ?? 0,
        });
      }
      return result.slice(0, 5);
    },
  });

  const hasRevisions = (revisions?.length ?? 0) > 0;
  const hasNext = (nextLessons?.length ?? 0) > 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 font-display">
          <CalendarClock className="h-5 w-5 text-primary" />
          <span className="text-gradient">UP NEXT</span>
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          Action items and your next lesson in each course.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revisions — highest priority */}
        {hasRevisions && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Needs revision
            </p>
            {revisions!.map((r) => (
              <Link
                key={r.id}
                to={`/courses/${r.course_id}/project`}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono truncate">
                    {r.courses?.title || 'Capstone project'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    Resubmit your project
                  </p>
                </div>
                <Badge variant="outline" className="border-destructive/40 text-destructive font-mono text-[10px] flex-shrink-0">
                  ACTION
                </Badge>
                <ArrowRight className="h-4 w-4 text-destructive opacity-70 group-hover:opacity-100 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Next lessons per course */}
        {hasNext && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <PlayCircle className="h-3.5 w-3.5" />
              Next lesson
            </p>
            {nextLessons!.map((l) => (
              <Link
                key={l.lessonId}
                to={`/courses/${l.courseId}/lessons/${l.lessonId}`}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border border-transparent hover:border-primary/30 hover:bg-primary/10 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono truncate group-hover:text-primary transition-colors">
                    {l.lessonTitle}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {l.courseTitle}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {!hasRevisions && !hasNext && (
          <p className="text-sm text-muted-foreground font-mono text-center py-4">
            You&apos;re all caught up. 🎯
          </p>
        )}
      </CardContent>
    </Card>
  );
}