-- Add cover_image_url column to courses table for course thumbnails
ALTER TABLE public.courses ADD COLUMN cover_image_url text;