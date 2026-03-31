
-- Practice Labs: stores the hands-on exercise prompt for each lesson
-- Each lesson can have one practice lab with instructions for hands-on skill building
CREATE TABLE public.practice_labs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  deliverable_description TEXT NOT NULL,
  estimated_minutes INTEGER DEFAULT 15,
  difficulty TEXT NOT NULL DEFAULT 'intermediate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id)
);

-- Practice Submissions: stores student work for each practice lab
CREATE TABLE public.practice_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_lab_id UUID NOT NULL REFERENCES public.practice_labs(id) ON DELETE CASCADE,
  submission_content TEXT NOT NULL DEFAULT '',
  file_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  score INTEGER,
  ai_feedback TEXT,
  ai_feedback_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, practice_lab_id)
);

-- Enable RLS
ALTER TABLE public.practice_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_submissions ENABLE ROW LEVEL SECURITY;

-- Practice Labs RLS: Admins manage, students view for purchased courses
CREATE POLICY "Admins can manage practice labs"
  ON public.practice_labs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view practice labs for purchased courses"
  ON public.practice_labs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = practice_labs.lesson_id
      AND public.has_purchased_course(auth.uid(), c.id)
  ));

-- Practice Submissions RLS: Students manage their own
CREATE POLICY "Users can view their own practice submissions"
  ON public.practice_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice submissions"
  ON public.practice_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice submissions"
  ON public.practice_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own practice submissions"
  ON public.practice_submissions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all practice submissions"
  ON public.practice_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update practice submissions for grading"
  ON public.practice_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at timestamps
CREATE TRIGGER update_practice_labs_updated_at
  BEFORE UPDATE ON public.practice_labs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_practice_submissions_updated_at
  BEFORE UPDATE ON public.practice_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
