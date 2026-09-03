/**
 * @file useAdminGrading.ts — Unified admin grading data layer
 *
 * WHAT THIS DOES
 * Gives the admin one place to review EVERY kind of student submission and
 * write a score + comment back to the database.
 *
 * WHY IT EXISTS
 * Submissions live in six different tables. Before this hook the admin had to
 * hop between the gradebook (quiz/activity overrides), the project queue and
 * the exam/essay page, and practice labs / project milestones had no grading
 * UI at all. This hook flattens all of them into one `GradingItem` shape.
 *
 * SECURITY (important)
 * The score/comment columns on every one of these tables are protected at the
 * DATABASE level by BEFORE INSERT/UPDATE triggers that call
 * `is_privileged_grader()`. A student writing to them is silently ignored.
 * These mutations therefore only succeed for admins — the UI gate is
 * convenience, the trigger + RLS policy is the real boundary.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Every submission type the admin can review. */
export type GradingKind =
  | 'assignment'
  | 'quiz'
  | 'activity'
  | 'worksheet'
  | 'practice'
  | 'milestone'
  | 'project'
  | 'essay'
  | 'exam';

/** Human labels for each kind (used for badges/filters). */
export const KIND_LABELS: Record<GradingKind, string> = {
  assignment: 'Assignment',
  quiz: 'Quiz',
  activity: 'Activity',
  worksheet: 'Worksheet',
  practice: 'Practice Lab',
  milestone: 'Milestone',
  project: 'Course Project',
  essay: 'Final Essay',
  exam: 'Final Exam',
};

/** One reviewable submission, normalised across all source tables. */
export interface GradingItem {
  /** Primary key in the source table (what we update). */
  id: string;
  kind: GradingKind;
  /** Lesson / lab / milestone / course title. */
  title: string;
  courseTitle: string;
  courseId: string | null;
  /** When the student submitted (may be null for auto-tracked progress rows). */
  submittedAt: string | null;
  /** The student's work, if the table stores text. */
  content: string | null;
  /** Any uploaded supporting files (already-signed or public URLs). */
  fileUrls: string[];
  /** Machine/auto score if one exists (quiz %, AI proposed score, exam score). */
  autoScore: number | null;
  /** The admin's score, if already graded. */
  adminScore: number | null;
  /** The admin's written comment, if already graded. */
  adminComment: string | null;
  /** When an admin last graded it. */
  gradedAt: string | null;
  /** Extra status text, e.g. project approval state or exam pass/fail. */
  statusLabel: string | null;
  /** Auto-graded rows (exams) cannot take an admin score. */
  readOnly: boolean;
}

/** A student row for the left-hand picker. */
export interface GradingStudent {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  /** Number of submissions with no admin score yet. */
  ungradedCount: number;
  totalCount: number;
}

const EMPTY: string[] = [];

/** Safely coerce a jsonb/text[] column into a string array. */
function toUrlArray(value: unknown): string[] {
  return Array.isArray(value) ? (value.filter((v) => typeof v === 'string') as string[]) : EMPTY;
}

/**
 * Fetch every submission for one student, across all six tables.
 * Runs the queries in parallel and stitches in course/lesson titles.
 */
