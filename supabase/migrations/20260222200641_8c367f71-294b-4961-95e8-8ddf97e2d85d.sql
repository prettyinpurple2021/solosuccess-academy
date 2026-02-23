-- Add activity_score column to user_progress for tracking activity completion percentage
ALTER TABLE public.user_progress
ADD COLUMN activity_score integer DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN public.user_progress.activity_score IS 'Percentage (0-100) of activity steps completed by the student';