
-- Table for storing admin-configurable API keys
-- These are read by edge functions as fallback/override for environment variables
CREATE TABLE public.admin_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL UNIQUE,
  api_key_encrypted text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can read, insert, update, delete
CREATE POLICY "Admins can manage API keys"
  ON public.admin_api_keys FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- No student access at all
CREATE POLICY "No student access to API keys"
  ON public.admin_api_keys FOR SELECT
  USING (false);

-- Auto-update updated_at
CREATE TRIGGER update_admin_api_keys_updated_at
  BEFORE UPDATE ON public.admin_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
