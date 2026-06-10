# Retention Batch Plan

Three pieces to lift activation and bring students back:

## 1. Welcome email (app email)
Sent immediately when a new student verifies their email.

- New app-email template `welcome-student.tsx` in the existing transactional email system (cyan-glow brand styling, Rajdhani heading, links to /dashboard and /courses).
- Trigger: extend the existing `handle_new_user` flow (or a small DB trigger / auth hook) to enqueue `welcome-student` once per user via `send-transactional-email`.
- Idempotency key: `welcome-${user_id}` so retries never duplicate.

## 2. Onboarding screen
First-run guided intro for new students before they hit the dashboard.

- New route `/onboarding` (PublicLayout-style but auth-required) with a 3-step flow:
  1. Pick primary goal (Founder / Side Hustler / Career Changer / Indie Hacker) — saved to `profiles.primary_goal`.
  2. Pick weekly time commitment (slider 1–15 hrs) — saved to `profiles.weekly_commitment_hours`.
  3. "Start with Course 1" CTA → `/courses/course-1`.
- DB: add `primary_goal text`, `weekly_commitment_hours int`, `onboarding_completed_at timestamptz` to `profiles` (migration with GRANTs already in place).
- Gate: `AppLayout` redirects to `/onboarding` when `onboarding_completed_at` is null. Skippable via "Skip for now" link that just sets the timestamp.

## 3. Lifecycle nudge emails
Re-engage inactive students using the existing `lifecycle_emails_sent` table.

- Two new app-email templates:
  - `lifecycle-3day-inactive.tsx` — "Pick up where you left off" with their last lesson (uses `continue_later`).
  - `lifecycle-7day-inactive.tsx` — "Your streak is at risk" + suggested next lesson.
- New edge function `send-lifecycle-emails` (verify_jwt=false, service-role):
  - Finds students whose last `user_progress.updated_at` was 3 or 7 days ago.
  - Skips users already logged in `lifecycle_emails_sent` for that template.
  - Enqueues template via `send-transactional-email` with `idempotencyKey = ${template}-${user_id}-${YYYYMMDD}`.
  - Inserts a row into `lifecycle_emails_sent`.
- Cron: daily 10:00 UTC via pg_cron + pg_net (separate from the existing 9 AM admin-progress job).

## Technical notes
- All emails go through the existing `send-transactional-email` function — no new send infra.
- All new templates registered in `_shared/transactional-email-templates/registry.ts` and deployed.
- Onboarding fields use defaults (`null`) so existing users are unaffected; we can backfill `onboarding_completed_at = now()` for current users in the same migration so they skip the screen.
- No new secrets required.

Want me to build all three, or start with welcome + onboarding and add lifecycle nudges after?
