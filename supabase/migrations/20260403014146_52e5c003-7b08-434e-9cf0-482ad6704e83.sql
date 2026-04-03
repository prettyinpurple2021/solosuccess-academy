-- Allow public viewing of lessons for published courses
-- This lets potential buyers see the lesson list (titles, types) on course pages
CREATE POLICY "Anyone can view lessons of published courses"
ON public.lessons
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = lessons.course_id
    AND courses.is_published = true
  )
);