async function fetchStudentSubmissions(userId: string): Promise<GradingItem[]> {
  // Reference data (titles) — small tables, cheap to pull whole.
  const [coursesRes, lessonsRes] = await Promise.all([
    supabase.from('courses').select('id, title, order_number').order('order_number'),
    supabase.from('lessons').select('id, course_id, title, type'),
  ]);
  if (coursesRes.error) throw coursesRes.error;
  if (lessonsRes.error) throw lessonsRes.error;

  const courseTitle = new Map((coursesRes.data ?? []).map((c) => [c.id, c.title]));
  const lessonById = new Map((lessonsRes.data ?? []).map((l) => [l.id, l]));

  const [progressRes, practiceRes, milestoneRes, projectRes, essayRes, examRes] = await Promise.all([
    // 1) Lesson-level work: assignments (text in `notes`), quizzes, activities, worksheets
    supabase
      .from('user_progress')
      .select(
        'id, lesson_id, notes, quiz_score, activity_score, worksheet_answers, admin_override_score, admin_notes, graded_at, completed, completed_at',
      )
      .eq('user_id', userId),
    // 2) Practice lab submissions
    supabase
      .from('practice_submissions')
      .select(
        'id, practice_lab_id, submission_content, file_urls, status, score, ai_feedback, admin_score, admin_feedback, graded_at, submitted_at, practice_labs(title, lesson_id)',
      )
      .eq('user_id', userId),
    // 3) Project milestone submissions
    supabase
      .from('project_milestone_submissions')
      .select(
        'id, milestone_id, submission_content, file_urls, status, ai_feedback, admin_score, admin_feedback, graded_at, submitted_at, project_milestones(title, course_id)',
      )
      .eq('user_id', userId),
    // 4) Capstone course projects
    supabase
      .from('course_projects')
      .select(
        'id, course_id, submission_content, file_urls, status, admin_status, admin_score, admin_notes, ai_proposed_score, ai_feedback, graded_at, submitted_at',
      )
      .eq('user_id', userId),
    // 5) Final essays
    supabase
      .from('student_essay_submissions')
      .select(
        'id, essay_id, content, word_count, status, ai_score, ai_feedback, admin_score, admin_feedback, admin_graded_at, submitted_at, course_essays(title, course_id)',
      )
      .eq('user_id', userId),
    // 6) Final exams (auto-graded, review only)
    supabase
      .from('student_exam_attempts')
      .select('id, exam_id, score, passed, submitted_at, course_final_exams(title, course_id)')
      .eq('user_id', userId),
  ]);

  for (const res of [progressRes, practiceRes, milestoneRes, projectRes, essayRes, examRes]) {
    if (res.error) throw res.error;
  }

  const items: GradingItem[] = [];

  // ── 1) user_progress rows → assignment / quiz / activity / worksheet ──
  for (const row of progressRes.data ?? []) {
    const lesson = lessonById.get(row.lesson_id);
    if (!lesson) continue;
    const type = lesson.type as string;
    if (!['assignment', 'quiz', 'activity', 'worksheet'].includes(type)) continue;

    // Only surface rows where the student actually did something.
    const hasWork =
      row.completed ||
      !!row.notes ||
      row.quiz_score !== null ||
      row.activity_score !== null ||
      !!row.worksheet_answers;
    if (!hasWork) continue;

    const auto =
      type === 'quiz'
        ? row.quiz_score
        : type === 'activity'
          ? row.activity_score
          : null;

    items.push({
      id: row.id,
      kind: type as GradingKind,
      title: lesson.title,
      courseTitle: courseTitle.get(lesson.course_id) ?? 'Unknown course',
      courseId: lesson.course_id,
      submittedAt: row.completed_at ?? null,
      content: row.notes ?? (row.worksheet_answers ? JSON.stringify(row.worksheet_answers, null, 2) : null),
      fileUrls: EMPTY,
      autoScore: auto ?? null,
      adminScore: row.admin_override_score ?? null,
      adminComment: row.admin_notes ?? null,
      gradedAt: row.graded_at ?? null,
      statusLabel: row.completed ? 'Completed' : 'In progress',
      readOnly: false,
    });
  }

  // ── 2) Practice labs ──
  for (const row of practiceRes.data ?? []) {
    const lab = row.practice_labs as { title: string; lesson_id: string } | null;
    const lesson = lab ? lessonById.get(lab.lesson_id) : undefined;
    items.push({
      id: row.id,
      kind: 'practice',
      title: lab?.title ?? 'Practice lab',
      courseTitle: lesson ? (courseTitle.get(lesson.course_id) ?? 'Unknown course') : 'Unknown course',
      courseId: lesson?.course_id ?? null,
      submittedAt: row.submitted_at ?? null,
      content: row.submission_content ?? null,
      fileUrls: toUrlArray(row.file_urls),
      autoScore: row.score ?? null,
      adminScore: row.admin_score ?? null,
      adminComment: row.admin_feedback ?? row.ai_feedback ?? null,
      gradedAt: row.graded_at ?? null,
      statusLabel: row.status ?? null,
      readOnly: false,
    });
  }

  // ── 3) Project milestones ──
  for (const row of milestoneRes.data ?? []) {
    const ms = row.project_milestones as { title: string; course_id: string } | null;
    items.push({
      id: row.id,
      kind: 'milestone',
      title: ms?.title ?? 'Project milestone',
      courseTitle: ms ? (courseTitle.get(ms.course_id) ?? 'Unknown course') : 'Unknown course',
      courseId: ms?.course_id ?? null,
      submittedAt: row.submitted_at ?? null,
      content: row.submission_content ?? null,
      fileUrls: toUrlArray(row.file_urls),
      autoScore: null,
      adminScore: row.admin_score ?? null,
      adminComment: row.admin_feedback ?? row.ai_feedback ?? null,
      gradedAt: row.graded_at ?? null,
      statusLabel: row.status ?? null,
      readOnly: false,
    });
  }

  // ── 4) Capstone course projects (graded through a SECURITY DEFINER RPC) ──
  for (const row of projectRes.data ?? []) {
    items.push({
      id: row.id,
      kind: 'project',
      title: 'Course project',
      courseTitle: courseTitle.get(row.course_id) ?? 'Unknown course',
      courseId: row.course_id,
      submittedAt: row.submitted_at ?? null,
      content: row.submission_content ?? null,
      fileUrls: toUrlArray(row.file_urls),
      autoScore: row.ai_proposed_score ?? null,
      adminScore: row.admin_score ?? null,
      adminComment: row.admin_notes ?? row.ai_feedback ?? null,
      gradedAt: row.graded_at ?? null,
      statusLabel: row.admin_status ?? row.status ?? null,
      readOnly: false,
    });
  }

  // ── 5) Final essays ──
  for (const row of essayRes.data ?? []) {
    const essay = row.course_essays as { title: string; course_id: string } | null;
    items.push({
      id: row.id,
      kind: 'essay',
      title: essay?.title ?? 'Final essay',
      courseTitle: essay ? (courseTitle.get(essay.course_id) ?? 'Unknown course') : 'Unknown course',
      courseId: essay?.course_id ?? null,
      submittedAt: row.submitted_at ?? null,
      content: row.content ?? null,
      fileUrls: EMPTY,
      autoScore: row.ai_score ?? null,
      adminScore: row.admin_score ?? null,
      adminComment: row.admin_feedback ?? row.ai_feedback ?? null,
      gradedAt: row.admin_graded_at ?? null,
      statusLabel: row.word_count ? `${row.word_count} words` : (row.status ?? null),
      readOnly: false,
    });
  }

  // ── 6) Final exams — auto-graded, shown for context only ──
  for (const row of examRes.data ?? []) {
    const exam = row.course_final_exams as { title: string; course_id: string } | null;
    items.push({
      id: row.id,
      kind: 'exam',
      title: exam?.title ?? 'Final exam',
      courseTitle: exam ? (courseTitle.get(exam.course_id) ?? 'Unknown course') : 'Unknown course',
      courseId: exam?.course_id ?? null,
      submittedAt: row.submitted_at ?? null,
      content: null,
      fileUrls: EMPTY,
      autoScore: row.score ?? null,
      adminScore: null,
      adminComment: null,
      gradedAt: null,
      statusLabel: row.passed === null ? 'In progress' : row.passed ? 'Passed' : 'Failed',
      readOnly: true,
    });
  }

  // Newest first; undated rows last.
  return items.sort((a, b) => {
    const at = a.submittedAt ? Date.parse(a.submittedAt) : 0;
    const bt = b.submittedAt ? Date.parse(b.submittedAt) : 0;
    return bt - at;
  });
}

