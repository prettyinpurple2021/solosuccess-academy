CREATE TABLE IF NOT EXISTS public.webhook_alert_state (
  id text PRIMARY KEY,
  last_alert_at timestamptz NOT NULL DEFAULT now(),
  last_summary text,
  alert_count integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_alert_state TO service_role;
GRANT SELECT ON public.webhook_alert_state TO authenticated;
ALTER TABLE public.webhook_alert_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view webhook alert state"
  ON public.webhook_alert_state
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));