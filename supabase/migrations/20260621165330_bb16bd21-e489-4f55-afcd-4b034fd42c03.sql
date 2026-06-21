
-- Drop legacy plaintext column on admin_api_keys (already empty, only ciphertext is used)
ALTER TABLE public.admin_api_keys DROP COLUMN IF EXISTS api_key_encrypted;

-- Recreate list_admin_api_keys without the legacy column reference
CREATE OR REPLACE FUNCTION public.list_admin_api_keys(_passphrase text)
 RETURNS TABLE(provider_id text, is_enabled boolean, updated_at timestamp with time zone, key_preview text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  r record;
  plaintext text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  FOR r IN
    SELECT k.provider_id, k.is_enabled, k.updated_at, k.api_key_ciphertext
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
$function$;

-- Recreate set_admin_api_key without legacy column
CREATE OR REPLACE FUNCTION public.set_admin_api_key(_provider_id text, _api_key text, _is_enabled boolean, _passphrase text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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

  INSERT INTO public.admin_api_keys (provider_id, api_key_ciphertext, is_enabled)
  VALUES (
    _provider_id,
    extensions.pgp_sym_encrypt(trim(_api_key), _passphrase),
    COALESCE(_is_enabled, true)
  )
  ON CONFLICT (provider_id) DO UPDATE
    SET api_key_ciphertext = extensions.pgp_sym_encrypt(trim(_api_key), _passphrase),
        is_enabled         = COALESCE(_is_enabled, public.admin_api_keys.is_enabled),
        updated_at         = now();
END;
$function$;
