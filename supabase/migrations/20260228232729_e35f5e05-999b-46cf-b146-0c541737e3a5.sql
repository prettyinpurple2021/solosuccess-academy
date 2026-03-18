
-- Create a table for storing contact form submissions
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'contact', -- 'contact' or 'help-center'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view submissions (students shouldn't see other people's messages)
CREATE POLICY "Admins can view all contact submissions"
  ON public.contact_submissions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- No direct user inserts — submissions go through the edge function with service role
CREATE POLICY "No direct user inserts on contact_submissions"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (false);

-- No updates or deletes by anyone except admins
CREATE POLICY "Admins can delete contact submissions"
  ON public.contact_submissions
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "No user updates on contact_submissions"
  ON public.contact_submissions
  FOR UPDATE
  USING (false);
