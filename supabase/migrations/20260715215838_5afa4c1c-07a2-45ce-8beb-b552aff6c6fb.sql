-- Add tables to the realtime publication (safe if already added elsewhere)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.course_projects;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_gamification;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_days;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_progress;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Ensure Realtime delivers full row payloads (not just IDs) for filtered subscriptions
ALTER TABLE public.course_projects REPLICA IDENTITY FULL;
ALTER TABLE public.user_gamification REPLICA IDENTITY FULL;
ALTER TABLE public.user_activity_days REPLICA IDENTITY FULL;
ALTER TABLE public.user_progress REPLICA IDENTITY FULL;