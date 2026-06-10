-- Security fix: user_progress UPDATE policy lacked purchase verification.
-- A student could update completion status for lessons in unpurchased courses.
-- The INSERT policy already enforced this; this brings UPDATE in line.
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = user_progress.lesson_id
      AND has_purchased_course(auth.uid(), c.id)
    )
  );