
-- ============================================================
-- FIX 1: Protect admin-only columns on user_progress via trigger
-- Students cannot modify: admin_override_score, admin_notes, graded_by, graded_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_admin_progress_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.admin_override_score := OLD.admin_override_score;
    NEW.admin_notes := OLD.admin_notes;
    NEW.graded_by := OLD.graded_by;
    NEW.graded_at := OLD.graded_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_admin_fields
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_progress_fields();

-- ============================================================
-- FIX 2: Require course completion before certificate issuance
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_completed_course(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    SELECT COUNT(*) FROM public.lessons WHERE course_id = _course_id
  ) > 0
  AND (
    SELECT COUNT(*) FROM public.lessons WHERE course_id = _course_id
  ) = (
    SELECT COUNT(*)
    FROM public.user_progress up
    INNER JOIN public.lessons l ON l.id = up.lesson_id
    WHERE up.user_id = _user_id
      AND l.course_id = _course_id
      AND up.completed = true
  );
$$;

DROP POLICY IF EXISTS "Users can create certificates for completed courses" ON public.certificates;

CREATE POLICY "Users can create certificates for completed courses"
ON public.certificates
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND has_purchased_course(auth.uid(), course_id)
  AND has_completed_course(auth.uid(), course_id)
);

-- ============================================================
-- FIX 3: Hide exam answers from students
-- Safe exam fetch function (strips answer fields)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_exam_for_student(_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _exam record;
  _safe_questions jsonb;
BEGIN
  IF NOT public.has_purchased_course(auth.uid(), _course_id) THEN
    RETURN NULL;
  END IF;

  SELECT * INTO _exam FROM public.course_final_exams WHERE course_id = _course_id LIMIT 1;
  IF _exam IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(
    q - 'correctIndex' - 'correctAnswer' - 'correctBoolean'
  ) INTO _safe_questions
  FROM jsonb_array_elements(_exam.questions) AS q;

  RETURN jsonb_build_object(
    'id', _exam.id,
    'course_id', _exam.course_id,
    'title', _exam.title,
    'instructions', _exam.instructions,
    'passing_score', _exam.passing_score,
    'question_count', _exam.question_count,
    'questions', COALESCE(_safe_questions, '[]'::jsonb)
  );
END;
$$;

-- Server-side exam grading function
CREATE OR REPLACE FUNCTION public.grade_and_submit_exam(_exam_id uuid, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _exam record;
  _user_id uuid := auth.uid();
  _q jsonb;
  _ans jsonb;
  _total_points numeric := 0;
  _earned_points numeric := 0;
  _score integer;
  _passed boolean;
  _attempt_id uuid;
  _results jsonb := '[]'::jsonb;
  _keywords text[];
  _student_text text;
  _matched int;
  _kw text;
BEGIN
  SELECT * INTO _exam FROM public.course_final_exams WHERE id = _exam_id;
  IF _exam IS NULL THEN
    RAISE EXCEPTION 'Exam not found';
  END IF;

  IF NOT public.has_purchased_course(_user_id, _exam.course_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR _q IN SELECT * FROM jsonb_array_elements(_exam.questions)
  LOOP
    _total_points := _total_points + COALESCE((_q->>'points')::numeric, 1);
    _ans := _answers->(_q->>'id');

    IF _ans IS NOT NULL THEN
      CASE _q->>'type'
        WHEN 'mcq' THEN
          IF (_ans->>'selectedIndex')::int = (_q->>'correctIndex')::int THEN
            _earned_points := _earned_points + COALESCE((_q->>'points')::numeric, 1);
          END IF;
        WHEN 'true_false' THEN
          IF _q ? 'correctBoolean' THEN
            IF ((_ans->>'selectedIndex')::int = 0) = (_q->>'correctBoolean')::boolean THEN
              _earned_points := _earned_points + COALESCE((_q->>'points')::numeric, 1);
            END IF;
          ELSIF (_ans->>'selectedIndex')::int = (_q->>'correctIndex')::int THEN
            _earned_points := _earned_points + COALESCE((_q->>'points')::numeric, 1);
          END IF;
        WHEN 'short_answer' THEN
          IF _q->>'correctAnswer' IS NOT NULL AND _ans->>'textAnswer' IS NOT NULL THEN
            _keywords := string_to_array(lower(_q->>'correctAnswer'), ',');
            _student_text := lower(_ans->>'textAnswer');
            _matched := 0;
            FOREACH _kw IN ARRAY _keywords LOOP
              IF _student_text LIKE '%' || trim(_kw) || '%' THEN
                _matched := _matched + 1;
              END IF;
            END LOOP;
            IF array_length(_keywords, 1) > 0 THEN
              _earned_points := _earned_points + COALESCE((_q->>'points')::numeric, 1) * (_matched::numeric / array_length(_keywords, 1));
            END IF;
          END IF;
        ELSE NULL;
      END CASE;
    END IF;

    _results := _results || jsonb_build_object(
      'id', _q->>'id',
      'type', _q->>'type',
      'question', _q->>'question',
      'options', _q->'options',
      'correctIndex', _q->'correctIndex',
      'correctAnswer', _q->'correctAnswer',
      'correctBoolean', _q->'correctBoolean',
      'explanation', _q->>'explanation',
      'points', _q->'points'
    );
  END LOOP;

  _score := CASE WHEN _total_points > 0 THEN round((_earned_points / _total_points) * 100) ELSE 0 END;
  _passed := _score >= _exam.passing_score;

  INSERT INTO public.student_exam_attempts (exam_id, user_id, answers, score, passed, submitted_at)
  VALUES (_exam_id, _user_id, _answers, _score, _passed, now())
  RETURNING id INTO _attempt_id;

  RETURN jsonb_build_object(
    'attemptId', _attempt_id,
    'score', _score,
    'passed', _passed,
    'questions', _results,
    'answers', _answers
  );
END;
$$;

-- Remove direct student access to exam answers
DROP POLICY IF EXISTS "Students can view purchased course exams" ON public.course_final_exams;