/** All enrolled students, with how many of their submissions still need a score. */
export function useGradingStudents() {
  return useQuery({
    queryKey: ['admin-grading', 'students'],
    queryFn: async (): Promise<GradingStudent[]> => {
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('user_id');
      if (purchaseError) throw purchaseError;

      const userIds = [...new Set((purchases ?? []).map((p) => p.user_id))];
      if (userIds.length === 0) return [];

      // Privacy: use the public profile view, never the profiles table.
      const { data: profiles, error: profileError } = (await supabase
        .from('profiles_public' as never)
        .select('id, display_name, avatar_url')
        .in('id', userIds)) as {
        data: { id: string; display_name: string | null; avatar_url: string | null }[] | null;
        error: unknown;
      };
      if (profileError) throw profileError;

      // Ungraded counts per student, per source table.
      const [progress, practice, milestone, project, essay] = await Promise.all([
        supabase
          .from('user_progress')
          .select('user_id, admin_override_score')
          .in('user_id', userIds),
        supabase.from('practice_submissions').select('user_id, admin_score').in('user_id', userIds),
        supabase
          .from('project_milestone_submissions')
          .select('user_id, admin_score')
          .in('user_id', userIds),
        supabase.from('course_projects').select('user_id, admin_score').in('user_id', userIds),
        supabase
          .from('student_essay_submissions')
          .select('user_id, admin_score')
          .in('user_id', userIds),
      ]);

      const totals = new Map<string, { total: number; ungraded: number }>();
      const bump = (userId: string, graded: boolean) => {
        const entry = totals.get(userId) ?? { total: 0, ungraded: 0 };
        entry.total += 1;
        if (!graded) entry.ungraded += 1;
        totals.set(userId, entry);
      };
      for (const row of practice.data ?? []) bump(row.user_id, row.admin_score !== null);
      for (const row of milestone.data ?? []) bump(row.user_id, row.admin_score !== null);
      for (const row of project.data ?? []) bump(row.user_id, row.admin_score !== null);
      for (const row of essay.data ?? []) bump(row.user_id, row.admin_score !== null);
      for (const row of progress.data ?? []) bump(row.user_id, row.admin_override_score !== null);

      return userIds
        .map((id) => {
          const profile = (profiles ?? []).find((p) => p.id === id);
          const counts = totals.get(id) ?? { total: 0, ungraded: 0 };
          return {
            userId: id,
            displayName: profile?.display_name || 'Student',
            avatarUrl: profile?.avatar_url ?? null,
            ungradedCount: counts.ungraded,
            totalCount: counts.total,
          };
        })
        .sort((a, b) => b.ungradedCount - a.ungradedCount || a.displayName.localeCompare(b.displayName));
    },
    staleTime: 30_000,
  });
}

