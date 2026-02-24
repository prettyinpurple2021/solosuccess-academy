
-- ============================================================
-- 1. Grade Settings: global + per-course weight overrides
-- ============================================================
CREATE TABLE public.grade_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  quiz_weight integer NOT NULL DEFAULT 50,
  activity_weight integer NOT NULL DEFAULT 30,
  worksheet_weight integer NOT NULL DEFAULT 20,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT weights_sum_100 CHECK (quiz_weight + activity_weight + worksheet_weight = 100),
  CONSTRAINT weights_non_negative CHECK (quiz_weight >= 0 AND activity_weight >= 0 AND worksheet_weight >= 0),
  UNIQUE (course_id)
);

-- Allow one global row (course_id IS NULL)
CREATE UNIQUE INDEX grade_settings_global_unique ON public.grade_settings ((course_id IS NULL)) WHERE course_id IS NULL;

ALTER TABLE public.grade_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage grade settings"
  ON public.grade_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view grade settings"
  ON public.grade_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_grade_settings_updated_at
  BEFORE UPDATE ON public.grade_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. Course Final Exams (mixed format: MCQ, short_answer, true_false)
-- ============================================================
CREATE TABLE public.course_final_exams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text,
  passing_score integer NOT NULL DEFAULT 70,
  question_count integer NOT NULL DEFAULT 15,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (course_id)
);

ALTER TABLE public.course_final_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage final exams"
  ON public.course_final_exams FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view purchased course exams"
  ON public.course_final_exams FOR SELECT
  USING (public.has_purchased_course(auth.uid(), course_id));

CREATE TRIGGER update_course_final_exams_updated_at
  BEFORE UPDATE ON public.course_final_exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. Student Exam Attempts
-- ============================================================
CREATE TABLE public.student_exam_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  exam_id uuid NOT NULL REFERENCES public.course_final_exams(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  passed boolean DEFAULT false,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.student_exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own exam attempts"
  ON public.student_exam_attempts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all exam attempts"
  ON public.student_exam_attempts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_student_exam_attempts_updated_at
  BEFORE UPDATE ON public.student_exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. Course Essays (prompts + rubrics)
-- ============================================================
CREATE TABLE public.course_essays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  prompts jsonb NOT NULL DEFAULT '[]'::jsonb,
  rubric jsonb NOT NULL DEFAULT '{}'::jsonb,
  word_limit integer DEFAULT 1500,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (course_id)
);

ALTER TABLE public.course_essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage essays"
  ON public.course_essays FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view purchased course essays"
  ON public.course_essays FOR SELECT
  USING (public.has_purchased_course(auth.uid(), course_id));

CREATE TRIGGER update_course_essays_updated_at
  BEFORE UPDATE ON public.course_essays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. Student Essay Submissions with AI grading
-- ============================================================
CREATE TABLE public.student_essay_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  essay_id uuid NOT NULL REFERENCES public.course_essays(id) ON DELETE CASCADE,
  selected_prompt_index integer NOT NULL DEFAULT 0,
  content text NOT NULL DEFAULT '',
  word_count integer DEFAULT 0,
  ai_score integer,
  ai_feedback text,
  ai_rubric_scores jsonb,
  ai_graded_at timestamp with time zone,
  admin_score integer,
  admin_feedback text,
  admin_graded_at timestamp with time zone,
  submitted_at timestamp with time zone,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.student_essay_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own essay submissions"
  ON public.student_essay_submissions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all essay submissions"
  ON public.student_essay_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update essay submissions for grading"
  ON public.student_essay_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_student_essay_submissions_updated_at
  BEFORE UPDATE ON public.student_essay_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Seed default global grade settings (50/30/20)
-- ============================================================
INSERT INTO public.grade_settings (course_id, quiz_weight, activity_weight, worksheet_weight)
VALUES (NULL, 50, 30, 20);
