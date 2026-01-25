-- ============================================
-- FIX CRITICAL SECURITY ISSUES
-- ============================================

-- 1. CRITICAL: Explicitly deny INSERT on purchases table
-- Purchases should ONLY be created by the webhook edge function (service role)
CREATE POLICY "No user inserts on purchases"
  ON public.purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 2. CRITICAL: Explicitly deny UPDATE on purchases table  
CREATE POLICY "No user updates on purchases"
  ON public.purchases
  FOR UPDATE
  TO authenticated
  USING (false);

-- 3. CRITICAL: Explicitly deny DELETE on purchases table
CREATE POLICY "No user deletes on purchases"
  ON public.purchases
  FOR DELETE
  TO authenticated
  USING (false);

-- 4. CRITICAL: Deny INSERT on user_roles (only handle_new_user trigger should insert)
CREATE POLICY "No user inserts on user_roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 5. CRITICAL: Deny UPDATE on user_roles (prevent privilege escalation)
CREATE POLICY "No user updates on user_roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (false);

-- 6. CRITICAL: Deny DELETE on user_roles
CREATE POLICY "No user deletes on user_roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (false);

-- ============================================
-- FIX WARNING: Discussions require course purchase
-- ============================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view discussions" ON public.discussions;

-- Create new policy requiring course purchase
CREATE POLICY "Users can view purchased course discussions"
  ON public.discussions
  FOR SELECT
  TO authenticated
  USING (has_purchased_course(auth.uid(), course_id));

-- ============================================
-- FIX WARNING: Discussion comments require course purchase
-- ============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.discussion_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.discussion_comments;

-- Create new policies requiring course purchase via discussion join
CREATE POLICY "Users can view comments on purchased course discussions"
  ON public.discussion_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM discussions d
      WHERE d.id = discussion_comments.discussion_id
      AND has_purchased_course(auth.uid(), d.course_id)
    )
  );

CREATE POLICY "Users can create comments on purchased course discussions"
  ON public.discussion_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM discussions d
      WHERE d.id = discussion_comments.discussion_id
      AND has_purchased_course(auth.uid(), d.course_id)
    )
  );

-- ============================================
-- FIX INFO: Allow users to delete their own data
-- ============================================

-- Allow users to delete their AI chat sessions
CREATE POLICY "Users can delete their own chat sessions"
  ON public.ai_chat_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to delete their AI chat messages (via session ownership)
CREATE POLICY "Users can delete messages from their sessions"
  ON public.ai_chat_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions
      WHERE ai_chat_sessions.id = ai_chat_messages.session_id
      AND ai_chat_sessions.user_id = auth.uid()
    )
  );

-- Allow users to delete their course projects
CREATE POLICY "Users can delete their own projects"
  ON public.course_projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to delete their progress
CREATE POLICY "Users can delete their own progress"
  ON public.user_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);