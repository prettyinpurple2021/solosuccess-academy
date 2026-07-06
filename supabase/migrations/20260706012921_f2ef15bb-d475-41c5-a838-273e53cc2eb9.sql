
-- ============================================================
-- Harden EXECUTE grants on every SECURITY DEFINER / public function.
-- Default REVOKE from PUBLIC, anon, authenticated; grant back per role.
-- service_role always retains access (superuser-equivalent).
-- ============================================================

-- ---------- INTERNAL / TRIGGER / CRON (no grants) ----------
REVOKE ALL ON FUNCTION public.update_updated_at_column()                          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user()                                   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_admin_progress_fields()                     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_wake()                                  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_dispatch()                              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_expired_rate_limits()                       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb)                          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint)                          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer)            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, text, integer, integer) FROM PUBLIC, anon, authenticated;

-- ---------- POLICY HELPERS (must be executable so RLS evaluates) ----------
-- Grant to both anon & authenticated; the functions themselves check auth.uid().
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.has_purchased_course(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_purchased_course(uuid, uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.has_completed_course(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_completed_course(uuid, uuid) TO anon, authenticated;

-- ---------- AUTHENTICATED-ONLY RPCs (revoke anon) ----------
REVOKE ALL ON FUNCTION public.cancel_account_deletion()                 FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.cancel_account_deletion()             TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_deletion_request()                 FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_deletion_request()             TO authenticated;

REVOKE ALL ON FUNCTION public.request_account_deletion(boolean)         FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.request_account_deletion(boolean)     TO authenticated;

REVOKE ALL ON FUNCTION public.award_xp(uuid, integer, text)             FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.award_xp(uuid, integer, text)         TO authenticated;

REVOKE ALL ON FUNCTION public.consume_mfa_recovery_code(text)           FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.consume_mfa_recovery_code(text)       TO authenticated;

REVOKE ALL ON FUNCTION public.confirm_mfa_recovery_code(text)           FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.confirm_mfa_recovery_code(text)       TO authenticated;

REVOKE ALL ON FUNCTION public.generate_mfa_recovery_codes()             FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.generate_mfa_recovery_codes()         TO authenticated;

REVOKE ALL ON FUNCTION public.mark_onboarding_complete(uuid)            FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.mark_onboarding_complete(uuid)        TO authenticated;

REVOKE ALL ON FUNCTION public.get_textbook_pages_for_student(uuid)      FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_textbook_pages_for_student(uuid)  TO authenticated;

REVOKE ALL ON FUNCTION public.search_textbook_pages_for_student(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.search_textbook_pages_for_student(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.check_textbook_quiz_answer(uuid, integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.check_textbook_quiz_answer(uuid, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.get_exam_for_student(uuid)                FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_exam_for_student(uuid)            TO authenticated;

REVOKE ALL ON FUNCTION public.grade_and_submit_exam(uuid, jsonb)        FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.grade_and_submit_exam(uuid, jsonb)    TO authenticated;

REVOKE ALL ON FUNCTION public.get_overall_progress(uuid)                FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_overall_progress(uuid)            TO authenticated;

REVOKE ALL ON FUNCTION public.set_admin_api_key(text, text, boolean, text)    FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_admin_api_key(text, text, boolean, text) TO authenticated;

REVOKE ALL ON FUNCTION public.set_admin_api_key_enabled(text, boolean)  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.set_admin_api_key_enabled(text, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.list_admin_api_keys(text)                 FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.list_admin_api_keys(text)             TO authenticated;

-- ---------- INTENTIONALLY PUBLIC (anon + authenticated) ----------
REVOKE ALL ON FUNCTION public.verify_certificate_by_code(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.verify_certificate_by_code(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_course_lesson_outline(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_course_lesson_outline(uuid) TO anon, authenticated;
