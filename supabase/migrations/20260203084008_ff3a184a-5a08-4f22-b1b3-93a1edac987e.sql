-- Add RLS policy to profiles_public view to restrict access to authenticated users only
-- First, recreate the view with security_invoker to respect RLS
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public 
WITH (security_invoker = on)
AS
SELECT 
  p.id,
  p.display_name,
  p.avatar_url
FROM public.profiles p;

-- Grant select to authenticated users only
REVOKE ALL ON public.profiles_public FROM anon;
REVOKE ALL ON public.profiles_public FROM public;
GRANT SELECT ON public.profiles_public TO authenticated;