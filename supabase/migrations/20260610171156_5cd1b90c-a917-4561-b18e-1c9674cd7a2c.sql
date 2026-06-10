CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.admin_api_keys
  ADD COLUMN IF NOT EXISTS api_key_ciphertext bytea;

-- Make the legacy plaintext column nullable so we can phase it out.
ALTER TABLE public.admin_api_keys
  ALTER COLUMN api_key_encrypted DROP NOT NULL;

-- Encrypt + upsert a provider key. Caller (edge function) supplies the
-- passphrase from a server-side secret; admin role required.
CREATE OR REPLACE FUNCTION public.set_admin_api_key(
  _provider_id text,
  _api_key text,
  _is_enabled boolean,
  _passphrase text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF _passphrase IS NULL OR length(_passphrase) < 16 THEN
    RAISE EXCEPTION 'Encryption passphrase missing or too short';
  END IF;
  IF _api_key IS NULL OR length(trim(_api_key)) < 10 THEN
    RAISE EXCEPTION 'API key required';
  END IF;

  INSERT INTO public.admin_api_keys (provider_id, api_key_ciphertext, api_key_encrypted, is_enabled)
  VALUES (
    _provider_id,
    extensions.pgp_sym_encrypt(trim(_api_key), _passphrase),
    NULL,
    COALESCE(_is_enabled, true)
  )
  ON CONFLICT (provider_id) DO UPDATE
    SET api_key_ciphertext = extensions.pgp_sym_encrypt(trim(_api_key), _passphrase),
        api_key_encrypted  = NULL,
        is_enabled         = COALESCE(_is_enabled, public.admin_api_keys.is_enabled),
        updated_at         = now();
END;
$$;

-- Toggle is_enabled without touching the secret.
CREATE OR REPLACE FUNCTION public.set_admin_api_key_enabled(
  _provider_id text,
  _is_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE public.admin_api_keys
     SET is_enabled = _is_enabled,
         updated_at = now()
   WHERE provider_id = _provider_id;
END;
$$;

-- List providers with a safe masked preview only. Never returns the
-- plaintext key. Decrypts only for masking, then discards it.
CREATE OR REPLACE FUNCTION public.list_admin_api_keys(_passphrase text)
RETURNS TABLE(provider_id text, is_enabled boolean, updated_at timestamptz, key_preview text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  r record;
  plaintext text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  FOR r IN
    SELECT k.provider_id, k.is_enabled, k.updated_at, k.api_key_ciphertext, k.api_key_encrypted
    FROM public.admin_api_keys k
    ORDER BY k.provider_id
  LOOP
    plaintext := NULL;
    IF r.api_key_ciphertext IS NOT NULL AND _passphrase IS NOT NULL THEN
      BEGIN
        plaintext := extensions.pgp_sym_decrypt(r.api_key_ciphertext, _passphrase);
      EXCEPTION WHEN OTHERS THEN
        plaintext := NULL;
      END;
    ELSIF r.api_key_encrypted IS NOT NULL THEN
      -- Legacy plaintext row, surfaces a preview so admin knows to re-save it.
      plaintext := r.api_key_encrypted;
    END IF;

    provider_id := r.provider_id;
    is_enabled := r.is_enabled;
    updated_at := r.updated_at;
    key_preview := CASE
      WHEN plaintext IS NULL THEN '••••••••'
      WHEN length(plaintext) > 8 THEN substring(plaintext, 1, 4) || '••••••••' || right(plaintext, 4)
      ELSE '••••••••'
    END;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.set_admin_api_key(text, text, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_admin_api_key_enabled(text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_admin_api_keys(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_admin_api_key(text, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_api_key_enabled(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_api_keys(text) TO authenticated;