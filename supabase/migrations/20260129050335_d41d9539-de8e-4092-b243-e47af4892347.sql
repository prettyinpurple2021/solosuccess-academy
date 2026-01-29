-- Fix: All User Profile Data Exposed to Authenticated Users
-- Drop the overly permissive SELECT policy that exposes all profile fields
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;

-- Create a view with only public-safe fields (id, display_name, avatar_url)
-- This restricts what authenticated users can see for other profiles
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  display_name,
  avatar_url
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Note: The existing "Users can view their own profile" policy remains in place,
-- allowing users to see their own full profile including notification preferences.