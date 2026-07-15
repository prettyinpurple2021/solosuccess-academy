
CREATE TABLE public.deploy_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  deployed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX deploy_history_deployed_at_idx ON public.deploy_history (deployed_at DESC);

GRANT SELECT ON public.deploy_history TO anon, authenticated;
GRANT ALL ON public.deploy_history TO service_role;

ALTER TABLE public.deploy_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deploy history is public"
  ON public.deploy_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.record_deploy(_version text, _deployed_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _version IS NULL OR length(trim(_version)) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.deploy_history (version, deployed_at, status)
  VALUES (trim(_version), COALESCE(_deployed_at, now()), 'success')
  ON CONFLICT (version) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_deploy(text, timestamptz) TO anon, authenticated;
