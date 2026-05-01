-- Allow a signed-in user to claim ONLY their own welcome slot.
-- The unique constraint on (user_id, course_id, kind) guarantees this
-- can only succeed once — repeats raise 23505 which the client ignores.
CREATE POLICY "Users can claim their own welcome slot"
  ON public.lifecycle_emails_sent
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND kind = 'welcome'
    AND course_id IS NULL
  );