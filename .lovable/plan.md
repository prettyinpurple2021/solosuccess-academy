
# Next Batch: Retention (Onboarding + Email Lifecycle)

The Revenue & Trust batch is shipped (landing audit, Stripe receipt, billing portal, cookie banner, production legal). The biggest remaining leak is **what happens after signup and after purchase** — students sign up, hit a generic dashboard, and we never re-engage them if they drift.

This batch fixes that with three coordinated pieces.

---

## 1. Branded welcome email (signup)

A new transactional template `welcome` that sends once when `handle_new_user` fires (or on first auth session). It greets the new student, sets expectations (free preview content, where to start, how billing works), and links to:
- Course catalog (`/courses`)
- The free first lesson of Course 1 (Initialization phase)
- Help Center (`/help`)
- Billing/refund policy

Styled to match the existing `purchase-receipt` and `contact-confirmation` templates (Rajdhani heading, cyan accent, dark surface).

**Trigger:** Add a small enqueue call inside `handle_new_user` (via the existing `enqueue_email` RPC + `process-email-queue` worker) so it's reliable even if the client tab closes.

## 2. Post-purchase onboarding screen

After Stripe checkout success, users currently land on `/dashboard` with no orientation. We'll add a lightweight **`/welcome/:courseId`** route that:

- Confirms the purchase ("You own [Course Title] for life")
- Shows a 3-step "Get started in 5 minutes" checklist:
  1. Open your first lesson (deep link)
  2. Set a daily goal (links to existing `DailyGoalCard` settings)
  3. Join the course discussion (deep link to `/discussions/:courseId`)
- One-time only — sets a flag in `profiles.onboarding_completed_courses jsonb` (array of course IDs already onboarded). If the user revisits, they go straight to the course.

Stripe webhook's existing redirect (`success_url`) gets pointed at `/welcome/:courseId` instead of `/dashboard`.

## 3. Lifecycle nudges (Day 3 + Day 7 inactivity)

Extend the existing `check-student-progress` cron (already runs daily 9 AM UTC per memory) to also detect:

- **Day 3 nudge** — purchased ≥3 days ago, 0 lessons completed → "Your first lesson is waiting" email with a one-click resume link.
- **Day 7 nudge** — last activity ≥7 days ago, course not yet complete → "Pick up where you left off" email using `continue_later` data so we deep-link to the exact lesson/page they last viewed.

Both use **idempotency**: a new `lifecycle_emails_sent` table (`user_id`, `course_id`, `kind`, `sent_at`, unique on the triple) so we never double-send. Each email respects the existing unsubscribe flow (`handle-email-unsubscribe`).

Two new transactional templates: `lifecycle-day3-nudge` and `lifecycle-day7-resume`.

---

## Technical Details

**Files created**
- `supabase/functions/_shared/transactional-email-templates/welcome.tsx`
- `supabase/functions/_shared/transactional-email-templates/lifecycle-day3-nudge.tsx`
- `supabase/functions/_shared/transactional-email-templates/lifecycle-day7-resume.tsx`
- `src/pages/Welcome.tsx` (post-purchase onboarding screen)

**Files edited**
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register 3 new templates
- `supabase/functions/stripe-webhook/index.ts` — change `success_url` to `/welcome/:courseId`
- `supabase/functions/check-student-progress/index.ts` — add Day 3 + Day 7 detection and enqueue logic
- `supabase/functions/create-checkout/index.ts` — pass `courseId` through so `success_url` can include it
- `src/App.tsx` — register `/welcome/:courseId` route inside `AppLayout` (auth-required)

**Database migration**
- `lifecycle_emails_sent` table with RLS (admin-only read; service role writes via cron)
- Add `onboarding_completed_courses uuid[]` column to `profiles` (default `'{}'`)
- Update `handle_new_user` to enqueue the welcome email via `pgmq.send`

**Security & integrity**
- All three email templates render server-side only (no client invocation paths)
- Lifecycle worker runs under service role, respects `email_unsubscribes` table
- `/welcome/:courseId` validates ownership via `has_purchased_course` before rendering — non-owners get redirected to `/courses`

---

## Out of scope for this batch (future)
- Drip campaign for unpurchased signups (Day 1, 7, 14 cart-abandonment style)
- Re-engagement for users who completed a course but haven't bought the next phase
- In-app notification mirrors of the lifecycle emails

Approve and I'll build all three pieces in one pass.
