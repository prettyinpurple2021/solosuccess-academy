
-- =============================================
-- 1. ATOMIC XP AWARD FUNCTION
-- Prevents race conditions with row-level locking (FOR UPDATE).
-- Handles streak calculation server-side.
-- =============================================
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid,
  _xp_amount integer,
  _action text DEFAULT 'unknown'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _today date := CURRENT_DATE;
  _result jsonb;
  _existing record;
  _new_streak integer := 1;
  _longest_streak integer := 1;
  _new_total integer;
BEGIN
  -- Try to lock the existing row for atomic update
  SELECT * INTO _existing
  FROM public.user_gamification
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _existing IS NOT NULL THEN
    -- Calculate streak
    IF _existing.last_activity_date = _today THEN
      -- Same day: no streak change
      _new_streak := _existing.current_streak;
      _longest_streak := _existing.longest_streak;
    ELSIF _existing.last_activity_date = _today - 1 THEN
      -- Consecutive day: increment
      _new_streak := _existing.current_streak + 1;
      _longest_streak := GREATEST(_new_streak, _existing.longest_streak);
    ELSE
      -- Gap: reset streak
      _new_streak := 1;
      _longest_streak := _existing.longest_streak;
    END IF;

    _new_total := _existing.total_xp + _xp_amount;

    UPDATE public.user_gamification
    SET total_xp = _new_total,
        current_streak = _new_streak,
        longest_streak = _longest_streak,
        last_activity_date = _today,
        updated_at = now()
    WHERE user_id = _user_id;

    _result := jsonb_build_object(
      'total_xp', _new_total,
      'current_streak', _new_streak,
      'longest_streak', _longest_streak,
      'xp_awarded', _xp_amount
    );
  ELSE
    -- First time: create record
    INSERT INTO public.user_gamification (user_id, total_xp, current_streak, longest_streak, last_activity_date)
    VALUES (_user_id, _xp_amount, 1, 1, _today);

    _result := jsonb_build_object(
      'total_xp', _xp_amount,
      'current_streak', 1,
      'longest_streak', 1,
      'xp_awarded', _xp_amount
    );
  END IF;

  RETURN _result;
END;
$$;

-- =============================================
-- 2. XP CONFIG TABLE
-- Admins can tune XP values without code changes.
-- =============================================
CREATE TABLE public.xp_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_key text NOT NULL UNIQUE,
  xp_amount integer NOT NULL DEFAULT 0,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_config ENABLE ROW LEVEL SECURITY;

-- Admins can manage XP config
CREATE POLICY "Admins can manage xp_config"
  ON public.xp_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view XP config (needed for client-side display)
CREATE POLICY "Authenticated users can view xp_config"
  ON public.xp_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seed default XP values
INSERT INTO public.xp_config (action_key, xp_amount, label) VALUES
  ('LESSON_COMPLETE', 25, 'Completing a lesson'),
  ('QUIZ_PASS', 50, 'Passing a quiz'),
  ('QUIZ_PERFECT', 100, 'Perfect quiz score'),
  ('PROJECT_SUBMIT', 75, 'Submitting a project'),
  ('PROJECT_FEEDBACK', 25, 'Getting project feedback'),
  ('DISCUSSION_START', 15, 'Starting a discussion'),
  ('COMMENT_POST', 10, 'Posting a comment');

-- =============================================
-- 3. OVERALL PROGRESS DB FUNCTION
-- Replaces 3 round-trips with a single SQL call.
-- =============================================
CREATE OR REPLACE FUNCTION public.get_overall_progress(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH purchased AS (
    SELECT course_id FROM public.purchases WHERE user_id = _user_id
  ),
  course_lessons AS (
    SELECT l.id AS lesson_id, l.course_id
    FROM public.lessons l
    INNER JOIN purchased p ON p.course_id = l.course_id
  ),
  progress AS (
    SELECT up.lesson_id, up.completed
    FROM public.user_progress up
    INNER JOIN course_lessons cl ON cl.lesson_id = up.lesson_id
    WHERE up.user_id = _user_id
  ),
  per_course AS (
    SELECT 
      cl.course_id,
      COUNT(cl.lesson_id)::int AS total,
      COUNT(CASE WHEN p.completed THEN 1 END)::int AS completed
    FROM course_lessons cl
    LEFT JOIN progress p ON p.lesson_id = cl.lesson_id
    GROUP BY cl.course_id
  )
  SELECT jsonb_build_object(
    'totalLessons', COALESCE((SELECT SUM(total) FROM per_course), 0),
    'completedLessons', COALESCE((SELECT SUM(completed) FROM per_course), 0),
    'courseProgress', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'courseId', course_id,
        'total', total,
        'completed', completed,
        'percentage', CASE WHEN total > 0 THEN ROUND((completed::numeric / total) * 100) ELSE 0 END
      )) FROM per_course),
      '[]'::jsonb
    )
  );
$$;
