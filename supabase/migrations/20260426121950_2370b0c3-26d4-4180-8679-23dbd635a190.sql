-- New richer variant returning JSON metadata about the accepted code.
CREATE OR REPLACE FUNCTION public.confirm_mfa_recovery_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _uid uuid := auth.uid();
  _normalized text;
  _hash text;
  _row_id uuid;
  _used_at timestamptz;
  _remaining int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _normalized := lower(trim(_code));
  _hash := encode(extensions.digest(_normalized, 'sha256'), 'hex');

  SELECT id INTO _row_id
  FROM public.mfa_recovery_codes
  WHERE user_id = _uid AND code_hash = _hash AND used_at IS NULL
  LIMIT 1;

  IF _row_id IS NULL THEN
    RETURN jsonb_build_object('accepted', false);
  END IF;

  UPDATE public.mfa_recovery_codes
  SET used_at = now()
  WHERE id = _row_id
  RETURNING used_at INTO _used_at;

  SELECT count(*)::int INTO _remaining
  FROM public.mfa_recovery_codes
  WHERE user_id = _uid AND used_at IS NULL;

  RETURN jsonb_build_object(
    'accepted', true,
    'masked', '••••••-••••' || right(_normalized, 4),
    'used_at', _used_at,
    'remaining', _remaining
  );
END;
$$;