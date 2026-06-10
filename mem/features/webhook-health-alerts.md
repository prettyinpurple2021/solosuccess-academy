---
name: Webhook Health Alerts
description: Admin email alerts for repeated Stripe webhook failures or sudden drops in successful events
type: feature
---
Monitor: `check-webhook-health` edge function, scheduled every 15 min via pg_cron job `check-webhook-health-15m`.

Triggers:
- FAILURES: ≥3 failed `stripe_webhook_events` in last 30 min
- DROP: successful events in last 60 min < 30% of 24h baseline (baseline must be ≥4 events/window)

Throttle: `public.webhook_alert_state` table, 60-min cooldown per alert kind.

Email template: `webhook-health-alert` (registered in `_shared/transactional-email-templates/registry.ts`), sent per admin via `send-transactional-email`.

Manual trigger: "Run check now" button on `/admin/webhook-health`.