DROP POLICY IF EXISTS "Users can insert their own practice submissions" ON public.practice_submissions;
CREATE POLICY "Users can insert their own practice submissions"
ON public.practice_submissions FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.practice_labs pl
    JOIN public.lessons l ON l.id = pl.lesson_id
    WHERE pl.id = practice_submissions.practice_lab_id
      AND public.has_purchased_course(auth.uid(), l.course_id)
  )
);

DROP POLICY IF EXISTS "Students can manage their own exam attempts" ON public.student_exam_attempts;
CREATE POLICY "Students can view their own exam attempts"
ON public.student_exam_attempts FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Students can insert their own exam attempts"
ON public.student_exam_attempts FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.course_final_exams cfe
    WHERE cfe.id = student_exam_attempts.exam_id
      AND public.has_purchased_course(auth.uid(), cfe.course_id)
  )
);
CREATE POLICY "Students can update their own exam attempts"
ON public.student_exam_attempts FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.course_final_exams cfe
    WHERE cfe.id = student_exam_attempts.exam_id
      AND public.has_purchased_course(auth.uid(), cfe.course_id)
  )
);
CREATE POLICY "Students can delete their own exam attempts"
ON public.student_exam_attempts FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own textbook comments" ON public.textbook_comments;
CREATE POLICY "Users can create their own textbook comments"
ON public.textbook_comments FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.textbook_pages tp
    JOIN public.textbook_chapters tc ON tc.id = tp.chapter_id
    WHERE tp.id = textbook_comments.page_id
      AND public.has_purchased_course(auth.uid(), tc.course_id)
  )
);