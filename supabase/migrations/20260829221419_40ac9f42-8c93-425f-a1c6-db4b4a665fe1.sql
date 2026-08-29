-- Helper: is the current writer a privileged grader (admin, service role, or a
-- SECURITY DEFINER grading function running as the table owner)?
CREATE OR REPLACE FUNCTION public.is_privileged_grader()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- service_role (edge functions) and superuser/owner contexts (SECURITY DEFINER RPCs)
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN true;
  END IF;
  IF coalesce(auth.jwt() ->> 'role', '') = 'service_role' THEN
    RETURN true;
  END IF;
  -- platform admins
  RETURN public.has_role(auth.uid(), 'admin');
END;
$$;

-- 1. course_projects: block students from writing grading columns
CREATE OR REPLACE FUNCTION public.protect_course_project_grading()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_privileged_grader() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.admin_score := NULL;
    NEW.admin_status := 'pending';
    NEW.admin_notes := NULL;
    NEW.graded_by := NULL;
    NEW.graded_at := NULL;
    NEW.ai_proposed_score := NULL;
    NEW.ai_feedback := NULL;
    NEW.ai_feedback_at := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE: silently preserve grading columns
  NEW.admin_score := OLD.admin_score;
  NEW.admin_status := OLD.admin_status;
  NEW.admin_notes := OLD.admin_notes;
  NEW.graded_by := OLD.graded_by;
  NEW.graded_at := OLD.graded_at;
  NEW.ai_proposed_score := OLD.ai_proposed_score;
  NEW.ai_feedback := OLD.ai_feedback;
  NEW.ai_feedback_at := OLD.ai_feedback_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_course_project_grading ON public.course_projects;
CREATE TRIGGER protect_course_project_grading
  BEFORE INSERT OR UPDATE ON public.course_projects
  FOR EACH ROW EXECUTE FUNCTION public.protect_course_project_grading();

-- 2. practice_submissions
CREATE OR REPLACE FUNCTION public.protect_practice_submission_grading()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_privileged_grader() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.score := NULL;
    NEW.ai_feedback := NULL;
    NEW.ai_feedback_at := NULL;
    RETURN NEW;
  END IF;

  NEW.score := OLD.score;
  NEW.ai_feedback := OLD.ai_feedback;
  NEW.ai_feedback_at := OLD.ai_feedback_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_practice_submission_grading ON public.practice_submissions;
CREATE TRIGGER protect_practice_submission_grading
  BEFORE INSERT OR UPDATE ON public.practice_submissions
  FOR EACH ROW EXECUTE FUNCTION public.protect_practice_submission_grading();

-- 3. student_essay_submissions
CREATE OR REPLACE FUNCTION public.protect_essay_submission_grading()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_privileged_grader() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.ai_score := NULL;
    NEW.ai_feedback := NULL;
    NEW.ai_rubric_scores := NULL;
    NEW.ai_graded_at := NULL;
    NEW.admin_score := NULL;
    NEW.admin_feedback := NULL;
    NEW.admin_graded_at := NULL;
    RETURN NEW;
  END IF;

  NEW.ai_score := OLD.ai_score;
  NEW.ai_feedback := OLD.ai_feedback;
  NEW.ai_rubric_scores := OLD.ai_rubric_scores;
  NEW.ai_graded_at := OLD.ai_graded_at;
  NEW.admin_score := OLD.admin_score;
  NEW.admin_feedback := OLD.admin_feedback;
  NEW.admin_graded_at := OLD.admin_graded_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_essay_submission_grading ON public.student_essay_submissions;
CREATE TRIGGER protect_essay_submission_grading
  BEFORE INSERT OR UPDATE ON public.student_essay_submissions
  FOR EACH ROW EXECUTE FUNCTION public.protect_essay_submission_grading();

-- 4. student_exam_attempts: score/passed only via grade_and_submit_exam RPC
CREATE OR REPLACE FUNCTION public.protect_exam_attempt_grading()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_privileged_grader() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.score := NULL;
    NEW.passed := NULL;
    RETURN NEW;
  END IF;

  NEW.score := OLD.score;
  NEW.passed := OLD.passed;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_exam_attempt_grading ON public.student_exam_attempts;
CREATE TRIGGER protect_exam_attempt_grading
  BEFORE INSERT OR UPDATE ON public.student_exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.protect_exam_attempt_grading();