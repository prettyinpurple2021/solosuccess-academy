
-- =============================================
-- Phase 2: Project Milestones & Rubric Scorecard
-- =============================================

-- 1. Milestone definitions per course (admin-managed, 3-4 per course)
CREATE TABLE public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  deliverable_prompt text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, order_number)
);

-- 2. Rubric categories per course (e.g. Clarity, Depth, Practicality)
CREATE TABLE public.project_rubric_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  max_points integer NOT NULL DEFAULT 10,
  order_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, order_number)
);

-- 3. Student milestone submissions (one per user per milestone)
CREATE TABLE public.project_milestone_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  milestone_id uuid NOT NULL REFERENCES public.project_milestones(id) ON DELETE CASCADE,
  submission_content text NOT NULL DEFAULT '',
  file_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',  -- draft | submitted | reviewed
  ai_feedback text,
  ai_feedback_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone_id)
);

-- 4. Rubric scores per milestone submission (one score per category per submission)
CREATE TABLE public.project_rubric_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.project_milestone_submissions(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.project_rubric_categories(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, category_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_rubric_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestone_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_rubric_scores ENABLE ROW LEVEL SECURITY;

-- === RLS: project_milestones (admin manages, students view for purchased courses) ===
CREATE POLICY "Admins can manage milestones"
  ON public.project_milestones FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view milestones for purchased courses"
  ON public.project_milestones FOR SELECT
  USING (public.has_purchased_course(auth.uid(), course_id));

-- === RLS: project_rubric_categories (admin manages, students view for purchased courses) ===
CREATE POLICY "Admins can manage rubric categories"
  ON public.project_rubric_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view rubric categories for purchased courses"
  ON public.project_rubric_categories FOR SELECT
  USING (public.has_purchased_course(auth.uid(), course_id));

-- === RLS: project_milestone_submissions (students own their submissions) ===
CREATE POLICY "Users can view their own milestone submissions"
  ON public.project_milestone_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestone submissions"
  ON public.project_milestone_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestone submissions"
  ON public.project_milestone_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestone submissions"
  ON public.project_milestone_submissions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all milestone submissions"
  ON public.project_milestone_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update milestone submissions"
  ON public.project_milestone_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- === RLS: project_rubric_scores (students view their own, admins manage) ===
CREATE POLICY "Users can view their own rubric scores"
  ON public.project_rubric_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.project_milestone_submissions pms
    WHERE pms.id = project_rubric_scores.submission_id
      AND pms.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage rubric scores"
  ON public.project_rubric_scores FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Timestamps triggers
CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_milestone_submissions_updated_at
  BEFORE UPDATE ON public.project_milestone_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
