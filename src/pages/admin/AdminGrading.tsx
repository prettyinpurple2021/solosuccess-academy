/**
 * @file AdminGrading.tsx — Unified admin grading dashboard (/admin/grading)
 *
 * Three-pane layout:
 *   1. Students     — everyone enrolled, sorted by how much work is waiting.
 *   2. Submissions  — that student's work across assignments, quizzes,
 *                     activities, worksheets, practice labs, milestones,
 *                     the capstone project, the final essay and the exam.
 *   3. Grading form — score 0–100 + a written comment, saved to the
 *                     trigger-protected grading columns.
 *
 * On mobile the panes stack, so a phone can still grade one item at a time.
 */
import { useMemo, useState, useEffect } from 'react';
import { Helmet } from '@/lib/helmet-compat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { useToast } from '@/hooks/use-toast';
import {
  useGradingStudents,
  useStudentSubmissions,
  useGradeSubmission,
  KIND_LABELS,
  type GradingItem,
  type GradingKind,
} from '@/hooks/useAdminGrading';
import { ClipboardCheck, Lock, Paperclip, Search, ShieldCheck } from 'lucide-react';

/** Colour-code each submission kind so the list is scannable. */
const KIND_STYLES: Record<GradingKind, string> = {
  assignment: 'bg-primary/20 text-primary border-primary/30',
  quiz: 'bg-info/20 text-info border-info/30',
  activity: 'bg-accent/20 text-accent border-accent/30',
  worksheet: 'bg-secondary/20 text-secondary border-secondary/30',
  practice: 'bg-success/20 text-success border-success/30',
  milestone: 'bg-warning/20 text-warning border-warning/30',
  project: 'bg-accent/20 text-accent border-accent/30',
  essay: 'bg-secondary/20 text-secondary border-secondary/30',
  exam: 'bg-muted text-muted-foreground border-border',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Right-hand grading form for the selected submission. */
function GradingPanel({ item, studentName }: { item: GradingItem; studentName: string }) {
  const { toast } = useToast();
  const gradeSubmission = useGradeSubmission();

  // Seed the form from whatever is already stored, falling back to the
  // machine score so the admin can accept or adjust it.
  const [score, setScore] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [projectStatus, setProjectStatus] = useState<'approved' | 'needs_revision' | 'pending'>(
    'approved',
  );

  // Reset the form whenever a different submission is selected.
  useEffect(() => {
    setScore(item.adminScore !== null ? String(item.adminScore) : item.autoScore !== null ? String(item.autoScore) : '');
    setComment(item.adminComment ?? '');
    setProjectStatus(
      item.statusLabel === 'needs_revision'
        ? 'needs_revision'
        : item.statusLabel === 'pending'
          ? 'pending'
          : 'approved',
    );
  }, [item.id, item.adminScore, item.autoScore, item.adminComment, item.statusLabel]);

  const handleSave = async () => {
    const numeric = Number(score);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
      toast({
        title: 'Score out of range',
        description: 'Enter a whole number between 0 and 100.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await gradeSubmission.mutateAsync({
        item,
        score: Math.round(numeric),
        comment: comment.trim(),
        projectStatus: item.kind === 'project' ? projectStatus : undefined,
      });
      toast({
        title: 'Grade saved',
        description: `${studentName} — ${item.title}: ${Math.round(numeric)}/100`,
      });
    } catch (error) {
      toast({
        title: "Couldn't save the grade",
        description:
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="glass-card border-primary/20 p-5 md:p-6 space-y-5">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold neon-text">{item.title}</h2>
            <p className="text-sm text-muted-foreground">
              {studentName} · {item.courseTitle}
            </p>
          </div>
          <Badge variant="outline" className={KIND_STYLES[item.kind]}>
            {KIND_LABELS[item.kind]}
          </Badge>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Submitted</dt>
            <dd className="font-medium">{formatDate(item.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Auto score</dt>
            <dd className="font-medium">{item.autoScore !== null ? `${item.autoScore}/100` : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Your score</dt>
            <dd className="font-medium">
              {item.adminScore !== null ? `${item.adminScore}/100` : 'Not graded'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last graded</dt>
            <dd className="font-medium">{formatDate(item.gradedAt)}</dd>
          </div>
        </dl>
      </header>

      {/* The student's actual work */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Submission
        </h3>
        {item.content ? (
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-primary/10 bg-background/40 p-4 text-sm font-sans">
            {item.content}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No written submission stored for this item.
          </p>
        )}
        {item.fileUrls.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-1">
            {item.fileUrls.map((url, index) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 px-2.5 py-1 text-xs hover:bg-primary/10"
                >
                  <Paperclip className="h-3 w-3" /> Attachment {index + 1}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Grading controls, or an explanation when the item is auto-graded */}
      {item.readOnly ? (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            Final exams are graded automatically by the platform to protect answer keys, so they
            can&apos;t be overridden here. Score:{' '}
            <strong className="text-foreground">
              {item.autoScore !== null ? `${item.autoScore}/100` : '—'}
            </strong>{' '}
            ({item.statusLabel}).
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="grade-score">Score (0–100)</Label>
              <Input
                id="grade-score"
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                placeholder="0"
              />
            </div>
            {item.kind === 'project' && (
              <div className="space-y-1.5">
                <Label htmlFor="grade-status">Decision</Label>
                <Select
                  value={projectStatus}
                  onValueChange={(value) =>
                    setProjectStatus(value as 'approved' | 'needs_revision' | 'pending')
                  }
                >
                  <SelectTrigger id="grade-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="needs_revision">Needs revision</SelectItem>
                    <SelectItem value="pending">Keep pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grade-comment">Comment to the student</Label>
            <Textarea
              id="grade-comment"
              rows={5}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What they did well, and the one thing to improve next time…"
            />
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Scores and comments are write-protected in the database — only admins can set them.
            </p>
            <Button onClick={handleSave} disabled={gradeSubmission.isPending}>
              {gradeSubmission.isPending ? 'Saving…' : 'Save grade'}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function AdminGrading() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [studentQuery, setStudentQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | GradingKind>('all');
  const [onlyUngraded, setOnlyUngraded] = useState(false);

  const { data: students = [], isLoading: studentsLoading } = useGradingStudents();
  const { data: submissions = [], isLoading: submissionsLoading } =
    useStudentSubmissions(selectedStudent);

  // Auto-select the first student so the page is never empty on arrival.
  useEffect(() => {
    if (!selectedStudent && students.length > 0) {
      setSelectedStudent(students[0]!.userId);
    }
  }, [students, selectedStudent]);

  const visibleStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => student.displayName.toLowerCase().includes(query));
  }, [students, studentQuery]);

  const visibleSubmissions = useMemo(
    () =>
      submissions.filter((item) => {
        if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
        if (onlyUngraded && (item.adminScore !== null || item.readOnly)) return false;
        return true;
      }),
    [submissions, kindFilter, onlyUngraded],
  );

  const selectedItem =
    visibleSubmissions.find((item) => item.id === selectedItemId) ?? visibleSubmissions[0] ?? null;

  const activeStudentName =
    students.find((student) => student.userId === selectedStudent)?.displayName ?? 'Student';

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Helmet>
        <title>Grading Dashboard — Admin</title>
        <meta
          name="description"
          content="Review every student submission, assign scores and write feedback in one place."
        />
      </Helmet>

      <header>
        <h1 className="text-2xl font-bold neon-text flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" /> Grading Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Every submission a student has made, in one place — score it and leave a comment.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_minmax(280px,340px)_1fr]">
        {/* ── Pane 1: students ── */}
        <section aria-label="Students" className="glass-card border-primary/20 overflow-hidden">
          <div className="p-3 border-b border-primary/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={studentQuery}
                onChange={(event) => setStudentQuery(event.target.value)}
                placeholder="Find a student"
                className="pl-8"
                aria-label="Search students"
              />
            </div>
          </div>
          <ul className="max-h-[30vh] xl:max-h-[70vh] overflow-y-auto">
            {studentsLoading ? (
              <li className="p-6 flex justify-center">
                <NeonSpinner size="sm" />
              </li>
            ) : visibleStudents.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted-foreground">No students found.</li>
            ) : (
              visibleStudents.map((student) => (
                <li key={student.userId}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(student.userId);
                      setSelectedItemId(null);
                    }}
                    className={`flex w-full items-center gap-3 border-b border-primary/10 p-3 text-left transition-colors hover:bg-primary/5 ${
                      selectedStudent === student.userId
                        ? 'bg-primary/10 border-l-2 border-l-primary'
                        : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      {student.avatarUrl && <AvatarImage src={student.avatarUrl} alt="" />}
                      <AvatarFallback>{student.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {student.displayName}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {student.totalCount} submission{student.totalCount === 1 ? '' : 's'}
                      </span>
                    </span>
                    {student.ungradedCount > 0 && (
                      <Badge className="bg-warning/20 text-warning border-warning/30">
                        {student.ungradedCount}
                      </Badge>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* ── Pane 2: that student's submissions ── */}
        <section aria-label="Submissions" className="glass-card border-primary/20 overflow-hidden">
          <div className="space-y-2 border-b border-primary/10 p-3">
            <Select value={kindFilter} onValueChange={(value) => setKindFilter(value as typeof kindFilter)}>
              <SelectTrigger aria-label="Filter by submission type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All submission types</SelectItem>
                {(Object.keys(KIND_LABELS) as GradingKind[]).map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={onlyUngraded ? 'default' : 'outline'}
              size="sm"
              className="w-full"
              aria-pressed={onlyUngraded}
              onClick={() => setOnlyUngraded((value) => !value)}
            >
              {onlyUngraded ? 'Showing ungraded only' : 'Show ungraded only'}
            </Button>
          </div>
          <ul className="max-h-[40vh] xl:max-h-[62vh] overflow-y-auto">
            {submissionsLoading ? (
              <li className="p-6 flex justify-center">
                <NeonSpinner size="sm" />
              </li>
            ) : visibleSubmissions.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted-foreground">
                Nothing to review with these filters.
              </li>
            ) : (
              visibleSubmissions.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full border-b border-primary/10 p-3 text-left transition-colors hover:bg-primary/5 ${
                      selectedItem?.id === item.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{item.title}</span>
                      <Badge variant="outline" className={`${KIND_STYLES[item.kind]} shrink-0`}>
                        {KIND_LABELS[item.kind]}
                      </Badge>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{item.courseTitle}</div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(item.submittedAt)}</span>
                      <span className={item.adminScore !== null ? 'text-success' : ''}>
                        {item.adminScore !== null
                          ? `${item.adminScore}/100`
                          : item.autoScore !== null
                            ? `auto ${item.autoScore}`
                            : 'ungraded'}
                      </span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* ── Pane 3: grading form ── */}
        <div>
          {selectedItem ? (
            <GradingPanel item={selectedItem} studentName={activeStudentName} />
          ) : (
            <div className="glass-card border-primary/20 p-12 text-center text-muted-foreground">
              Select a submission to review and grade.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
