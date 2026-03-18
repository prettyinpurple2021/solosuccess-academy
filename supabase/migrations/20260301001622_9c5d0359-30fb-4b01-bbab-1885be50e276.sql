
-- 1. Add unique constraint on course_projects (user_id, course_id) for upsert support
ALTER TABLE public.course_projects
ADD CONSTRAINT course_projects_user_course_unique UNIQUE (user_id, course_id);

-- 2. Enable realtime for discussions and comments tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_comments;

-- 3. Add admin certificate revocation capability
ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS revoked_by uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS revocation_reason text DEFAULT NULL;

-- Allow admins to view and update all certificates (for revocation)
CREATE POLICY "Admins can view all certificates"
ON public.certificates
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update certificates for revocation"
ON public.certificates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
