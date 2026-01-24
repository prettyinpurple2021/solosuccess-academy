-- Create textbook_chapters table for organizing content by course
CREATE TABLE public.textbook_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  title text NOT NULL,
  order_number integer NOT NULL,
  is_preview boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create textbook_pages table for individual pages within chapters
CREATE TABLE public.textbook_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES public.textbook_chapters(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL DEFAULT '',
  page_number integer NOT NULL,
  embedded_quiz jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_textbook_highlights for student annotations
CREATE TABLE public.user_textbook_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_id uuid REFERENCES public.textbook_pages(id) ON DELETE CASCADE NOT NULL,
  start_offset integer NOT NULL,
  end_offset integer NOT NULL,
  color text NOT NULL DEFAULT 'yellow',
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_textbook_bookmarks for tracking reading progress
CREATE TABLE public.user_textbook_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES public.textbook_chapters(id) ON DELETE CASCADE NOT NULL,
  page_id uuid REFERENCES public.textbook_pages(id) ON DELETE CASCADE NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on all tables
ALTER TABLE public.textbook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textbook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_textbook_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_textbook_bookmarks ENABLE ROW LEVEL SECURITY;

-- Textbook chapters: anyone can view preview chapters, purchased users can view all
CREATE POLICY "Anyone can view preview chapters"
  ON public.textbook_chapters FOR SELECT
  USING (is_preview = true);

CREATE POLICY "Purchased users can view all chapters"
  ON public.textbook_chapters FOR SELECT
  USING (has_purchased_course(auth.uid(), course_id));

CREATE POLICY "Admins can manage chapters"
  ON public.textbook_chapters FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Textbook pages: viewable if chapter is accessible
CREATE POLICY "Users can view pages of accessible chapters"
  ON public.textbook_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.textbook_chapters tc
      WHERE tc.id = textbook_pages.chapter_id
      AND (tc.is_preview = true OR has_purchased_course(auth.uid(), tc.course_id))
    )
  );

CREATE POLICY "Admins can manage pages"
  ON public.textbook_pages FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- User highlights: users can manage their own
CREATE POLICY "Users can view their own highlights"
  ON public.user_textbook_highlights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own highlights"
  ON public.user_textbook_highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
  ON public.user_textbook_highlights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
  ON public.user_textbook_highlights FOR DELETE
  USING (auth.uid() = user_id);

-- User bookmarks: users can manage their own
CREATE POLICY "Users can view their own bookmarks"
  ON public.user_textbook_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON public.user_textbook_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON public.user_textbook_bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.user_textbook_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_textbook_chapters_updated_at
  BEFORE UPDATE ON public.textbook_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_textbook_pages_updated_at
  BEFORE UPDATE ON public.textbook_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();