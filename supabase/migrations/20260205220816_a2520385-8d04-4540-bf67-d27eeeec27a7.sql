-- Fix Avatar Storage Bucket Security
-- 1. Make the avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- 2. Drop the existing overly permissive public access policy
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

-- 3. Create authenticated-only SELECT policy for avatars
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- 4. Add RLS policy to profiles_public view to require authentication
-- First, enable RLS on the view (views inherit from base table but we need explicit policy)
-- Since profiles_public is a view with security_invoker=on, we need to add a policy on the base profiles table
-- that allows authenticated users to see public profile data

-- Add a policy for authenticated users to view any profile's public data (display_name, avatar_url)
-- This works because profiles_public view uses security_invoker and will check RLS
CREATE POLICY "Authenticated users can view all profiles public data"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);