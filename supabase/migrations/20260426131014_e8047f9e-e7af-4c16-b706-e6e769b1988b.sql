-- 1. Idempotency floor on purchases: a single Stripe Checkout session can only ever produce one purchase row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'purchases_stripe_checkout_session_id_key'
  ) THEN
    -- Deduplicate any existing rows BEFORE adding the constraint (keep oldest)
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY stripe_checkout_session_id
               ORDER BY purchased_at ASC
             ) AS rn
      FROM public.purchases
      WHERE stripe_checkout_session_id IS NOT NULL
    )
    DELETE FROM public.purchases p
    USING ranked r
    WHERE p.id = r.id AND r.rn > 1;

    ALTER TABLE public.purchases
      ADD CONSTRAINT purchases_stripe_checkout_session_id_key
      UNIQUE (stripe_checkout_session_id);
  END IF;
END$$;

-- 2. Webhook event ledger — replay protection
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type      text NOT NULL,
  payload         jsonb,
  processed_at    timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'processed', -- processed | skipped | error
  error_message   text
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type
  ON public.stripe_webhook_events (event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON public.stripe_webhook_events (processed_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Admins can read; nobody else can. Webhook uses service role and bypasses RLS.
DROP POLICY IF EXISTS "Admins can view webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Admins can view webhook events"
  ON public.stripe_webhook_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Refund tracking on purchases (so /billing can show "Refunded")
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS refund_amount_cents integer;