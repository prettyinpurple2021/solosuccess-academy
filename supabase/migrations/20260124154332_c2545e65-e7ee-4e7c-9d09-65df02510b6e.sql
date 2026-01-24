-- Add notification preference columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN email_notifications boolean NOT NULL DEFAULT true,
ADD COLUMN course_updates boolean NOT NULL DEFAULT true,
ADD COLUMN discussion_replies boolean NOT NULL DEFAULT true;