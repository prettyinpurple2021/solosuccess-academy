-- Unique index enables atomic upsert on the window row
CREATE UNIQUE INDEX IF NOT EXISTS api_rate_limits_identifier_endpoint_window_key
  ON public.api_rate_limits (identifier, endpoint, window_start);

-- Atomic check-and-increment. Returns allowed/count/reset_at in one round trip.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  _identifier text,
  _identifier_type text,
  _endpoint text,
  _max_requests integer,
  _window_minutes integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _window_start timestamptz;
  _count integer;
  _user_id uuid;
BEGIN
  IF _identifier IS NULL OR length(_identifier) = 0 THEN
    RAISE EXCEPTION 'identifier required';
  END IF;
  IF _identifier_type NOT IN ('user', 'ip') THEN
    RAISE EXCEPTION 'identifier_type must be user or ip';
  END IF;
  IF _max_requests <= 0 OR _window_minutes <= 0 THEN
    RAISE EXCEPTION 'max_requests and window_minutes must be positive';
  END IF;

  -- Fixed-window bucket aligned to _window_minutes boundary
  _window_start := to_timestamp(
    floor(extract(epoch FROM now()) / (_window_minutes * 60)) * (_window_minutes * 60)
  );

  IF _identifier_type = 'user' THEN
    BEGIN
      _user_id := _identifier::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'user identifier must be a uuid';
    END;
  END IF;

  INSERT INTO public.api_rate_limits
    (identifier, identifier_type, endpoint, window_start, request_count, user_id)
  VALUES
    (_identifier, _identifier_type, _endpoint, _window_start, 1, _user_id)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET request_count = public.api_rate_limits.request_count + 1
  RETURNING request_count INTO _count;

  RETURN jsonb_build_object(
    'allowed', _count <= _max_requests,
    'count', _count,
    'limit', _max_requests,
    'remaining', GREATEST(0, _max_requests - _count),
    'reset_at', _window_start + (_window_minutes || ' minutes')::interval
  );
END;
$$;

-- Service role only; never call from the client
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, text, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, text, text, integer, integer) TO service_role;