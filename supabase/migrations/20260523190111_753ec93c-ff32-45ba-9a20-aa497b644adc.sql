-- 1. Add generic identifier columns
ALTER TABLE public.api_rate_limits
  ADD COLUMN IF NOT EXISTS identifier text,
  ADD COLUMN IF NOT EXISTS identifier_type text;

-- 2. Backfill existing rows from user_id
UPDATE public.api_rate_limits
SET identifier = user_id::text,
    identifier_type = 'user'
WHERE identifier IS NULL;

-- 3. Make user_id nullable so anonymous/IP-based rows can be inserted
ALTER TABLE public.api_rate_limits
  ALTER COLUMN user_id DROP NOT NULL;

-- 4. Enforce NOT NULL + allowed values on the new columns
ALTER TABLE public.api_rate_limits
  ALTER COLUMN identifier SET NOT NULL,
  ALTER COLUMN identifier_type SET NOT NULL;

ALTER TABLE public.api_rate_limits
  DROP CONSTRAINT IF EXISTS api_rate_limits_identifier_type_check;
ALTER TABLE public.api_rate_limits
  ADD CONSTRAINT api_rate_limits_identifier_type_check
  CHECK (identifier_type IN ('user', 'ip'));

-- 5. Consistency: if identifier_type is 'user', user_id must match identifier;
--    if 'ip', user_id must be null.
ALTER TABLE public.api_rate_limits
  DROP CONSTRAINT IF EXISTS api_rate_limits_identifier_consistency_check;
ALTER TABLE public.api_rate_limits
  ADD CONSTRAINT api_rate_limits_identifier_consistency_check
  CHECK (
    (identifier_type = 'user' AND user_id IS NOT NULL AND user_id::text = identifier)
    OR
    (identifier_type = 'ip' AND user_id IS NULL)
  );

-- 6. Indexes for fast window lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_identifier_endpoint_window
  ON public.api_rate_limits (identifier, endpoint, window_start DESC);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start
  ON public.api_rate_limits (window_start);

-- 7. Cleanup function — deletes rate-limit rows whose window started more
-- than 24 hours ago. Safe to run from a cron job; service role only.
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _deleted integer;
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE window_start < (now() - interval '24 hours');
  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted;
END;
$function$;

-- Lock down execution: only service role / postgres should call this
REVOKE ALL ON FUNCTION public.cleanup_expired_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() FROM anon, authenticated;