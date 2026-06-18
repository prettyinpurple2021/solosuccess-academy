# Migration Checklist: Lovable Cloud → Standalone Supabase

**Good news:** No real users yet means you can skip the hardest part (auth user export + forced password resets). You can wipe and start fresh.

---

## Phase 1: Connect to GitHub (Get Your Code)

This is the easiest way to own your entire codebase. Once connected, Lovable auto-pushes every change to a repo you control.

- [ ] **Open the + menu** at the bottom-left of the chat input (next to the send button)
- [ ] **Go to GitHub → Connect project**
- [ ] **Authorize the Lovable GitHub App** — you'll be redirected to GitHub
- [ ] **Select your account/org** and click **Create Repository**
- [ ] **Verify on GitHub** — open github.com, find the new repo, confirm it contains `src/`, `supabase/`, `public/`, etc.

**What the repo gives you:** All code, components, pages, migrations, edge functions, configs.
**What it does NOT give you:** Actual database data (CSV export separately) and secrets (re-add manually).

---

## Phase 2: Prep

- [ ] Create a free account at [supabase.com](https://supabase.com)
- [ ] Create a new Supabase project — save the project URL, anon key, service role key, and DB password in a password manager
- [ ] (Optional) Install the CLI: `npm i -g supabase`

---

## Phase 3: Export from Lovable Cloud

Since you have no real users, you only need to export **content you authored** (courses, lessons, textbook, blog posts). Skip all user-generated tables.

### Content tables (CSV from Cloud → Database → Tables)
- [ ] `courses`
- [ ] `lessons`
- [ ] `practice_labs`
- [ ] `textbook_chapters`
- [ ] `textbook_chapter_objectives`
- [ ] `textbook_pages`
- [ ] `course_projects`
- [ ] `project_milestones`
- [ ] `project_rubric_categories`
- [ ] `course_final_exams`
- [ ] `course_essays`
- [ ] `blog_posts`
- [ ] `blog_topic_queue`
- [ ] `achievement_badges`
- [ ] `xp_config`
- [ ] `grade_settings`
- [ ] `announcements`
- [ ] `testimonials` (only if you authored any)

### Skip (recreate empty)
All `user_*`, `student_*`, `*_submissions`, `*_attempts`, `notifications`, `purchases`, `certificates`, `discussions`, `profiles`, `user_roles`, etc.

### Schema, code, storage
- [ ] Everything in `supabase/migrations/` and `supabase/functions/` is already portable
- [ ] Download files from each storage bucket (`course-assets`, `lesson-videos`, `project-files`, `avatars`) via Cloud → Storage

### Secret names to re-create
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `LOVABLE_API_KEY` → replace with `GEMINI_API_KEY` / `OPENAI_API_KEY` (Lovable AI Gateway won't exist outside Cloud)
- [ ] SMTP creds (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_PORT`) or `RESEND_API_KEY`
- [ ] `TURNSTILE_SECRET_KEY`
- [ ] `API_KEYS_ENCRYPTION_KEY` (use the same value, or admin-stored API keys won't decrypt)
- [ ] `CRON_JOB_SECRET`
- [ ] `GOOGLE_SEARCH_CONSOLE_API_KEY`

---

## Phase 4: New Project Setup

- [ ] **Disable Lovable Cloud for future projects:** Connectors → Lovable Cloud → Disable
- [ ] Create a new Lovable project
- [ ] Connect Supabase via the native Supabase integration (top-right button)
- [ ] Copy from your GitHub repo: `src/`, `public/`, `supabase/migrations/`, `supabase/functions/`, `supabase/config.toml`, `index.html`, `tailwind.config.ts`, `vite.config.ts`, `package.json`, `bun.lockb`
- [ ] **Do NOT copy** `src/integrations/supabase/client.ts` or `types.ts` — Lovable regenerates these

### Code changes you'll need to make
- [ ] **Replace Lovable AI Gateway calls.** Anywhere edge functions hit `https://ai.gateway.lovable.dev` or use `LOVABLE_API_KEY`, swap to direct Gemini / OpenAI API calls with your own key.
- [ ] Update any hardcoded function URLs in `src/` to your new Supabase project ref

---

## Phase 4: Restore in New Supabase

1. [ ] Run all migrations (Lovable applies automatically, or `supabase db push`)
2. [ ] Re-create storage buckets with the same names and public/private settings
3. [ ] Upload storage files back
4. [ ] Import CSVs via Supabase Dashboard → Table Editor → Insert → Import CSV — **parents first:**
   - courses → lessons / textbook_chapters / practice_labs / course_projects / course_final_exams / course_essays
   - textbook_chapters → textbook_pages / textbook_chapter_objectives
   - course_projects → project_milestones → project_rubric_categories
   - standalone: blog_posts, blog_topic_queue, achievement_badges, xp_config, grade_settings, announcements
5. [ ] Add all secrets in Supabase Dashboard → Edge Functions → Secrets
6. [ ] Deploy edge functions (Lovable does this on push, or `supabase functions deploy`)
7. [ ] Re-create `cron_job_secret` in `vault` and re-run the cron migration for the auto-blog job

---

## Phase 5: External Reconnects

- [ ] **Stripe:** update webhook endpoint to `https://<new-ref>.supabase.co/functions/v1/stripe-webhook`, generate new signing secret, update `STRIPE_WEBHOOK_SECRET`
- [ ] **Google OAuth:** in Supabase Dashboard → Authentication → Providers → Google, paste your Google Client ID/Secret. Add the new callback URL (`https://<new-ref>.supabase.co/auth/v1/callback`) to your Google Cloud Console OAuth credentials
- [ ] **Email domain:** Lovable Email (`notify.solosuccessacademy.cloud`) won't exist outside Cloud. Either:
  - Sign up for [Resend](https://resend.com) directly (free tier: 3k emails/mo), re-verify the domain, add `RESEND_API_KEY`
  - Or keep using your SMTP creds
- [ ] **Custom domain:** in Vercel, point `solosuccessacademy.app` and `.cloud` at the new Lovable published URL

---

## Phase 6: Smoke Test Before Sunsetting Old Project

- [ ] Sign up a fresh test account (email + password)
- [ ] Google sign-in works
- [ ] Buy a course with a Stripe test card (`4242 4242 4242 4242`)
- [ ] Open a lesson, complete a quiz, earn XP
- [ ] Submit a project milestone
- [ ] Trigger the auto-blog function manually
- [ ] Confirm a transactional email arrives
- [ ] Only then: delete the old Lovable Cloud project

---

## Gotchas

- **AI features will break** until you swap `LOVABLE_API_KEY` for direct Gemini/OpenAI keys. Budget ~$5–20/mo depending on usage.
- **`API_KEYS_ENCRYPTION_KEY` must match** the old value or admin-saved API keys won't decrypt — easiest workaround is having admins re-enter them after migration.
- **Edge function URLs change** — anything pointing at the old `*.supabase.co` ref (Stripe webhook, cron, external integrations) needs updating.
- **Import CSVs in parent → child order** or foreign-key inserts fail. UUIDs are preserved so relationships stay intact.
- **What you lose from Cloud:** managed AI Gateway, managed email domain, in-product DB browser. All replaceable, just no longer free or one-click.

---

## Realistic Time Estimate

With no real users: **4–8 hours of focused work**, mostly waiting on DNS propagation and clicking through CSV imports. The risky part (auth migration) doesn't apply to you — big win.
