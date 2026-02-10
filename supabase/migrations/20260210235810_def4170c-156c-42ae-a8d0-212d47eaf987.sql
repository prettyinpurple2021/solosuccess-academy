
-- Create continue_later table for tracking where students left off
CREATE TABLE public.continue_later (
  user_id UUID NOT NULL PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id),
  lesson_id UUID REFERENCES public.lessons(id),
  textbook_page INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.continue_later ENABLE ROW LEVEL SECURITY;

-- Users can view their own continue_later record
CREATE POLICY "Users can view their own continue_later"
  ON public.continue_later FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own continue_later record
CREATE POLICY "Users can insert their own continue_later"
  ON public.continue_later FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own continue_later record
CREATE POLICY "Users can update their own continue_later"
  ON public.continue_later FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own continue_later record
CREATE POLICY "Users can delete their own continue_later"
  ON public.continue_later FOR DELETE
  USING (auth.uid() = user_id);
