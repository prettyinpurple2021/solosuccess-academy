-- Create lesson-videos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-videos', 'lesson-videos', true);

-- Allow admins to upload lesson videos
CREATE POLICY "Admins can upload lesson videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-videos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update lesson videos
CREATE POLICY "Admins can update lesson videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-videos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete lesson videos
CREATE POLICY "Admins can delete lesson videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-videos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow public read access to lesson videos
CREATE POLICY "Lesson videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-videos');

-- Add quiz_data column to lessons table for storing quiz questions
ALTER TABLE public.lessons
ADD COLUMN quiz_data jsonb DEFAULT NULL,
ADD COLUMN worksheet_data jsonb DEFAULT NULL,
ADD COLUMN activity_data jsonb DEFAULT NULL;