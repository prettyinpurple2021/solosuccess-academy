ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS subtitle text;

UPDATE public.courses SET subtitle = CASE order_number
  WHEN 1  THEN 'Start Your Solo Business: Mindset & Foundations'
  WHEN 2  THEN 'Find Your Niche & Validate Your Business Idea'
  WHEN 3  THEN 'Build Your Personal Brand as a Solopreneur'
  WHEN 4  THEN 'Automate Your Solo Business with AI Agents'
  WHEN 5  THEN 'Build Repeatable Systems & SOPs for Solo Founders'
  WHEN 6  THEN 'SEO & Content Marketing for Solopreneurs'
  WHEN 7  THEN 'Bootstrap Your Business on a Lean Budget'
  WHEN 8  THEN 'Sales & Customer Acquisition for Solo Founders'
  WHEN 9  THEN 'Scale Your Solo Business with AI & Outsourcing'
  WHEN 10 THEN 'Launch Your Business: Portfolio & Pitch Day'
END
WHERE order_number BETWEEN 1 AND 10;