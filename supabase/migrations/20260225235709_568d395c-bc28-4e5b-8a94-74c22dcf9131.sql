-- Add exam and essay weight columns to grade_settings
ALTER TABLE public.grade_settings
  ADD COLUMN exam_weight integer NOT NULL DEFAULT 0,
  ADD COLUMN essay_weight integer NOT NULL DEFAULT 0;

-- Update the existing default weights so the old 50/30/20 still sums to 100
-- (exam and essay default to 0, so no data change needed)
