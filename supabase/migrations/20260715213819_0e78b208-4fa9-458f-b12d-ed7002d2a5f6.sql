
-- 1) Enum for admin grading status
DO $$ BEGIN
  CREATE TYPE public.project_grade_status AS ENUM ('pending', 'approved', 'needs_revision');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Extend course_projects with grading + versioning fields
ALTER TABLE public.course_projects
  ADD COLUMN IF NOT EXISTS admin_status public.project_grade_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_score integer,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS graded_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_proposed_score integer,
  ADD COLUMN IF NOT EXISTS current_version integer NOT NULL DEFAULT 1;

ALTER TABLE public.course_projects
  DROP CONSTRAINT IF EXISTS course_projects_admin_score_range;
ALTER TABLE public.course_projects
  ADD CONSTRAINT course_projects_admin_score_range
  CHECK (admin_score IS NULL OR (admin_score BETWEEN 0 AND 100));

ALTER TABLE public.course_projects
  DROP CONSTRAINT IF EXISTS course_projects_ai_proposed_score_range;
ALTER TABLE public.course_projects
  ADD CONSTRAINT course_projects_ai_proposed_score_range
  CHECK (ai_proposed_score IS NULL OR (ai_proposed_score BETWEEN 0 AND 100));

-- 3) Admin read/update policies for course_projects (students already have their own policies)
DROP POLICY IF EXISTS "Admins can view all projects" ON public.course_projects;
CREATE POLICY "Admins can view all projects"
  ON public.course_projects FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all projects" ON public.course_projects;
CREATE POLICY "Admins can update all projects"
  ON public.course_projects FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Trigger to prevent students from writing admin-only grading fields
CREATE OR REPLACE FUNCTION public.protect_project_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.admin_status := OLD.admin_status;
    NEW.admin_score := OLD.admin_score;
    NEW.admin_notes := OLD.admin_notes;
    NEW.graded_by := OLD.graded_by;
    NEW.graded_at := OLD.graded_at;
    -- ai_proposed_score is only written via service-role edge function; block others
    NEW.ai_proposed_score := OLD.ai_proposed_score;
    NEW.current_version := OLD.current_version;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_project_admin_fields_trigger ON public.course_projects;
CREATE TRIGGER protect_project_admin_fields_trigger
  BEFORE UPDATE ON public.course_projects
  FOR EACH ROW EXECUTE FUNCTION public.protect_project_admin_fields();

-- 5) Version history table (append-only snapshots)
CREATE TABLE IF NOT EXISTS public.course_project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.course_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  version_number integer NOT NULL,
  submission_content text,
  file_urls text[],
  ai_feedback text,
  ai_proposed_score integer,
  admin_score integer,
  admin_status public.project_grade_status,
  admin_notes text,
  submitted_at timestamptz,
  graded_at timestamptz,
  snapshotted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_number)
);

CREATE INDEX IF NOT EXISTS course_project_versions_project_idx
  ON public.course_project_versions (project_id, version_number DESC);

GRANT SELECT ON public.course_project_versions TO authenticated;
GRANT ALL ON public.course_project_versions TO service_role;

ALTER TABLE public.course_project_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own project versions" ON public.course_project_versions;
CREATE POLICY "Students view own project versions"
  ON public.course_project_versions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all project versions" ON public.course_project_versions;
CREATE POLICY "Admins view all project versions"
  ON public.course_project_versions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6) Admin grade RPC
CREATE OR REPLACE FUNCTION public.admin_grade_project(
  _project_id uuid,
  _score integer,
  _status public.project_grade_status,
  _notes text DEFAULT NULL
)
RETURNS public.course_projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _row public.course_projects;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF _score IS NULL OR _score < 0 OR _score > 100 THEN
    RAISE EXCEPTION 'Score must be between 0 and 100';
  END IF;
  IF _status IS NULL THEN
    RAISE EXCEPTION 'Status is required';
  END IF;

  UPDATE public.course_projects
     SET admin_score = _score,
         admin_status = _status,
         admin_notes = _notes,
         graded_by = auth.uid(),
         graded_at = now(),
         updated_at = now()
   WHERE id = _project_id
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  RETURN _row;
END;
$$;

-- 7) Resubmit RPC (student) — snapshots current then updates
CREATE OR REPLACE FUNCTION public.resubmit_project(
  _project_id uuid,
  _submission_content text,
  _file_urls text[]
)
RETURNS public.course_projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.course_projects;
  _new public.course_projects;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _row FROM public.course_projects
   WHERE id = _project_id FOR UPDATE;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  IF _row.user_id <> _uid THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _row.admin_status <> 'needs_revision' THEN
    RAISE EXCEPTION 'Resubmission is only allowed when the project is marked "needs revision"';
  END IF;

  -- Snapshot current state into versions
  INSERT INTO public.course_project_versions (
    project_id, user_id, course_id, version_number,
    submission_content, file_urls, ai_feedback, ai_proposed_score,
    admin_score, admin_status, admin_notes, submitted_at, graded_at
  ) VALUES (
    _row.id, _row.user_id, _row.course_id, _row.current_version,
    _row.submission_content, _row.file_urls, _row.ai_feedback, _row.ai_proposed_score,
    _row.admin_score, _row.admin_status, _row.admin_notes, _row.submitted_at, _row.graded_at
  );

  -- Update project with new submission, reset grading state
  UPDATE public.course_projects
     SET submission_content = _submission_content,
         file_urls = COALESCE(_file_urls, ARRAY[]::text[]),
         status = 'submitted',
         submitted_at = now(),
         ai_feedback = NULL,
         ai_feedback_at = NULL,
         ai_proposed_score = NULL,
         admin_status = 'pending',
         admin_score = NULL,
         admin_notes = NULL,
         graded_by = NULL,
         graded_at = NULL,
         current_version = _row.current_version + 1,
         updated_at = now()
   WHERE id = _project_id
  RETURNING * INTO _new;

  RETURN _new;
END;
$$;

-- 8) Admin list RPC for the grading queue
CREATE OR REPLACE FUNCTION public.admin_list_project_submissions(
  _status public.project_grade_status DEFAULT NULL,
  _course_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  course_id uuid,
  course_title text,
  student_name text,
  status project_status,
  admin_status public.project_grade_status,
  admin_score integer,
  ai_proposed_score integer,
  submitted_at timestamptz,
  graded_at timestamptz,
  current_version integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.user_id, p.course_id,
         c.title AS course_title,
         COALESCE(pr.display_name, 'Student') AS student_name,
         p.status, p.admin_status, p.admin_score, p.ai_proposed_score,
         p.submitted_at, p.graded_at, p.current_version
    FROM public.course_projects p
    JOIN public.courses c ON c.id = p.course_id
    LEFT JOIN public.profiles pr ON pr.id = p.user_id
   WHERE public.has_role(auth.uid(), 'admin')
     AND p.status IN ('submitted', 'reviewed')
     AND (_status IS NULL OR p.admin_status = _status)
     AND (_course_id IS NULL OR p.course_id = _course_id)
   ORDER BY p.submitted_at DESC NULLS LAST;
$$;
