-- Account deletion requests for 30-day soft delete grace period
CREATE TABLE public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  scheduled_purge_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  delete_content boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  cancelled_at timestamp with time zone,
  purged_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can see and cancel their own request
CREATE POLICY "Users view own deletion request"
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all (for support)
CREATE POLICY "Admins view all deletion requests"
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- All writes happen via SECURITY DEFINER RPCs only
CREATE POLICY "No direct insert"
ON public.account_deletion_requests FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "No direct update"
ON public.account_deletion_requests FOR UPDATE TO authenticated USING (false);

CREATE POLICY "No direct delete"
ON public.account_deletion_requests FOR DELETE TO authenticated USING (false);

-- RPC: request account deletion
CREATE OR REPLACE FUNCTION public.request_account_deletion(_delete_content boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _purge_at timestamp with time zone;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _uid;

  INSERT INTO public.account_deletion_requests (user_id, email, delete_content, status)
  VALUES (_uid, _email, _delete_content, 'pending')
  ON CONFLICT (user_id) DO UPDATE
    SET requested_at = now(),
        scheduled_purge_at = now() + interval '30 days',
        delete_content = EXCLUDED.delete_content,
        status = 'pending',
        cancelled_at = NULL
  RETURNING scheduled_purge_at INTO _purge_at;

  RETURN jsonb_build_object('scheduled_purge_at', _purge_at, 'status', 'pending');
END;
$$;

-- RPC: cancel a pending deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.account_deletion_requests
  SET status = 'cancelled', cancelled_at = now()
  WHERE user_id = _uid AND status = 'pending';

  RETURN jsonb_build_object('status', 'cancelled');
END;
$$;

-- RPC: get current user's pending deletion (used by client banner)
CREATE OR REPLACE FUNCTION public.get_my_deletion_request()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row record;
BEGIN
  IF _uid IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO _row
  FROM public.account_deletion_requests
  WHERE user_id = _uid AND status = 'pending'
  LIMIT 1;
  IF _row IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'requested_at', _row.requested_at,
    'scheduled_purge_at', _row.scheduled_purge_at,
    'delete_content', _row.delete_content,
    'status', _row.status
  );
END;
$$;