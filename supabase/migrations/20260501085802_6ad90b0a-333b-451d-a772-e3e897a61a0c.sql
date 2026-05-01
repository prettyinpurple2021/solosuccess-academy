-- ============================================================
-- Retention batch: lifecycle emails + onboarding tracking
-- ============================================================

-- 1. Track which courses each user has seen the post-purchase
--    onboarding screen for (so we only show it once per course).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_courses uuid[] NOT NULL DEFAULT '{}';

-- 2. Idempotency ledger for lifecycle emails so the cron worker
--    can never double-send the same nudge to the same user/course.
CREATE TABLE IF NOT EXISTS public.lifecycle_emails_sent (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  kind text NOT NULL,           -- 'welcome' | 'day3-nudge' | 'day7-resume'
  sent_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  CONSTRAINT lifecycle_unique_per_kind UNIQUE (user_id, course_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_emails_user
  ON public.lifecycle_emails_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_emails_kind_sent
  ON public.lifecycle_emails_sent(kind, sent_at DESC);

ALTER TABLE public.lifecycle_emails_sent ENABLE ROW LEVEL SECURITY;

-- Admins can read the ledger; service role (cron) writes via SECURITY DEFINER
-- functions or direct service-role insert. No client-side write policy.
CREATE POLICY "Admins can read lifecycle email ledger"
  ON public.lifecycle_emails_sent
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users may read their own lifecycle email history (for transparency/GDPR).
CREATE POLICY "Users can read their own lifecycle email history"
  ON public.lifecycle_emails_sent
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Mark onboarding for a course as complete (called from /welcome page).
CREATE OR REPLACE FUNCTION public.mark_onboarding_complete(_course_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET onboarding_completed_courses =
        CASE
          WHEN _course_id = ANY(onboarding_completed_courses)
            THEN onboarding_completed_courses
          ELSE array_append(onboarding_completed_courses, _course_id)
        END
  WHERE id = _uid;
END;
$$;