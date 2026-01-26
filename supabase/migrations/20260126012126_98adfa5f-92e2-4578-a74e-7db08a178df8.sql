-- Fix: Allow authenticated users to view basic profile information for discussions
-- This enables the discussion board to show author names and avatars
CREATE POLICY "Authenticated users can view public profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);