
-- =============================================
-- 1. Learning Objectives Tracker: per-user checkoffs
-- =============================================
CREATE TABLE public.textbook_chapter_objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id uuid NOT NULL REFERENCES public.textbook_chapters(id) ON DELETE CASCADE,
  objective_text text NOT NULL,
  order_number integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.textbook_chapter_objectives ENABLE ROW LEVEL SECURITY;

-- Anyone who can view chapters can view objectives
CREATE POLICY "Anyone can view objectives"
  ON public.textbook_chapter_objectives FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage objectives"
  ON public.textbook_chapter_objectives FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User progress on objectives
CREATE TABLE public.user_objective_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  objective_id uuid NOT NULL REFERENCES public.textbook_chapter_objectives(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, objective_id)
);

ALTER TABLE public.user_objective_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own objective progress"
  ON public.user_objective_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own objective progress"
  ON public.user_objective_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own objective progress"
  ON public.user_objective_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own objective progress"
  ON public.user_objective_progress FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 2. Inline Discussion Threads on textbook paragraphs
-- =============================================
CREATE TABLE public.textbook_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  page_id uuid NOT NULL REFERENCES public.textbook_pages(id) ON DELETE CASCADE,
  paragraph_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES public.textbook_comments(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.textbook_comments ENABLE ROW LEVEL SECURITY;

-- All authenticated users who can view the page can view comments
CREATE POLICY "Authenticated users can view textbook comments"
  ON public.textbook_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own textbook comments"
  ON public.textbook_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own textbook comments"
  ON public.textbook_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own textbook comments"
  ON public.textbook_comments FOR DELETE
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_textbook_comments_updated_at
  BEFORE UPDATE ON public.textbook_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
