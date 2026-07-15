
-- Add project_weight to grade_settings for weighting course capstone projects
ALTER TABLE public.grade_settings
  ADD COLUMN IF NOT EXISTS project_weight integer NOT NULL DEFAULT 0;

-- Update the upsert RPC to accept project_weight and validate total = 100
CREATE OR REPLACE FUNCTION public.admin_upsert_grade_settings(
  _course_id uuid,
  _quiz_weight integer,
  _activity_weight integer,
  _worksheet_weight integer,
  _exam_weight integer,
  _essay_weight integer,
  _project_weight integer DEFAULT 0
)
RETURNS grade_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _row public.grade_settings;
  _total int := COALESCE(_quiz_weight,0) + COALESCE(_activity_weight,0)
              + COALESCE(_worksheet_weight,0) + COALESCE(_exam_weight,0)
              + COALESCE(_essay_weight,0) + COALESCE(_project_weight,0);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF _quiz_weight < 0 OR _activity_weight < 0 OR _worksheet_weight < 0
     OR _exam_weight < 0 OR _essay_weight < 0 OR _project_weight < 0 THEN
    RAISE EXCEPTION 'Weights must be non-negative';
  END IF;
  IF _total <> 100 THEN
    RAISE EXCEPTION 'Weights must total 100 (got %)', _total;
  END IF;

  INSERT INTO public.grade_settings AS gs
    (course_id, quiz_weight, activity_weight, worksheet_weight, exam_weight, essay_weight, project_weight)
  VALUES
    (_course_id, _quiz_weight, _activity_weight, _worksheet_weight, _exam_weight, _essay_weight, _project_weight)
  ON CONFLICT (course_id) DO UPDATE
    SET quiz_weight      = EXCLUDED.quiz_weight,
        activity_weight  = EXCLUDED.activity_weight,
        worksheet_weight = EXCLUDED.worksheet_weight,
        exam_weight      = EXCLUDED.exam_weight,
        essay_weight     = EXCLUDED.essay_weight,
        project_weight   = EXCLUDED.project_weight,
        updated_at       = now()
  RETURNING * INTO _row;

  RETURN _row;
END;
$function$;