/** Every submission belonging to one student. */
export function useStudentSubmissions(userId: string | null) {
  return useQuery({
    queryKey: ['admin-grading', 'submissions', userId],
    queryFn: () => fetchStudentSubmissions(userId as string),
    enabled: !!userId,
  });
}

export interface GradePayload {
  item: GradingItem;
  /** 0–100. */
  score: number;
  comment: string;
  /** Only used for capstone course projects. */
  projectStatus?: 'pending' | 'approved' | 'needs_revision';
}

/**
 * Write a score + comment to the correct table for this submission kind.
 * Each branch targets the trigger-protected grading columns, so it only
 * succeeds when the caller is an admin.
 */
export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, score, comment, projectStatus }: GradePayload) => {
      const { data: authData } = await supabase.auth.getUser();
      const graderId = authData.user?.id ?? null;
      const now = new Date().toISOString();

      switch (item.kind) {
        case 'assignment':
        case 'quiz':
        case 'activity':
        case 'worksheet': {
          const { error } = await supabase
            .from('user_progress')
            .update({
              admin_override_score: score,
              admin_notes: comment || null,
              graded_by: graderId,
              graded_at: now,
            })
            .eq('id', item.id);
          if (error) throw error;
          break;
        }
        case 'practice': {
          const { error } = await supabase
            .from('practice_submissions')
            .update({
              admin_score: score,
              admin_feedback: comment || null,
              graded_by: graderId,
              graded_at: now,
              status: 'graded',
            })
            .eq('id', item.id);
          if (error) throw error;
          break;
        }
        case 'milestone': {
          const { error } = await supabase
            .from('project_milestone_submissions')
            .update({
              admin_score: score,
              admin_feedback: comment || null,
              graded_by: graderId,
              graded_at: now,
            })
            .eq('id', item.id);
          if (error) throw error;
          break;
        }
        case 'project': {
          // Capstone projects go through the audited RPC, which also snapshots
          // a version row and notifies the student.
          const { error } = await supabase.rpc('admin_grade_project' as never, {
            _project_id: item.id,
            _score: score,
            _status: projectStatus ?? 'approved',
            _notes: comment || null,
          } as never);
          if (error) throw error;
          break;
        }
        case 'essay': {
          const { error } = await supabase
            .from('student_essay_submissions')
            .update({
              admin_score: score,
              admin_feedback: comment || null,
              admin_graded_at: now,
            })
            .eq('id', item.id);
          if (error) throw error;
          break;
        }
        case 'exam':
          throw new Error('Final exams are auto-graded and cannot be overridden here.');
      }
    },
    onSuccess: () => {
      // Refresh grading views plus anything that shows grades to students.
      queryClient.invalidateQueries({ queryKey: ['admin-grading'] });
      queryClient.invalidateQueries({ queryKey: ['gradebook'] });
      queryClient.invalidateQueries({ queryKey: ['student-grades'] });
    },
  });
}
