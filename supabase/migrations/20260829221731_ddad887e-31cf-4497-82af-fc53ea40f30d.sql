REVOKE ALL ON FUNCTION public.is_privileged_grader() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_course_project_grading() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_practice_submission_grading() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_essay_submission_grading() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_exam_attempt_grading() FROM anon, authenticated;