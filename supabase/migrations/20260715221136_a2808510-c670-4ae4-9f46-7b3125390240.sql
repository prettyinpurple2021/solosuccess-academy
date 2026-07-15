
ALTER TABLE public.user_flashcards
  ADD COLUMN IF NOT EXISTS source_lesson_id uuid NULL REFERENCES public.lessons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_flashcards_user_lesson_idx
  ON public.user_flashcards(user_id, source_lesson_id)
  WHERE source_lesson_id IS NOT NULL;
