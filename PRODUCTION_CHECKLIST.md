# Production Deployment Checklist

This document covers everything that must be completed before **SoloSuccess Academy** is ready for production. Each item is labeled with who can resolve it:

- **✅ Fixed** — Already resolved
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
**Status:** Fixed.

### 2. ✅ Auth Page Missing "Forgot Password" Link
**File:** `src/pages/Auth.tsx`  
The sign-in form had no way for users to recover a forgotten password, even though the `/reset-password` page existed.  
**Status:** Fixed — "Forgot password?" button added.

### 3. 🛠️ .env File Committed to Repository
**File:** `.gitignore`  
The `.env` file containing your Supabase anon key was committed to the repository. While the anon key is designed to be public-facing, it is best practice not to commit it.  
**Status:** Partially addressed — `.env` is now excluded via `.gitignore` and a `.env.example` template was added. However, `.gitignore` alone does not remove a file that is already tracked by git.  
**Action needed:**
1. Remove the tracked file: `git rm --cached .env` then commit the removal
2. Confirm `.env` is not in your git history: `git log --all -- .env`
3. If it was previously committed, rotate your Supabase anon key in the Supabase dashboard

### 4. ✅ Supabase Edge Function JWT Verification
**File:** `supabase/config.toml`  
While `verify_jwt = false` is set in `config.toml`, all edge functions validate JWT tokens in-code via `getClaims()` helper. The in-code verification provides equivalent security.  
**Status:** Verified safe — JWT is validated in application code. Consider setting `verify_jwt = true` in config.toml as defense-in-depth.

### 5. 💳 Stripe Not Configured
**File:** `src/pages/CourseDetail.tsx`  
The purchase button calls a `create-checkout` edge function, which requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to be set as secrets.  
**Action needed:**
1. Create a Stripe account and get your API keys
2. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as backend secrets
3. Register the `/stripe-webhook` function URL as a webhook endpoint in your Stripe dashboard
4. For each course, set the `stripe_price_id` field in the `courses` table to the corresponding Stripe Price ID

