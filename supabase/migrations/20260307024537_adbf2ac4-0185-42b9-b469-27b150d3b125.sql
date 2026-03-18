-- Discussion votes table for upvoting discussions
CREATE TABLE public.discussion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discussion_id uuid NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, discussion_id)
);

-- Enable RLS
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;

-- Users can view votes on discussions they can see (purchased courses)
CREATE POLICY "Users can view votes on purchased course discussions"
ON public.discussion_votes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.discussions d
    WHERE d.id = discussion_votes.discussion_id
    AND has_purchased_course(auth.uid(), d.course_id)
  )
);

-- Users can insert their own votes
CREATE POLICY "Users can vote on purchased course discussions"
ON public.discussion_votes FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.discussions d
    WHERE d.id = discussion_votes.discussion_id
    AND has_purchased_course(auth.uid(), d.course_id)
  )
);

-- Users can remove their own votes
CREATE POLICY "Users can remove their own votes"
ON public.discussion_votes FOR DELETE
USING (auth.uid() = user_id);