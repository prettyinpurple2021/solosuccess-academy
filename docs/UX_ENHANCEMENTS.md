
## Maintenance — 2026-04-26

### Edge Function Deno Type Warnings (resolved)
- Replaced incorrect `lib: ["deno.ns", "deno.unstable"]` in `supabase/functions/deno.json` with `["esnext", "dom", "dom.iterable", "deno.ns", "deno.unstable"]` so DOM globals (`Response`, `Request`, `fetch`, `console`, `Headers`, `URL`) and the `Deno` namespace are both available during type-check.
- Emptied `supabase/functions/deno.d.ts` — its hand-written shims duplicated DOM/Deno declarations and used a too-narrow `@supabase/supabase-js` interface, masking real type errors and triggering duplicate-identifier conflicts.
- Cast `createClient` to `any` in `process-email-queue/index.ts` and `send-notification-email/index.ts` because they query dynamic table names and use the Auth Admin API that the generated `Database` types don't model. RLS still protects the data; this is purely a TypeScript ergonomics fix.

### Storage Linter — `0025_public_bucket_allows_listing` (resolved)
- Dropped the broad `"Public read access for course assets"` SELECT policy on `storage.objects` for the `course-assets` bucket.
- Replaced with `"Admins can list course assets"` (admin-only listing).
- Course covers and Plug-and-Play downloads still load — the app uses `getPublicUrl()` (CDN) which doesn't require a SELECT policy on `storage.objects` for known object paths.
# UX Enhancements — Implementation Log

> **Status legend:** ✅ Shipped · 🚧 In progress · 📋 Planned
> **Updated:** 2026-04-18 · See chat history for original 26-item suggestion list.

This document tracks every UX enhancement shipped after the account-management
suite was completed. Each entry covers what was built, the files touched,
known issues found while building, and any follow-up improvements queued.

---

## ✅ Batch 1 — Foundation (shipped 2026-04-18)

### 1. Reduced-motion accessibility mode

**Goal:** Honor the OS-level `prefers-reduced-motion` setting *and* expose a
manual override so users sensitive to motion (or on low-power hardware) can
turn off all decorative animation.

**Implementation**
- New hook `src/hooks/useReducedMotion.ts` — combines OS media query and a
  `localStorage` preference (`system` | `reduce` | `full`). Sets
  `data-reduce-motion="true|false"` on `<html>`.
- New helper `src/lib/initReducedMotion.ts` — runs once before React mounts
  in `src/main.tsx` so the very first paint already reflects the preference
  (no flash of animated UI).
- Decorative components short-circuit to `null` when reduced:
  `src/components/landing/NebulaBackground.tsx`,
  `src/components/landing/StarField.tsx`,
  `src/components/landing/FloatingParticles.tsx`.
- CSS safety net at the bottom of `src/index.css` collapses any remaining
  `animation-duration` / `transition-duration` to ~0ms when the attribute
  is set, and hides `.nebula-cloud` + `.cyber-grid::after`.
- New Settings card `src/components/settings/AccessibilityCard.tsx` exposes
  the three-way radio (System / Reduce / Full) and is mounted in
  `src/pages/Settings.tsx` between Sessions and Danger Zone.

**Notes / things to keep an eye on**
- Tailwind config does *not* yet emit motion-safe / motion-reduce variants
  for utility classes. We rely on the global CSS reset in `index.css`
  which is broad but effective. If a specific component needs richer
  control (e.g., always-on success animations), wrap it in `motion-safe:`
  or read `useReducedMotion()` directly.
- The CSS rule `animation-duration: 0.001ms` keeps event listeners (e.g.
  `animationend`) firing so JS that depends on them still works.
- StarField had a hook-order trap when adding the early-return — moved
  the `if (reducedMotion) return null` *after* `useMemo`. Worth noting
  for any future component that adds an early return.

---

### 2. Toast actions for lesson completion flow

**Goal:** Replace passive "Lesson complete" toasts with actionable ones that
include a "Next lesson →" button so students can advance without scrolling
or finding the nav button.

**Implementation**
- Adopted Sonner toasts (already mounted globally in `App.tsx`) for the three
  completion paths in `src/pages/LessonViewer.tsx`:
  1. Quiz pass (`handleQuizSubmit`)
  2. Activity 100% complete (`handleActivityProgress`)
  3. Manual "Mark as Complete" (`handleMarkComplete`)
- Each toast surfaces an action button when there *is* a next lesson; falls
  back to a static success toast on the final lesson.
- Course-completion toast intentionally stays as the legacy `useToast` so
  the celebratory certificate modal isn't pre-empted by a side toast.
- Error/warning toasts continue to use the legacy `useToast` for visual
  consistency with the rest of the app.

**Notes**
- Sonner action buttons use the project's design tokens automatically via
  the existing `<Toaster />` config in `components/ui/sonner.tsx`.
- The "Next lesson" navigation uses `react-router`'s `navigate()` so it
  preserves history (back button works).

---

## ✅ Batch 2 — Engagement (shipped 2026-04-21)

### 3. Mobile bottom tab bar

