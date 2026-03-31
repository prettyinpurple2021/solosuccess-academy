-- 1. Add SELECT policy so students who purchased a course can view the final exam
CREATE POLICY "Students can view purchased course exams"
ON public.course_final_exams
FOR SELECT
TO authenticated
USING (public.has_purchased_course(auth.uid(), course_id));

-- 2. Fix notifications INSERT policy — allow service_role inserts
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Service role and self can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);