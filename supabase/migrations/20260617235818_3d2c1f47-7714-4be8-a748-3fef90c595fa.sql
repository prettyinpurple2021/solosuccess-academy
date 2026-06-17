
-- Blog posts table: stores auto-generated and manual posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  meta_title text NOT NULL,
  description text NOT NULL,
  excerpt text NOT NULL,
  body_html text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  faq jsonb,
  reading_minutes integer NOT NULL DEFAULT 5,
  author_name text NOT NULL DEFAULT 'SoloSuccess Academy',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  generated_by text NOT NULL DEFAULT 'manual' CHECK (generated_by IN ('manual', 'ai-auto', 'ai-queue')),
  source_topic text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_status_published ON public.blog_posts (status, published_at DESC);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage all posts"
  ON public.blog_posts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_blog_posts_updated
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Topic queue: admins can seed keywords/titles; the generator pulls from here first
CREATE TABLE public.blog_topic_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  angle text,
  target_keyword text,
  priority integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'skipped')),
  used_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_topic_queue_status ON public.blog_topic_queue (status, priority DESC, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_topic_queue TO authenticated;
GRANT ALL ON public.blog_topic_queue TO service_role;

ALTER TABLE public.blog_topic_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage topic queue"
  ON public.blog_topic_queue FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_blog_topic_queue_updated
  BEFORE UPDATE ON public.blog_topic_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_cron + pg_net for the weekly auto-post cron (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
