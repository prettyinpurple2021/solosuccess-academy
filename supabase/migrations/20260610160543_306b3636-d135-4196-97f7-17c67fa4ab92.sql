-- Security fix: Replace weak substring match with strict path-based match.
-- The old policy used l.video_url LIKE '%' || storage.objects.name || '%',
-- which allowed any URL containing the filename anywhere.
-- The new policy requires the exact object path after /lesson-videos/.
DROP POLICY IF EXISTS "Purchased users can access lesson videos" ON storage.objects;

CREATE POLICY "Purchased users can access lesson videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-videos'
  AND EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE l.video_url LIKE '%/lesson-videos/' || storage.objects.name || '%'
    AND has_purchased_course(auth.uid(), c.id)
  )
);