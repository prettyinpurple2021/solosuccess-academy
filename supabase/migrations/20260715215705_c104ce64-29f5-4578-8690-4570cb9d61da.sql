-- 1) Per-day activity history table for accurate streak calendar
CREATE TABLE IF NOT EXISTS public.user_activity_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_days_user_date
  ON public.user_activity_days (user_id, activity_date DESC);

GRANT SELECT ON public.user_activity_days TO authenticated;
GRANT ALL ON public.user_activity_days TO service_role;

ALTER TABLE public.user_activity_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity days"
  ON public.user_activity_days
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_activity_days_updated_at
  BEFORE UPDATE ON public.user_activity_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill from user_gamification.last_activity_date so today's dot renders immediately
INSERT INTO public.user_activity_days (user_id, activity_date, xp_earned)
SELECT user_id, last_activity_date, 0
FROM public.user_gamification
WHERE last_activity_date IS NOT NULL
ON CONFLICT (user_id, activity_date) DO NOTHING;

-- 2) Extend award_xp to also record the per-day row (idempotent per user/date)
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _xp_amount integer, _action text DEFAULT 'unknown'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _today date := CURRENT_DATE;
  _result jsonb;
  _existing record;
  _new_streak integer := 1;
  _longest_streak integer := 1;
  _new_total integer;
BEGIN
  SELECT * INTO _existing
  FROM public.user_gamification
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _existing IS NOT NULL THEN
    IF _existing.last_activity_date = _today THEN
      _new_streak := _existing.current_streak;
      _longest_streak := _existing.longest_streak;
    ELSIF _existing.last_activity_date = _today - 1 THEN
      _new_streak := _existing.current_streak + 1;
      _longest_streak := GREATEST(_new_streak, _existing.longest_streak);
    ELSE
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
    INSERT INTO public.user_gamification (user_id, total_xp, current_streak, longest_streak, last_activity_date)
    VALUES (_user_id, _xp_amount, 1, 1, _today);

    _result := jsonb_build_object(
      'total_xp', _xp_amount,
      'current_streak', 1,
      'longest_streak', 1,
      'xp_awarded', _xp_amount
    );
  END IF;

  -- Record per-day activity (upsert; sums XP if multiple awards in one day)
  INSERT INTO public.user_activity_days (user_id, activity_date, xp_earned)
  VALUES (_user_id, _today, GREATEST(_xp_amount, 0))
  ON CONFLICT (user_id, activity_date) DO UPDATE
    SET xp_earned = public.user_activity_days.xp_earned + GREATEST(EXCLUDED.xp_earned, 0),
        updated_at = now();

  RETURN _result;
END;
$function$;

-- 3) Reminder log so the resubmission reminder cron stays idempotent
CREATE TABLE IF NOT EXISTS public.project_revision_reminders_sent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  graded_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, graded_at)
);

GRANT ALL ON public.project_revision_reminders_sent TO service_role;

ALTER TABLE public.project_revision_reminders_sent ENABLE ROW LEVEL SECURITY;

-- Intentionally no policies for authenticated/anon: server-side only.