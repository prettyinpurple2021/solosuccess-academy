
-- Drop broad authenticated SELECT policies; admins retain full access via existing ALL policy.
DROP POLICY IF EXISTS "Authenticated users can view grade settings" ON public.grade_settings;
DROP POLICY IF EXISTS "Authenticated users can view xp_config" ON public.xp_config;

-- Safe read helpers: SECURITY DEFINER so signed-in users can fetch config without direct table read.
CREATE OR REPLACE FUNCTION public.get_grade_settings()
RETURNS SETOF public.grade_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.grade_settings
  WHERE auth.uid() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_xp_config()
RETURNS SETOF public.xp_config
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.xp_config
  WHERE auth.uid() IS NOT NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.get_grade_settings() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_xp_config() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_grade_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_xp_config() TO authenticated;
