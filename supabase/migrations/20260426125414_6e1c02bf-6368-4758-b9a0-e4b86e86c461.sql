-- Tighten course-assets storage bucket to fix linter warning 0025_public_bucket_allows_listing.
-- The bucket remains public so getPublicUrl() (CDN access) keeps working for existing
-- course covers and Plug-and-Play assets. We only remove the broad SELECT policy on
-- storage.objects, which previously allowed any client to LIST every file in the bucket.
-- Direct CDN reads of known object paths do not require this policy.

DROP POLICY IF EXISTS "Public read access for course assets" ON storage.objects;

-- Replace with admin-only listing. Regular users do not need to list; they consume
-- assets via stable public URLs constructed from known course IDs.
CREATE POLICY "Admins can list course assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-assets'
  AND public.has_role(auth.uid(), 'admin')
);