
-- 1. Lessons: remove broad public read, expose only metadata via RPC
DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON public.lessons;

CREATE OR REPLACE FUNCTION public.get_course_lesson_outline(_course_id uuid)
RETURNS TABLE(
  id uuid,
  course_id uuid,
  order_number integer,
  title text,
  description text,
  type lesson_type,
  duration_minutes integer,
  is_published boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT l.id, l.course_id, l.order_number, l.title, l.description, l.type,
         l.duration_minutes, l.is_published, l.created_at, l.updated_at
  FROM public.lessons l
  INNER JOIN public.courses c ON c.id = l.course_id
  WHERE l.course_id = _course_id
    AND c.is_published = true
  ORDER BY l.order_number;
$$;

REVOKE EXECUTE ON FUNCTION public.get_course_lesson_outline(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_lesson_outline(uuid) TO anon, authenticated;

-- 2. textbook_comments: scope SELECT to purchased course
DROP POLICY IF EXISTS "Authenticated users can view textbook comments" ON public.textbook_comments;
CREATE POLICY "Users view comments on purchased course pages"
ON public.textbook_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.textbook_pages tp
    JOIN public.textbook_chapters tc ON tc.id = tp.chapter_id
    WHERE tp.id = textbook_comments.page_id
      AND public.has_purchased_course(auth.uid(), tc.course_id)
  )
);

-- 3. textbook_pages: require purchase for direct table reads
-- Preview content for non-purchasers is still available via get_textbook_pages_for_student()
-- which strips embedded quiz answers server-side.
DROP POLICY IF EXISTS "Users can view pages of accessible chapters" ON public.textbook_pages;
CREATE POLICY "Purchased users view textbook pages"
ON public.textbook_pages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.textbook_chapters tc
    WHERE tc.id = textbook_pages.chapter_id
      AND public.has_purchased_course(auth.uid(), tc.course_id)
  )
);

-- 4. Lock down SECURITY DEFINER function exposure
-- Service-role-only helpers: revoke from anon AND authenticated
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_admin_progress_fields() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- Authenticated-only user-facing RPCs: revoke from anon
REVOKE EXECUTE ON FUNCTION public.cancel_account_deletion() FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_account_deletion(boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_deletion_request() FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_onboarding_complete(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_mfa_recovery_codes() FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirm_mfa_recovery_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_mfa_recovery_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_textbook_quiz_answer(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_textbook_pages_for_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_exam_for_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grade_and_submit_exam(uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_overall_progress(uuid) FROM anon;
-- verify_certificate_by_code remains accessible to anon (public verification page)
-- has_role, has_purchased_course, has_completed_course used in RLS — keep accessible
