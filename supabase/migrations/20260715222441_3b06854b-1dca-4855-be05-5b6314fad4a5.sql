
-- 1) discussion_comments DELETE policy: require continued course purchase (or admin)
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.discussion_comments;
CREATE POLICY "Users can delete their own comments"
ON public.discussion_comments
FOR DELETE
USING (
  (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.discussions d
      WHERE d.id = discussion_comments.discussion_id
        AND public.has_purchased_course(auth.uid(), d.course_id)
    )
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 2) notifications INSERT: restrict self-inserts to a safe whitelist of types.
--    System notifications continue to be inserted by service_role (bypasses RLS).
DROP POLICY IF EXISTS "Service role and self can insert notifications" ON public.notifications;
CREATE POLICY "Users can self-insert whitelisted notification types"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND type IN ('badge_earned')
);

-- 3) course_projects realtime: exclude admin-only grading fields from broadcast.
--    Owners keep normal SELECT access via queries; realtime just won't stream
--    in-progress admin notes or internal AI-proposed scores.
ALTER PUBLICATION supabase_realtime DROP TABLE public.course_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_projects
  (id, user_id, course_id, submission_content, file_urls, ai_feedback,
   ai_feedback_at, status, submitted_at, created_at, updated_at,
   admin_status, admin_score, graded_at, current_version);
