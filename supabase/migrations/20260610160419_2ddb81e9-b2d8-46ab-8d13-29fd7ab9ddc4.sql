-- Security fix: Prevent students from reading exam answers directly.
-- Students already fetch exams via the get_exam_for_student RPC,
-- which strips correctIndex / correctAnswer / correctBoolean fields.
DROP POLICY IF EXISTS "Students can view purchased course exams" ON public.course_final_exams;
