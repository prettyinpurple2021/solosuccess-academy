
-- Recovery codes for 2FA fallback
CREATE TABLE public.mfa_recovery_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_mfa_recovery_codes_user ON public.mfa_recovery_codes(user_id) WHERE used_at IS NULL;

ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Users can view only metadata of their own codes (no hashes exposed via select since we only show used_at/created_at in UI)
CREATE POLICY "Users view own recovery code metadata"
ON public.mfa_recovery_codes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Block all direct writes — must use SECURITY DEFINER functions
CREATE POLICY "No direct insert" ON public.mfa_recovery_codes FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No direct update" ON public.mfa_recovery_codes FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No direct delete" ON public.mfa_recovery_codes FOR DELETE TO authenticated USING (false);

-- pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Generate 10 fresh recovery codes for the current user
CREATE OR REPLACE FUNCTION public.generate_mfa_recovery_codes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _uid uuid := auth.uid();
  _codes text[] := ARRAY[]::text[];
  _code text;
  _i int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Wipe any previous unused codes
  DELETE FROM public.mfa_recovery_codes WHERE user_id = _uid;

  FOR _i IN 1..10 LOOP
    -- 10-char alphanumeric: format like xxxxx-xxxxx
    _code := lower(
      encode(extensions.gen_random_bytes(8), 'hex')
    );
    _code := substring(_code from 1 for 5) || '-' || substring(_code from 6 for 5);
    _codes := array_append(_codes, _code);

    INSERT INTO public.mfa_recovery_codes (user_id, code_hash)
    VALUES (_uid, encode(extensions.digest(_code, 'sha256'), 'hex'));
  END LOOP;

  RETURN jsonb_build_object('codes', to_jsonb(_codes));
END;
$$;

-- Consume a recovery code (validates + marks used). Returns true if valid.
CREATE OR REPLACE FUNCTION public.consume_mfa_recovery_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _uid uuid := auth.uid();
  _hash text;
  _row_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _hash := encode(extensions.digest(lower(trim(_code)), 'sha256'), 'hex');

  SELECT id INTO _row_id
  FROM public.mfa_recovery_codes
  WHERE user_id = _uid AND code_hash = _hash AND used_at IS NULL
  LIMIT 1;

  IF _row_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.mfa_recovery_codes SET used_at = now() WHERE id = _row_id;
  RETURN true;
END;
$$;
