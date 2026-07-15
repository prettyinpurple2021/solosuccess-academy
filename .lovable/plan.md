# Per-Course Project Submissions — Grading & History

Builds on the existing `course_projects` table (one row per student per course). Adds admin grading, an AI-drafted score that admins approve, and archived versions when a student resubmits.

## What students see

On `/course/:id/project`:
- **Submission form** with content editor + file attachments (already exists).
- **Locked banner** after submit: "Awaiting review — you can't edit until an admin responds."
- **Grade card** once graded: score /100, status badge (Approved / Needs Revision), admin notes, AI feedback.
- **Resubmit** button only when status is `needs_revision`. Submitting snapshots the current version into history and resets to `pending`.
- **Version history** accordion listing previous attempts (submitted_at, score, status, feedback) — read-only.

## What admins see

New section in `/admin/lessons/...` (or a new `/admin/projects` page) — for scope, add a compact grading panel to the existing admin project review flow:
- List of submissions with status filter (pending / needs_revision / approved).
- Grading form: score slider (0–100), status dropdown, notes textarea. AI-drafted score pre-fills; admin edits + approves.
- History drawer per student showing prior versions.

## Schema changes

Add to `course_projects`:
- `admin_status` enum `project_grade_status` — `pending | approved | needs_revision` (default `pending`)
- `admin_score` int 0–100 (nullable)
- `admin_notes` text (nullable)
- `graded_by` uuid → auth.users (nullable)
- `graded_at` timestamptz (nullable)
- `ai_proposed_score` int (nullable) — set by `project-feedback` function
- `current_version` int default 1

New table `course_project_versions` — append-only snapshots:
- `id`, `project_id` (fk), `version_number`, `submission_content`, `file_urls`, `ai_feedback`, `ai_proposed_score`, `admin_score`, `admin_status`, `admin_notes`, `snapshotted_at`

Trigger `protect_project_admin_fields` — non-admins can't write `admin_*`, `graded_*`.

RLS:
- Students: read own project + own versions.
- Admins: read/update all projects, insert versions.
- Resubmit RPC `resubmit_project(_project_id, _content, _files)` — checks `admin_status='needs_revision'`, snapshots row into `course_project_versions`, updates project with new content, bumps `current_version`, resets status to `pending`.

RPC `admin_grade_project(_project_id, _score, _status, _notes)` — admin-only, sets grade fields, stamps `graded_by`/`graded_at`.

## AI feedback update

`project-feedback` function extended to also return a numeric score (0–100) parsed from the AI response and write it to `ai_proposed_score`. Existing prose feedback flow unchanged.

## Gradebook

Project grades already have weight in `grade_settings` via other paths; wire `admin_score` for approved projects into `useGradebook` alongside quiz/activity/worksheet (out of scope for this pass unless quick — flagged as follow-up).

## Files

Migration:
- `supabase/migrations/<ts>_project_grading_and_history.sql`

Edge functions:
- `supabase/functions/project-feedback/index.ts` — parse score, write `ai_proposed_score`

Hooks:
- `src/hooks/useProjects.ts` — add `useProjectVersions`, `useResubmitProject`, `useAdminGradeProject`, extend `CourseProject` type

UI:
- `src/components/project/ProjectSubmissionForm.tsx` — lock states + resubmit button
- `src/components/project/ProjectFeedback.tsx` — show grade card
- `src/components/project/ProjectVersionHistory.tsx` **(new)** — accordion of past attempts
- `src/components/admin/AdminProjectGrader.tsx` **(new)** — grading panel
- `src/pages/CourseProject.tsx` — wire new pieces
- Admin route entry in `src/App.tsx` if a new admin page is warranted; otherwise embed grader in existing admin surface

## Out of scope (call out to user after)

- Rewiring the gradebook weighting math for the new `admin_score`.
- Email notifications on grade decisions (already infra-ready, easy follow-up).
