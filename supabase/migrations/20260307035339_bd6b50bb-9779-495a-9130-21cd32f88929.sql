
-- Table to store individual reading sessions
CREATE TABLE public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reading sessions
CREATE POLICY "Users can insert their own reading sessions"
  ON public.reading_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reading sessions
CREATE POLICY "Users can update their own reading sessions"
  ON public.reading_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view their own reading sessions
CREATE POLICY "Users can view their own reading sessions"
  ON public.reading_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all reading sessions
CREATE POLICY "Admins can view all reading sessions"
  ON public.reading_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