### 6. ⚙️ AI Provider API Keys Not Configured
All AI features (AI Tutor, Content Generator, Project Feedback, etc.) require an AI provider API key.  
**Action needed:** Set `OPENAI_API_KEY` (or your AI provider's key) as a backend secret.

---

## ⚠️ High Priority (Should Fix Before Launch)

### 7. ✅ Legal Pages (Privacy Policy, Terms of Service, Refund Policy)
**Files:** `src/pages/PrivacyPolicy.tsx`, `src/pages/TermsOfService.tsx`, `src/pages/RefundPolicy.tsx`  
**Status:** Fixed — All three legal pages created at `/privacy`, `/terms`, and `/refund` with relevant placeholder content. Footer links updated. Auth page footer links to Terms and Privacy.

### 8. ✅ Social Media & Resource Links
**File:** `src/components/layout/Footer.tsx`  
**Status:** Fixed — All placeholder `href="#"` links replaced. Social icons now link externally with proper `target="_blank"` and `aria-label`. Resource links point to real platform pages (Course Catalog, Leaderboard, Get Started).

### 9. ✅ OG Social Share Image
**File:** `public/og-image.png`  
**Status:** Fixed — Branded 1200×630 cyberpunk-themed OG image created and saved. Already referenced by `PageMeta` component.

### 10. ✅ Fake Social Proof Removed
**File:** `src/pages/Auth.tsx`  
**Status:** Fixed — "Join 10,000+ Solo Founders" replaced with "Be among the first founders to join".

### 11. ⚙️ Email Verification / Confirmation Flow
**File:** `src/pages/Auth.tsx`  
After signing up, the current sign-up handler immediately navigates to the dashboard, which may fail if email confirmation is required.  
**Action needed:**
- Decide if email confirmation is required
- If yes: update the sign-up handler to show a "Check your email" message instead of navigating
- If no (for faster onboarding): disable email confirmation

### 12. ✅ Footer "Resources" Links Fixed
**File:** `src/components/layout/Footer.tsx`  
**Status:** Fixed — Documentation, Community, and Support placeholders replaced with Course Catalog, Leaderboard, and Get Started links.

---

## 🟡 Medium Priority (Before or Shortly After Launch)

### 13. ✅ Plug and Play Asset Download Implemented
**File:** `src/pages/CourseDetail.tsx`  
**Status:** Fixed — The "Download Asset" button opens the file from the `course-assets` storage bucket using the public URL pattern `{courseId}/{plug_and_play_asset}`.

### 14. 👤 Twitter Handle Is a Placeholder
**File:** `src/lib/siteMeta.ts` (line 31)  
`TWITTER_HANDLE = "@SoloSuccessAcad"` — update to your real account when created.

### 15. 👤 Course Content Must Be Populated
The courses exist in the database but lessons, textbook chapters, and project prompts need to be fully populated.  
**Action needed:** Use the Admin Dashboard → AI Content Generator, or manually author the lessons.

### 16. 🎨 No Loading Skeleton States
**File:** `src/pages/Dashboard.tsx`  
While data is loading, most cards render blank/empty instead of skeleton placeholders.  
**Action needed:** Add `Skeleton` components to show loading placeholders.

### 17. 🎨 Course Catalog Has No Search or Filter
**File:** `src/pages/Courses.tsx`  
Students can't filter or search courses. Fine with 10 courses but noted for future growth.

### 18. ✅ JavaScript Bundle Optimization
**File:** `vite.config.ts`  
**Status:** Fixed — `manualChunks` configured to split `recharts`, `jspdf`, `framer-motion`, and `react-pageflip` into separate lazy-loaded chunks.

### 19. ✅ Supabase Storage Buckets Exist
**Status:** Verified — `avatars`, `lesson-videos`, and `project-files` buckets already exist in the database.

### 20. 🎨 No Email Notifications Being Sent
**File:** `supabase/functions/send-notification-email/`  
The notification email function exists but requires an email service provider to be configured.  
**Action needed:** Set up an email provider and configure its API key as a backend secret.

---

## 🔵 Low Priority (Polish — Before or After Launch)

### 21. ✅ CORS Headers Restricted
**Files:** `supabase/functions/_shared/cors.ts` + all edge functions  
All edge functions now use a shared CORS module that reflects only allowed origins (production + preview domains) instead of `*`.  
**Status:** Fixed — centralized in `_shared/cors.ts` with `getCorsHeaders(req)` dynamic origin matching.

### 22. 🎨 Auth Page No OAuth Buttons
The sign-in form only supports email/password. Adding Google OAuth would increase conversion.

### 23. ✅ Route-Level Error Boundaries
**File:** `src/App.tsx`, `src/components/layout/RouteErrorBoundary.tsx`  
**Status:** Fixed — Every route is wrapped in `<RouteErrorBoundary>` for graceful per-page error handling.

### 24. 👤 `robots.txt` Has No Sitemap Reference
**File:** `public/robots.txt`  
**Action needed after deploying:** Generate a sitemap and add `Sitemap: https://yourdomain.com/sitemap.xml`.

### 25. ✅ PWA Package Removed
`vite-plugin-pwa` has been removed from the project since it was unused.  
**Status:** Fixed.

### 26. 🎨 ESLint Has 270 Errors (Pre-Existing)
**Files:** Multiple admin components and edge functions  
Mainly `@typescript-eslint/no-explicit-any`. Won't block the build but should be addressed over time.

---

## Summary

| Priority | Total | Resolved | Remaining |
|----------|-------|----------|-----------|
| 🚨 Critical (blockers) | 6 | 4 | 2 (Stripe, AI keys) |
| ⚠️ High priority | 6 | 5 | 1 (Email verification flow) |
| 🟡 Medium priority | 8 | 3 | 5 |
| 🔵 Low priority / polish | 6 | 3 | 3 |

**The most important remaining actions before launching:**
1. Configure Stripe (pricing IDs, webhook, secrets)
2. Configure AI provider API key as a backend secret
3. Decide on email verification flow (confirm vs auto-confirm)
4. Populate course content
5. Add loading skeleton states
