
-- Portfolio Assembler: stores student-curated portfolio entries
-- Each entry represents a deliverable from one of the 9 courses
-- that the student has selected, refined, and narrated for their portfolio.

CREATE TABLE public.portfolio_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  -- Student-authored content
  title TEXT NOT NULL DEFAULT '',
  executive_summary TEXT NOT NULL DEFAULT '',
  connective_narrative TEXT NOT NULL DEFAULT '',
  
  -- The deliverable content pulled from their submissions
  deliverable_content TEXT NOT NULL DEFAULT '',
  
  -- Ordering within the portfolio
  order_number INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Each student can have one portfolio entry per course
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.portfolio_entries ENABLE ROW LEVEL SECURITY;

-- RLS: students own their portfolio entries
CREATE POLICY "Users can view their own portfolio entries"
  ON public.portfolio_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio entries"
  ON public.portfolio_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio entries"
  ON public.portfolio_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio entries"
  ON public.portfolio_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all portfolio entries"
  ON public.portfolio_entries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_portfolio_entries_updated_at
  BEFORE UPDATE ON public.portfolio_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
