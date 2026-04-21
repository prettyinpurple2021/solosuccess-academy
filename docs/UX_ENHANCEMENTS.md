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
