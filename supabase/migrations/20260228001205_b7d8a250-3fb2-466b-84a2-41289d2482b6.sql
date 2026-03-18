-- Create a public storage bucket for downloadable course assets (plug-and-play bonuses)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view/download course assets (they're bonus files for purchased students,
-- but access control is handled at the app level since the asset names aren't guessable)
CREATE POLICY "Public read access for course assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-assets');

-- Only admins can upload/manage course assets
CREATE POLICY "Admins can upload course assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-assets'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update course assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-assets'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete course assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-assets'
  AND public.has_role(auth.uid(), 'admin')
);