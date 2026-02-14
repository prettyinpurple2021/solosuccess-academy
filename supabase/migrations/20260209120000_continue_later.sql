-- Continue later / bookmarks: one "continue here" per user (lesson or textbook)
CREATE TABLE public.continue_later (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  textbook_page INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.continue_later ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own continue_later"
  ON public.continue_later FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own continue_later"
  ON public.continue_later FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own continue_later"
  ON public.continue_later FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own continue_later"
  ON public.continue_later FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_continue_later_user ON public.continue_later(user_id);
CREATE INDEX idx_continue_later_updated ON public.continue_later(updated_at DESC);

COMMENT ON TABLE public.continue_later IS 'User bookmark for "continue here" – one per user; lesson_id null means textbook, textbook_page optional.';
