-- 1) Admin grading columns for practice lab submissions
ALTER TABLE public.practice_submissions
  ADD COLUMN IF NOT EXISTS admin_score integer,
  ADD COLUMN IF NOT EXISTS admin_feedback text,
  ADD COLUMN IF NOT EXISTS graded_by uuid,
  ADD COLUMN IF NOT EXISTS graded_at timestamptz;

-- 2) Admin grading columns for project milestone submissions
ALTER TABLE public.project_milestone_submissions
  ADD COLUMN IF NOT EXISTS admin_score integer,
  ADD COLUMN IF NOT EXISTS admin_feedback text,
  ADD COLUMN IF NOT EXISTS graded_by uuid,
  ADD COLUMN IF NOT EXISTS graded_at timestamptz;

-- 3) Extend practice-lab protection to the new admin fields.
CREATE OR REPLACE FUNCTION public.protect_practice_submission_grading()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF public.is_privileged_grader() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.score := NULL;
    NEW.ai_feedback := NULL;
    NEW.ai_feedback_at := NULL;
    NEW.admin_score := NULL;
    NEW.admin_feedback := NULL;
    NEW.graded_by := NULL;
    NEW.graded_at := NULL;
    RETURN NEW;
  END IF;

  NEW.score := OLD.score;
  NEW.ai_feedback := OLD.ai_feedback;
  NEW.ai_feedback_at := OLD.ai_feedback_at;
  NEW.admin_score := OLD.admin_score;
  NEW.admin_feedback := OLD.admin_feedback;
  NEW.graded_by := OLD.graded_by;
  NEW.graded_at := OLD.graded_at;
  RETURN NEW;
END;
$$;

-- 4) Same protection for milestone submissions (previously unprotected).
CREATE OR REPLACE FUNCTION public.protect_milestone_submission_grading()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF public.is_privileged_grader() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.ai_feedback := NULL;
    NEW.ai_feedback_at := NULL;
    NEW.admin_score := NULL;
    NEW.admin_feedback := NULL;
    NEW.graded_by := NULL;
    NEW.graded_at := NULL;
    RETURN NEW;
  END IF;

  NEW.ai_feedback := OLD.ai_feedback;
  NEW.ai_feedback_at := OLD.ai_feedback_at;
  NEW.admin_score := OLD.admin_score;
  NEW.admin_feedback := OLD.admin_feedback;
  NEW.graded_by := OLD.graded_by;
  NEW.graded_at := OLD.graded_at;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_milestone_submission_grading() FROM anon, authenticated;

DROP TRIGGER IF EXISTS protect_milestone_submission_grading ON public.project_milestone_submissions;
CREATE TRIGGER protect_milestone_submission_grading
  BEFORE INSERT OR UPDATE ON public.project_milestone_submissions
  FOR EACH ROW EXECUTE FUNCTION public.protect_milestone_submission_grading();