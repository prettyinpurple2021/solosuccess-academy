# Production Deployment Checklist

This document covers everything that must be completed before **SoloSuccess Academy** is ready for production. Each item is labeled with who can resolve it:

- **✅ Fixed** — Already resolved in this PR
- **🛠️ You (code)** — Can be resolved by a developer in the codebase
- **🎨 Lovable** — Requires work in the Lovable builder (UI/content changes, new pages)
- **⚙️ Supabase** — Requires configuration in your Supabase project dashboard
- **💳 Stripe** — Requires setup in your Stripe dashboard
- **👤 Owner** — Requires a business/content decision from you

---

## 🚨 Critical (Blockers — Must Fix Before Launch)

### 1. ✅ Password Reset Redirect Bug
**File:** `src/pages/Settings.tsx`  
The "Reset Password" button on the Settings page was sending users to `/auth?mode=reset` (which doesn't exist) instead of `/reset-password`. This caused the reset flow to silently fail.  
**Status:** Fixed in this PR.

### 2. ✅ Auth Page Missing "Forgot Password" Link
**File:** `src/pages/Auth.tsx`  
The sign-in form had no way for users to recover a forgotten password, even though the `/reset-password` page existed. Users who forgot their password were completely locked out.  
**Status:** Fixed in this PR — "Forgot password?" button added. User enters their email, clicks the button, and receives a reset email.

### 3. ✅ .env File Committed to Repository
**File:** `.gitignore`  
The `.env` file containing your Supabase anon key was committed to the repository. While the anon key is designed to be public-facing, it is best practice not to commit it.  
**Status:** Fixed in this PR — `.env` is now excluded from git. A `.env.example` template was added.  
**Action needed:** After merging, confirm the `.env` is not in your git history using `git log --all -- .env`. If it was previously committed, rotate your Supabase anon key.

### 4. ⚙️ Supabase Edge Function JWT Verification
**File:** `supabase/config.toml`  
**ALL** edge functions are configured with `verify_jwt = false`. This means anyone on the internet can call your AI tutor, content generator, project feedback, and notification functions without being logged in — causing unexpected API costs and security issues.  
**Action needed:** Set `verify_jwt = true` for all functions that require authentication:
```toml
# Only these two LEGITIMATELY need verify_jwt = false:
[functions.stripe-webhook]   # Stripe sends webhooks without a user JWT
verify_jwt = false

[functions.send-notification-email]  # Called from a webhook context
verify_jwt = false

# All others should use verify_jwt = true (or remove the line — true is the default):
# ai-tutor, project-feedback, generate-content, generate-image,
# generate-voice, get-leaderboard, notify-discussion-reply,
# bulk-generate-*, check-student-progress, explain-text, create-checkout
```

### 5. 💳 Stripe Not Configured
**File:** `src/pages/CourseDetail.tsx`  
The purchase button calls a `create-checkout` edge function, which requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to be set as Supabase secrets. Without this, all course purchases will fail silently.  
**Action needed:**
1. Create a Stripe account and get your API keys
2. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Supabase → Settings → Edge Functions → Secrets
3. Register the `/stripe-webhook` function URL as a webhook endpoint in your Stripe dashboard
4. For each course, set the `stripe_price_id` field in the Supabase `courses` table to the corresponding Stripe Price ID

### 6. ⚙️ AI Provider API Keys Not Configured
All AI features (AI Tutor, Content Generator, Project Feedback, etc.) require an OpenAI API key.  
**Action needed:** Set `OPENAI_API_KEY` (or your AI provider's key) in Supabase → Settings → Edge Functions → Secrets.

---

## ⚠️ High Priority (Should Fix Before Launch)

### 7. 🎨 Missing Legal Pages (Terms of Service, Privacy Policy, Refund Policy)
**File:** `src/components/layout/Footer.tsx`  
The footer shows links for Privacy Policy, Terms of Service, and Refund Policy, but they all point to `href="#"` (nowhere). For a paid product, these pages are **legally required** in most countries.  
**Action needed in Lovable:** Create dedicated pages at `/privacy`, `/terms`, and `/refund` and update the footer links.  
**Alternative:** Link to a hosted legal document service (like Termly or Iubenda).

### 8. 🎨 Missing Social Media Links
**File:** `src/components/layout/Footer.tsx`  
Twitter, GitHub, and YouTube icons in the footer all link to `href="#"`.  
**Action needed in Lovable:** Replace `href="#"` with your real social media profile URLs, or remove the icons you don't use.

### 9. 🎨 Missing OG Social Share Image
**File:** `public/og-image.png` (missing)  
When someone shares your site on Twitter, Facebook, or LinkedIn, the preview will show a broken image. The `PageMeta` component references `/og-image.png` which doesn't exist.  
**Action needed:** Create a 1200×630px branded image and save it as `public/og-image.png`. Use your logo, academy name, and a tagline.

### 10. 👤 Fake Social Proof ("Join 10,000+ Solo Founders")
**File:** `src/pages/Auth.tsx` (line ~124)  
The auth page shows "Join 10,000+ Solo Founders" which is a placeholder marketing claim. Launching with a false user count will destroy trust if real users notice.  
**Action needed:** Remove this badge or replace it with accurate text (e.g., "Be among the first founders to join").

### 11. ⚙️ Email Verification / Confirmation Flow
**File:** `src/pages/Auth.tsx`  
After signing up, Supabase sends a verification email. The current sign-up handler immediately navigates to the dashboard (`navigate(from, { replace: true })`), which may fail if email confirmation is required.  
**Action needed:**
- In Supabase → Auth → Settings: decide if email confirmation is required
- If yes: update the sign-up handler to show a "Check your email" message instead of navigating to the dashboard
- If no (for faster onboarding): disable email confirmation in Supabase

### 12. 🎨 Footer "Resources" Links Are Placeholder
**File:** `src/components/layout/Footer.tsx`  
Documentation, Community, and Support links all point to `href="#"`.  
**Action needed in Lovable:** Either remove these links or replace them with real URLs (e.g., a Discord community, a help docs page, an email support link).

---

## 🟡 Medium Priority (Before or Shortly After Launch)

### 13. 🎨 Plug and Play Asset Download Not Implemented
**File:** `src/pages/CourseDetail.tsx` (line ~522)  
The "Download Asset" button for the course's plug-and-play bonus resource renders a non-functional button (no `onClick` or `href`).  
**Action needed in Lovable:** Implement the download by linking to a Supabase Storage URL or an external asset URL.

### 14. 👤 Twitter Handle Is a Placeholder
**File:** `src/lib/siteMeta.ts` (line 31)  
`TWITTER_HANDLE = "@SoloSuccessAcad"` — used in Twitter Card `<meta>` tags. Update to your real account.

### 15. 👤 Course Content Must Be Populated
The courses exist in the database but lessons, textbook chapters, and project prompts need to be fully populated for students to learn.  
**Action needed:** Use the Admin Dashboard → AI Content Generator to generate content for each course, or manually author the lessons.

### 16. 🎨 No Loading Skeleton States
**File:** `src/pages/Dashboard.tsx`  
While data is loading, most cards render blank/empty instead of skeleton placeholders, which makes the UI look broken.  
**Action needed in Lovable:** Add `Skeleton` components to show loading placeholders.

### 17. 🎨 Course Catalog Has No Search or Filter
**File:** `src/pages/Courses.tsx`  
Students can't filter or search courses. This is fine with 10 courses but noted for future growth.  
**Action needed in Lovable (nice-to-have):** Add search input and phase filter buttons.

### 18. 🛠️ Large JavaScript Bundle Warning
The production build shows several chunks larger than 500 KB:
- `Profile-*.js`: 661 KB  
- `AdminAnalytics-*.js`: 399 KB  
- `certificateGenerator-*.js`: 394 KB  

These large bundles slow down first load, especially on mobile.  
**Action needed:** These pages can be further optimized by splitting the `recharts`, `html2canvas`, and `jsPDF` libraries into their own lazy-loaded chunks using Vite's `manualChunks` in `vite.config.ts`.

### 19. ⚙️ Supabase Storage Buckets Must Exist
The app uploads avatars and project files to Supabase Storage. The buckets must be manually created before going live.  
**Action needed in Supabase:** Create the following storage buckets (with appropriate public/private settings):
- `avatars` (public — for profile pictures)
- `lesson-videos` (private — for lesson video content)  
- `project-files` (private — for student project submissions)

### 20. 🎨 No Email Notifications Being Sent
**File:** `supabase/functions/send-notification-email/`  
The notification email function exists but requires an email service provider (Resend, SendGrid, etc.) to be configured.  
**Action needed:** Set up an email provider and configure its API key in Supabase secrets. Update the `send-notification-email` function to use that provider.

---

## 🔵 Low Priority (Polish — Before or After Launch)

### 21. 🛠️ CORS Headers Are Wildcard (`*`)
**Files:** All `supabase/functions/*/index.ts`  
All edge functions use `"Access-Control-Allow-Origin": "*"` which allows any domain to call them.  
**Recommendation:** Restrict to your production domain after deploying (e.g., `"https://yourdomain.com"`).

### 22. 🎨 Auth Page No OAuth Buttons
The sign-in form only supports email/password. Adding Google OAuth would increase conversion.  
**Action needed in Lovable (optional):** Add Google OAuth buttons and enable the Google provider in Supabase → Auth → Providers.

### 23. 🛠️ No Route-Level Error Boundaries
**File:** `src/App.tsx`  
There is a top-level `ErrorBoundary` but no per-route error boundaries. A crash on one page takes down the whole app.  
**Recommendation:** Wrap each `<Route>` in its own `<ErrorBoundary>`.

### 24. 👤 `robots.txt` Has No Sitemap Reference
**File:** `public/robots.txt`  
The robots.txt is missing a `Sitemap:` directive, which helps search engines find your pages.  
**Action needed after deploying:** Generate a sitemap and add `Sitemap: https://yourdomain.com/sitemap.xml` to the robots.txt.

### 25. 🛠️ PWA Not Configured
`vite-plugin-pwa` is installed but not configured in `vite.config.ts`, so no PWA manifest is generated.  
**Action needed in Lovable or code:** Either configure PWA properly or remove the unused package.

### 26. 🎨 ESLint Has 270 Errors (Pre-Existing)
**Files:** Multiple admin components and edge functions  
Running `pnpm lint` shows 270 TypeScript and ESLint errors (mainly `@typescript-eslint/no-explicit-any`). These are pre-existing and won't block the build, but should be addressed over time for code quality.  
**Note:** These were present before this PR and are not new issues.

---

## Summary

| Priority | Count | Who |
|----------|-------|-----|
| 🚨 Critical (blockers) | 6 | Mix |
| ⚠️ High priority | 6 | Mix |
| 🟡 Medium priority | 8 | Mix |
| 🔵 Low priority / polish | 6 | Mix |
| ✅ Fixed in this PR | 3 | Developer |

**The most important actions before launching:**
1. Configure Stripe (pricing IDs, webhook, secrets)
2. Configure AI provider API key in Supabase secrets
3. Fix JWT verification in `supabase/config.toml`
4. Add legal pages (Privacy Policy, Terms of Service, Refund Policy)
5. Populate course content
6. Create Supabase Storage buckets
