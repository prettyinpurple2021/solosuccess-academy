ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_goal text,
  ADD COLUMN IF NOT EXISTS weekly_commitment_hours int,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

UPDATE public.profiles
SET onboarding_completed_at = now()
WHERE onboarding_completed_at IS NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_weekly_commitment_hours_range;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_weekly_commitment_hours_range
  CHECK (weekly_commitment_hours IS NULL OR (weekly_commitment_hours BETWEEN 1 AND 40));