**Goal:** Replace the hamburger-only mobile nav with a persistent bottom
tab bar so primary destinations are always one tap away.

**Implementation**
- New component `src/components/layout/MobileBottomNav.tsx`. Five slots:
  Home (Dashboard) · Courses · Search · Profile · More.
- Search slot opens the existing `<GlobalSearch />` command palette
  (the same one bound to ⌘K on desktop).
- "More" opens a right-side `<Sheet>` listing every other destination
  (Grades, Leaderboard, Certificates, Transcript, Notifications,
  Settings, Help) plus a full Admin section gated by `useIsAdmin`,
  ending with Sign Out.
- `src/components/layout/AppLayout.tsx` now:
  - Hides the desktop `<AppSidebar />` on mobile via `hidden md:flex`.
  - Removes the old mobile-only sticky top header that only held the
    hamburger trigger.
  - Adds `pb-[calc(64px+env(safe-area-inset-bottom))]` to `<main>` so
    bottom-nav doesn't cover content (incl. iOS home indicator).
  - Mounts `<MobileBottomNav />` (which renders `null` above `md`).

**Notes**
- Bottom nav uses semantic tokens (`bg-background/85`, `border-primary/20`,
  `drop-shadow` on the active icon) — no hardcoded colors.
- `aria-current="page"` is set on the active tab; each tab is min-height
  56px to satisfy WCAG 2.5.5 (target size 44×44 minimum).
- The `NotepadWidget` floats above the bottom nav by stacking order;
  if it ever overlaps on small screens we can add `bottom-20 md:bottom-4`
  to its draggable default position (deferred — does not currently clash).

---

### 4. Daily study goals (lessons + minutes)

**Goal:** Per-user daily targets (lessons completed AND active minutes)
with a progress card on the dashboard, helping students protect their
streaks intentionally instead of guessing what counts.

**Implementation**
- New hook `src/hooks/useDailyGoals.ts`:
  - `useDailyGoalsConfig(userId)` — reads/writes targets to
    `localStorage` keyed per user (`ssa.dailyGoals.<uid>`).
    Defaults: 1 lesson, 20 minutes, `configured: false`.
  - `useDailyProgress(userId)` — counts today's `user_progress` rows
    where `completed = true AND completed_at >= midnight local` and
    sums `reading_sessions.duration_seconds` for today.
- New dashboard widget `src/components/gamification/DailyGoalCard.tsx`
  shows two stacked progress bars (lessons + minutes), success-tinted
  when met, with a "Goal smashed!" line when both active goals complete.
  Renders nothing if both targets are 0.
- Mounted in `src/pages/Dashboard.tsx` as the first item in the right
  sidebar, above "Your Roadmap".
- New settings card `src/components/settings/DailyGoalsCard.tsx` — two
  sliders (0–10 lessons, 0–120 minutes). Setting either to 0 turns
  that goal off; both at 0 hides the dashboard card entirely.

**Notes / known limits**
- Targets are **not yet synced across devices** — they live in
  `localStorage` to ship fast without a migration. Documented as a
  follow-up: add a `user_study_goals` table.
- "Active minutes" currently counts only textbook reading time
  (`reading_sessions`). Lesson-watch minutes will be added when we
  introduce a `lesson_sessions` tracker analogous to reading sessions.
- Progress query has `staleTime: 60_000`; lessons completed via the
  toast flow won't visibly update the card for up to a minute. We
  could `invalidateQueries(['daily-progress', userId])` from the
  lesson-completion mutation later — flagged.

---

## 🚧 Batch 3 — Trust & Account (planned)

---

### 5. Two-factor authentication (TOTP only)
- Plan: enrollment flow in Settings (QR + secret), 6-digit verification on
  sign-in, recovery codes (NB: user picked "TOTP only" — no recovery codes
  in v1 — flagging this as a gap to revisit because losing a phone bricks
  the account otherwise).

---

## 🔎 Known issues / cleanup queue

| Area | Issue | Severity | Notes |
|------|-------|---------|-------|
| Settings.tsx | Pre-existing lint warning at line 118 (hardcoded `text-amber-400` for the Sun icon) | Low | Not introduced by this batch; consider mapping to `text-warning` token. |
| Sonner toasts | Legacy and Sonner toasters both mounted (see `App.tsx`). Two visual styles coexist. | Low | Acceptable during transition; consider migrating all toasts to Sonner long-term. |
| 2FA | No SMS or recovery codes selected at launch — phone loss = account loss | **HIGH (re-confirm before launch)** | Suggest re-discussing recovery codes before going live. |

---

## 🧭 Out-of-scope items (from the original 26-item suggestion list)
The following items are intentionally deferred until after the top-5 ship:
6, 7, 8, 9, 10 (learning experience extras),
11–14 (engagement & social),
16–18 (further accessibility passes),
20–21 (PWA / offline),
22–23 (notification granularity & push),
25–26 (login activity log, GDPR export).

---

## ✅ Batch 3 — Two-Factor Authentication (shipped 2026-04-26)

### 5. TOTP-only 2FA with recovery codes

