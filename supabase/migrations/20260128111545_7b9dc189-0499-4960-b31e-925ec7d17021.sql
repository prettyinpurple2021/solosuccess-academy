-- Create user_gamification table for XP and streaks
CREATE TABLE public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own gamification data"
  ON public.user_gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification data"
  ON public.user_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification data"
  ON public.user_gamification FOR UPDATE
  USING (auth.uid() = user_id);

-- Create achievement_badges table for badge definitions
CREATE TABLE public.achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  category TEXT NOT NULL DEFAULT 'general',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (public read)
ALTER TABLE public.achievement_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON public.achievement_badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage badges"
  ON public.achievement_badges FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create user_badges table for earned badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.achievement_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all earned badges for leaderboard"
  ON public.user_badges FOR SELECT
  USING (true);

CREATE POLICY "System can insert badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default achievement badges
INSERT INTO public.achievement_badges (slug, name, description, icon, category, xp_reward, criteria_type, criteria_value) VALUES
  -- Lesson badges
  ('first_lesson', 'First Steps', 'Complete your first lesson', 'play', 'lessons', 50, 'lessons_completed', 1),
  ('lessons_5', 'Getting Started', 'Complete 5 lessons', 'book-open', 'lessons', 100, 'lessons_completed', 5),
  ('lessons_10', 'Dedicated Learner', 'Complete 10 lessons', 'book-open', 'lessons', 200, 'lessons_completed', 10),
  ('lessons_25', 'Knowledge Seeker', 'Complete 25 lessons', 'graduation-cap', 'lessons', 500, 'lessons_completed', 25),
  
  -- Course badges
  ('first_course', 'Course Champion', 'Complete your first course', 'award', 'courses', 500, 'courses_completed', 1),
  ('courses_3', 'Triple Threat', 'Complete 3 courses', 'trophy', 'courses', 1000, 'courses_completed', 3),
  
  -- Streak badges
  ('streak_3', 'On Fire', '3-day learning streak', 'flame', 'streaks', 75, 'streak_days', 3),
  ('streak_7', 'Week Warrior', '7-day learning streak', 'flame', 'streaks', 150, 'streak_days', 7),
  ('streak_14', 'Unstoppable', '14-day learning streak', 'zap', 'streaks', 300, 'streak_days', 14),
  ('streak_30', 'Monthly Master', '30-day learning streak', 'crown', 'streaks', 750, 'streak_days', 30),
  
  -- XP badges
  ('xp_100', 'Rising Star', 'Earn 100 XP', 'star', 'xp', 0, 'total_xp', 100),
  ('xp_500', 'Shining Bright', 'Earn 500 XP', 'star', 'xp', 0, 'total_xp', 500),
  ('xp_1000', 'XP Master', 'Earn 1000 XP', 'sparkles', 'xp', 0, 'total_xp', 1000),
  ('xp_5000', 'Legend', 'Earn 5000 XP', 'gem', 'xp', 0, 'total_xp', 5000),
  
  -- Community badges
  ('first_discussion', 'Conversation Starter', 'Start your first discussion', 'message-square', 'community', 50, 'discussions_started', 1),
  ('discussions_5', 'Community Voice', 'Start 5 discussions', 'messages-square', 'community', 150, 'discussions_started', 5),
  ('first_comment', 'Active Participant', 'Post your first comment', 'message-circle', 'community', 25, 'comments_posted', 1),
  ('comments_10', 'Helpful Peer', 'Post 10 comments', 'heart', 'community', 100, 'comments_posted', 10),
  
  -- Project badges
  ('first_project', 'Builder', 'Submit your first project', 'folder', 'projects', 100, 'projects_submitted', 1),
  ('projects_3', 'Portfolio Pro', 'Submit 3 projects', 'briefcase', 'projects', 300, 'projects_submitted', 3),
  ('first_feedback', 'Feedback Receiver', 'Get AI feedback on a project', 'bot', 'projects', 50, 'projects_with_feedback', 1);

-- Enable realtime for gamification
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_gamification;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;