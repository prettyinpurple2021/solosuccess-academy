
-- Admin-only write RPCs for platform settings.
-- All check has_role(auth.uid(), 'admin') and run as SECURITY DEFINER so we can
-- keep the tables locked down to the admin ALL policy without granting broader access.

CREATE OR REPLACE FUNCTION public.admin_upsert_grade_settings(
  _course_id uuid,
  _quiz_weight int,
  _activity_weight int,
  _worksheet_weight int,
  _exam_weight int,
  _essay_weight int
)
RETURNS public.grade_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _row public.grade_settings;
  _total int := COALESCE(_quiz_weight,0) + COALESCE(_activity_weight,0)
              + COALESCE(_worksheet_weight,0) + COALESCE(_exam_weight,0)
              + COALESCE(_essay_weight,0);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF _quiz_weight < 0 OR _activity_weight < 0 OR _worksheet_weight < 0
     OR _exam_weight < 0 OR _essay_weight < 0 THEN
    RAISE EXCEPTION 'Weights must be non-negative';
  END IF;
  IF _total <> 100 THEN
    RAISE EXCEPTION 'Weights must total 100 (got %)', _total;
  END IF;

  INSERT INTO public.grade_settings AS gs
    (course_id, quiz_weight, activity_weight, worksheet_weight, exam_weight, essay_weight)
  VALUES
    (_course_id, _quiz_weight, _activity_weight, _worksheet_weight, _exam_weight, _essay_weight)
  ON CONFLICT (course_id) DO UPDATE
    SET quiz_weight      = EXCLUDED.quiz_weight,
        activity_weight  = EXCLUDED.activity_weight,
        worksheet_weight = EXCLUDED.worksheet_weight,
        exam_weight      = EXCLUDED.exam_weight,
        essay_weight     = EXCLUDED.essay_weight,
        updated_at       = now()
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_grade_settings_override(_course_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF _course_id IS NULL THEN
    RAISE EXCEPTION 'Cannot delete the global defaults row';
  END IF;

  DELETE FROM public.grade_settings WHERE course_id = _course_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_xp_config(
  _id uuid,
  _xp_amount int,
  _label text DEFAULT NULL
)
RETURNS public.xp_config
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _row public.xp_config;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF _xp_amount < 0 OR _xp_amount > 100000 THEN
    RAISE EXCEPTION 'xp_amount out of range (0-100000)';
  END IF;

  UPDATE public.xp_config
     SET xp_amount = _xp_amount,
         label     = COALESCE(_label, label),
         updated_at = now()
   WHERE id = _id
  RETURNING * INTO _row;

  IF _row IS NULL THEN
    RAISE EXCEPTION 'XP config row not found';
  END IF;

  RETURN _row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_upsert_grade_settings(uuid,int,int,int,int,int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_grade_settings_override(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_xp_config(uuid,int,text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_upsert_grade_settings(uuid,int,int,int,int,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_grade_settings_override(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_xp_config(uuid,int,text) TO authenticated;
