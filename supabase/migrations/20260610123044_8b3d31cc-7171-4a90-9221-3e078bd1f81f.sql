-- Restrict textbook_chapter_objectives SELECT: preview chapters are public,
-- non-preview chapter objectives require an active purchase (or admin).
DROP POLICY IF EXISTS "Anyone can view objectives" ON public.textbook_chapter_objectives;

CREATE POLICY "View objectives for preview or purchased chapters"
ON public.textbook_chapter_objectives
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.textbook_chapters tc
    WHERE tc.id = textbook_chapter_objectives.chapter_id
      AND (
        tc.is_preview = true
        OR public.has_purchased_course(auth.uid(), tc.course_id)
      )
  )
);