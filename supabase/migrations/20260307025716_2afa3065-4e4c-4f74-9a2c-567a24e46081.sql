
-- Add quiz_attempts column to track how many times a student has taken each quiz
ALTER TABLE public.user_progress
ADD COLUMN quiz_attempts integer NOT NULL DEFAULT 0;

-- Add a comment explaining the column
COMMENT ON COLUMN public.user_progress.quiz_attempts IS 'Number of quiz attempts taken by the student (max 3 allowed)';
