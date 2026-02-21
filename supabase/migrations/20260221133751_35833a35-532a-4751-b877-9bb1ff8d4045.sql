-- Add a JSONB column to store worksheet answers and self-check state
ALTER TABLE public.user_progress
  ADD COLUMN worksheet_answers jsonb DEFAULT NULL;