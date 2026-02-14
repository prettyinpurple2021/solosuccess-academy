
-- Restrict profiles_public view to authenticated users only
REVOKE ALL ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Restrict leaderboard_view to authenticated users only
REVOKE ALL ON public.leaderboard_view FROM anon;
GRANT SELECT ON public.leaderboard_view TO authenticated;
