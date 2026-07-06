
-- Re-verify course purchase on UPDATE for discussions
DROP POLICY IF EXISTS "Users can update their own discussions" ON public.discussions;
CREATE POLICY "Users can update their own discussions"
ON public.discussions
FOR UPDATE
USING (auth.uid() = user_id AND public.has_purchased_course(auth.uid(), course_id))
WITH CHECK (auth.uid() = user_id AND public.has_purchased_course(auth.uid(), course_id));

-- Re-verify course purchase on UPDATE for discussion_comments
DROP POLICY IF EXISTS "Users can update their own comments" ON public.discussion_comments;
CREATE POLICY "Users can update their own comments"
ON public.discussion_comments
FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.discussions d
    WHERE d.id = discussion_comments.discussion_id
      AND public.has_purchased_course(auth.uid(), d.course_id)
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.discussions d
    WHERE d.id = discussion_comments.discussion_id
      AND public.has_purchased_course(auth.uid(), d.course_id)
  )
);

-- Re-verify course purchase on DELETE for textbook_comments (admins still bypass)
DROP POLICY IF EXISTS "Users can delete their own textbook comments" ON public.textbook_comments;
CREATE POLICY "Users can delete their own textbook comments"
ON public.textbook_comments
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.textbook_pages tp
      JOIN public.textbook_chapters tc ON tc.id = tp.chapter_id
      WHERE tp.id = textbook_comments.page_id
        AND public.has_purchased_course(auth.uid(), tc.course_id)
    )
  )
);