**Goal:** Production-grade account security via authenticator-app (TOTP)
two-factor authentication, plus 10 one-time recovery codes for users who
lose access to their authenticator. SMS/Twilio intentionally skipped to
honor the $0-budget constraint.

**Implementation**

Database (`mfa_recovery_codes`):
- New table `public.mfa_recovery_codes` with `user_id`, `code_hash` (SHA-256),
  `used_at`, `created_at`. RLS allows users to *read* their own metadata
  but blocks all direct writes — codes can only be created/consumed via
  `SECURITY DEFINER` functions.
- `generate_mfa_recovery_codes()` — wipes prior codes, mints 10 fresh
  `xxxxx-xxxxx` plaintext codes, stores only hashes, returns plaintext
  *once* in the JSON response.
- `consume_mfa_recovery_code(_code)` — hashes the input, marks the matching
  unused row as used, returns `true`/`false`.

Frontend:
- New hook `src/hooks/useMfa.ts` — wraps `supabase.auth.mfa.*` (enroll,
  challenge, verify, listFactors, unenroll, getAuthenticatorAssuranceLevel)
  and the two recovery-code RPCs.
- New `src/components/settings/TwoFactorCard.tsx` — three-stage flow:
  *idle* (enable/disable) → *enrolling* (QR code from Supabase + manual
  secret + 6-digit verify) → *showing-recovery* (10 codes with
  copy/download). Mounted in `src/pages/Settings.tsx` after `SessionsCard`.
  Includes "Regenerate Recovery Codes" for already-enrolled users.
- New `src/components/auth/MfaChallengeForm.tsx` — step-up prompt rendered
  by `src/pages/Auth.tsx` when password sign-in succeeds at AAL1 but the
  account requires AAL2. Supports either a 6-digit TOTP code OR a recovery
  code (recovery path also unenrolls the lost factor so the user can
  re-enroll a fresh authenticator afterwards).

**Why these choices**
- **TOTP via Supabase native MFA** — zero ongoing cost, industry-standard,
  works with every authenticator app. Supabase returns the QR as an SVG
  data URL so we don't need the `qrcode` npm package.
- **Hashed recovery codes** — even a database leak can't reveal codes;
  we only store SHA-256 hashes via `pgcrypto.digest`.
- **`SECURITY DEFINER` + blocked direct writes** — prevents privilege
  escalation; users can never insert codes for themselves or others.

**Notes / things to keep an eye on**
- We don't yet enforce AAL2 on sensitive routes (e.g., delete account,
  change password). Right now, MFA only gates initial sign-in. A future
  pass should re-challenge for high-impact actions.
- Recovery codes table uses `ON DELETE CASCADE` from `auth.users`, so
  account deletion automatically purges codes.
- `MfaChallengeForm` cancel signs the user out — we don't keep half-
  authenticated sessions hanging around.
- Pre-existing Supabase linter warning about a public storage bucket
  (`course-assets`) remains; unrelated to this batch and intentional.

---

## All five high-ROI enhancements complete

Batches 1 + 2 + 3 cover items #1, 2, 3, 4, 5 from the original 26-item
list. Remaining items (6–26) are queued for follow-up sessions per the
priority breakdown at the top of this document.

---

## Batch 3.5 — Recovery code sign-in flow polish

**What changed**
- Added `confirm_mfa_recovery_code(_code)` Postgres RPC that returns
  rich JSON (`accepted`, masked tail of the code, `used_at`,
  `remaining`) instead of a bare boolean. Plaintext codes are still
  never stored — only SHA-256 hashes.
- Added `confirmRecoveryCode()` to `useMfa` hook wrapping the new RPC.
- `MfaChallengeForm` now has three states for the recovery path:
  1. **Enter** — segmented `InputOTP` (5 + 5 chars) with separator,
     accepts only `[a-z0-9]`, auto-lowercases.
  2. **Confirm** — after acceptance, shows a card with the masked code
     (`••••••-••••XXXX`), the timestamp it was consumed, the number of
     codes remaining, and a warning to re-enroll the authenticator.
     User must click **Continue** before being routed to the app.
  3. **Continue** → `onSuccess()` (same callback used by TOTP path).
- Existing TOTP factor is unenrolled automatically when a recovery
  code is consumed (the assumption is the original device is lost).

**Why these choices**
- The previous recovery flow used a free-text input and silently
  redirected. Users had no confirmation of *which* code was burned,
  which is bad for trust on a single-use credential.
- The masked tail (last 4 chars) is enough to cross-reference against
  the printed/saved list without revealing the full code in any logs.
- `remaining` count gently nudges users to regenerate codes when the
  pool is low.

**Files**
- `supabase/migrations/...confirm_mfa_recovery_code.sql`
- `src/hooks/useMfa.ts` — added `confirmRecoveryCode`
- `src/components/auth/MfaChallengeForm.tsx` — full rewrite of recovery branch

**Known follow-ups**
- Show "Only N codes left — generate fresh ones" banner in Settings
  when `remaining < 3`.
- Send a transactional email after a recovery code is consumed so the
  user has an audit trail (and is alerted if it wasn't them).
