
-- Partial unique index for non-course-scoped lifecycle emails (drip to signups, etc.)
CREATE UNIQUE INDEX IF NOT EXISTS lifecycle_unique_per_user_kind_no_course
  ON public.lifecycle_emails_sent (user_id, kind)
  WHERE course_id IS NULL;

-- Testimonials table
CREATE TYPE public.testimonial_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  quote text NOT NULL CHECK (char_length(quote) BETWEEN 20 AND 1000),
  author_name text NOT NULL,
  author_role text,
  status public.testimonial_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

CREATE INDEX idx_testimonials_status ON public.testimonials(status);
CREATE INDEX idx_testimonials_user ON public.testimonials(user_id);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials"
  ON public.testimonials FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view their own testimonials"
  ON public.testimonials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all testimonials"
  ON public.testimonials FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can update own pending testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
