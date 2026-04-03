# SoloSuccess Academy — Project Knowledge (T=0)

> Generated: 2026-04-03 | Snapshot of all implemented features and architecture

---

## 1. Architecture Overview

Project architecture: **React 18 + Vite 5 + Tailwind v3 + TypeScript 5** frontend with **Lovable Cloud (Supabase)** backend. Three route groups (Public, Protected, Admin) with code-splitting via `React.lazy`. Provider hierarchy: QueryClient → ErrorBoundary → Helmet → Theme → Gamification → Router. 37 pages, 29 edge functions, 57 migrations.

## 2. Authentication

Email/password auth with email verification via Supabase Auth. Session timeout after 30 min inactivity with warning toast at 29 min. Auto-created profile row on signup via DB trigger. Password reset flow via email link (`/reset-password`). Email unsubscribe support (`/unsubscribe`). Protected routes via `AppLayout` auth check.

## 3. Course Catalog & Purchasing

10 courses across 3 phases (Initialization, Orchestration, Launch) with 78 lessons total. Public course catalog with lesson previews (title, description, type, duration). Stripe checkout integration via `create-checkout` edge function and `stripe-webhook` handler. `PurchaseGuard` component for route-level access control. Courses priced at $49 each.

## 4. Lesson System

6 lesson types: text, video, quiz, assignment, worksheet, activity. Each type has structured JSONB data (`quiz_data`, `worksheet_data`, `activity_data`). Dedicated viewer components: `QuizPlayer`, `WorksheetPlayer`, `ActivityViewer`, etc. Progress tracking via `user_progress` table with quiz scores, worksheet answers, activity scores, and admin override support.

## 5. Textbook System

Interactive flip-book textbook viewer (`HTMLFlipBook`) with full-page layout. Chapters and pages stored in `textbook_chapters`/`textbook_pages` tables. Features: text highlights, bookmarks, inline comments, vocabulary glossary, flashcards with spaced repetition, embedded quizzes, text-to-speech, reading timer, reading milestones, "Explain This" AI panel, keyboard navigation help.

## 6. Assessment & Grading

Final exams (`course_final_exams`) with multiple-choice questions, passing scores, and attempt tracking. Final essays (`course_essays`) with prompts, rubrics, and word limits. Practice labs with AI feedback. Admin gradebook with manual override scoring. Student grades page. Grade weights panel for admins.

## 7. Gamification

XP system with `GamificationProvider` context. Streaks (current/longest) tracked in `user_gamification` table. Badges display. Leaderboard via `get-leaderboard` edge function. XP notifications on actions. Confetti hook for celebrations.

## 8. Certificates & Portfolio

Certificate generation on course completion with verification codes. Public verification page (`/verify/:code`). Certificate themes. Portfolio assembler with entries per course (executive summary, narrative, deliverables). Transcript page showing academic record.

## 9. Discussion Board

Threaded discussions per course with CRUD. Nested comments. Upvoting system with per-user tracking. Real-time updates via Supabase subscriptions. Purchase-gated access. Admin moderation. Pagination. Email notifications on replies via `notify-discussion-reply` edge function.

## 10. AI Capabilities

AI tutor chat (`ai-tutor` edge function) with session persistence. Content generation for courses, lessons, quizzes, worksheets, activities, textbooks, and exams. Bulk generation tools (lessons, assessments, supplemental, textbooks). "Explain This" text selection feature. Practice and project feedback via AI. Image, video, and voice generation. AI gateway with retry logic (`aiGateway.ts` shared helper).

## 11. Admin Suite

Admin dashboard with course/lesson management. Course editor, lesson editor with Markdown preview and auto-save. Quiz, worksheet, activity, textbook, and milestone editors. Bulk content generation buttons. Asset/document/video upload. Analytics page. Gradebook. Exam/essay management. AI settings with API key management. Content generator page with smart prompts.

## 12. Email System

Custom auth email hook with branded templates (signup, recovery, invite, magic-link, etc.). Transactional email system with queue processing. Email send log and rate limiting. Suppressed emails tracking. Unsubscribe token management. Contact form submissions via edge function.

## 13. UI & UX

Cyberpunk/neon design theme with nebula background, star field, floating particles. Dark mode default with theme toggle. Mobile-responsive sidebar navigation. Global search. Breadcrumb navigation. Skip links for accessibility. Error boundaries (global + per-route). Loading skeletons. Toast notifications (dual system: shadcn + sonner). Notepad widget. Continue-later bookmarking. Reading progress bar.

## 14. Student Tools

Student notepad widget with drag/resize. Continue-later bookmarking per course. Reading time tracking (`reading_sessions` table). Learning objectives tracking (`user_objective_progress`). Assignment submission system. Keyboard navigation support. AI tutor chat per lesson. Notification bell with read/unread state.

## 15. Security & RLS Policies

All tables have RLS enabled. Key patterns: `user_id = auth.uid()` for self-access; `has_role()` security definer function for admin checks; `has_purchased_course()` for purchase-gated content; `has_completed_course()` for certificate creation. Purchases table is fully locked (insert/update/delete = false for users, only `service_role` via webhooks). Admin API keys hidden from students.

---

## Technical Summary

| Category | Details |
|---|---|
| **Database** | 30+ tables with comprehensive RLS policies |
| **Edge Functions** | 29 deployed (AI, payments, email, content generation) |
| **Shared Utilities** | AI gateway with retry/backoff, CORS handler, rate limiter, email templates |
| **Testing** | Vitest setup with example tests for hooks and utilities |
| **SEO** | react-helmet-async with PageMeta component and siteMeta config |
| **Deployment** | Vercel config (vercel.json) with SPA rewrites |
