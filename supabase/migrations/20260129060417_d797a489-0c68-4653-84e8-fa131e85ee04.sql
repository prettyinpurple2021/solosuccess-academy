-- Fix 1 & 2: Ensure profiles_public view is properly secured for authenticated users only
-- Drop and recreate the view with proper security settings
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public 
WITH (security_invoker = on) AS
  SELECT id, display_name, avatar_url
  FROM public.profiles;

-- Revoke ALL access from anonymous and public roles
REVOKE ALL ON public.profiles_public FROM anon;
REVOKE ALL ON public.profiles_public FROM public;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Fix 3: Restrict certificate verification to specific code lookup only
-- Remove the overly permissive "Anyone can verify certificates" policy
-- and replace with a policy that only allows verification by specific code
DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.certificates;

-- Create a new policy that only allows SELECT when a specific verification_code is provided
-- This prevents full table enumeration while still allowing verification
CREATE POLICY "Verify certificates by code only"
ON public.certificates
FOR SELECT
TO anon, authenticated
USING (
  -- Only allow access when the query filters by a specific verification_code
  -- This is enforced by checking that the current_setting contains the code being verified
  -- Since RLS can't directly check query parameters, we use a permissive approach
  -- but the application should always query by verification_code
  true
);

-- Actually, the above approach won't work for restricting enumeration in RLS
-- Instead, let's use a security definer function for verification
DROP POLICY IF EXISTS "Verify certificates by code only" ON public.certificates;

-- Remove public access entirely - verification will go through an RPC function
-- Keep only the user's own certificates visible
-- The "Users can view their own certificates" policy already exists