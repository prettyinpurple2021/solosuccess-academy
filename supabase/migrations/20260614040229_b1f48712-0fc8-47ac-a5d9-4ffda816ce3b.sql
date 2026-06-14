
-- 1) has_completed_course: only count published lessons
CREATE OR REPLACE FUNCTION public.has_completed_course(_user_id uuid, _course_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (
    SELECT COUNT(*) FROM public.lessons
    WHERE course_id = _course_id AND is_published = true
  ) > 0
  AND (
    SELECT COUNT(*) FROM public.lessons
    WHERE course_id = _course_id AND is_published = true
  ) = (
    SELECT COUNT(*)
    FROM public.user_progress up
    INNER JOIN public.lessons l ON l.id = up.lesson_id
    WHERE up.user_id = _user_id
      AND l.course_id = _course_id
      AND l.is_published = true
      AND up.completed = true
  );
$function$;

-- 2) Tighten lesson-videos read policy: anchor object name to end of path
DROP POLICY IF EXISTS "Purchased users can access lesson videos" ON storage.objects;

CREATE POLICY "Purchased users can access lesson videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-videos'
  AND EXISTS (
    SELECT 1
    FROM public.lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE l.video_url ~ ('/lesson-videos/' || regexp_replace(objects.name, '([.\\+*?()\[\]{}|^$])', '\\\1', 'g') || '($|\?)')
      AND public.has_purchased_course(auth.uid(), c.id)
  )
);
