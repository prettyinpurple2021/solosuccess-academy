
CREATE TABLE IF NOT EXISTS public.app_traffic_heartbeat (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_traffic_heartbeat (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

GRANT ALL ON public.app_traffic_heartbeat TO service_role;
ALTER TABLE public.app_traffic_heartbeat ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.job_gate_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  ran boolean NOT NULL,
  reason text NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_gate_decisions_job_time_idx
  ON public.job_gate_decisions (job_name, decided_at DESC);

GRANT SELECT ON public.job_gate_decisions TO authenticated;
GRANT ALL ON public.job_gate_decisions TO service_role;
ALTER TABLE public.job_gate_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view job gate decisions" ON public.job_gate_decisions;
CREATE POLICY "Admins can view job gate decisions"
  ON public.job_gate_decisions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.record_app_traffic()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  UPDATE public.app_traffic_heartbeat
     SET last_seen_at = now(), updated_at = now()
   WHERE id = true
     AND last_seen_at < now() - interval '1 minute';
$$;

REVOKE ALL ON FUNCTION public.record_app_traffic() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_app_traffic() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_recent_traffic(p_window interval DEFAULT interval '24 hours')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT COALESCE(
    (SELECT last_seen_at > now() - p_window FROM public.app_traffic_heartbeat WHERE id = true),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.job_should_run(
  p_job_name text,
  p_has_pending boolean DEFAULT false,
  p_window interval DEFAULT interval '24 hours'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_traffic boolean;
  v_run boolean;
  v_reason text;
BEGIN
  v_traffic := public.has_recent_traffic(p_window);
  v_run := COALESCE(p_has_pending, false) OR v_traffic;

  IF COALESCE(p_has_pending, false) THEN
    v_reason := 'pending work';
  ELSIF v_traffic THEN
    v_reason := 'recent user traffic';
  ELSE
    v_reason := 'idle: no traffic and nothing pending';
  END IF;

  INSERT INTO public.job_gate_decisions (job_name, ran, reason)
  VALUES (p_job_name, v_run, v_reason);

  RETURN v_run;
END;
$$;

REVOKE ALL ON FUNCTION public.job_should_run(text, boolean, interval) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.job_should_run(text, boolean, interval) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_job_gate_decisions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  DELETE FROM public.job_gate_decisions WHERE decided_at < now() - interval '7 days';
$$;
