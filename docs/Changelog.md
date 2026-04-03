# Changelog

All notable changes to SoloSuccess Academy are documented on this page.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.

---

## [0.7.0] — Documentation & Knowledge Base

### Added
- **Project Knowledge Document** — Comprehensive T=0 knowledge base documenting all implemented features, architecture, and security policies (`docs/KNOWLEDGE_T0.md`).

### Changed
- **Roadmap** — Updated to reflect current project state; moved 15+ items from "In Progress" and "Planned" to "Completed."
- **All Documentation** — Brought Changelog, Features, FAQ, Production Checklist, and Home wiki pages up to date.

### Removed
- **MIGRATION_NOTES.md** — Obsolete; Next.js → Vite migration completed long ago.
- **CURRICULUM_REFERENCE.md** — Obsolete; canonical reference lives in `docs/Curriculum.md`.

---

## [0.6.0] — Google OAuth & Textbook Enhancements

### Added
- **Google OAuth Sign-In** — One-click login via Lovable Cloud managed credentials using `@lovable.dev/cloud-auth-js`.
- **Full-Page Textbook Layout** — Textbook viewer expanded to fill the entire viewport.

### Fixed
- **Textbook Button Styling** — Resolved "blacked out" buttons by switching from `outline` to `ghost` variants across textbook panels.

---

## [0.5.0] — Email System & Student Grades

### Added
- **Transactional Email System** — Queue-based email delivery via `pgmq` with branded templates for signup, recovery, magic-link, invite, and reauthentication.
- **Email Send Log** — Full audit trail of all sent emails with status tracking.
- **Email Suppression** — Automatic suppression of bounced/complained addresses.
- **Unsubscribe Flow** — Token-based unsubscribe with dedicated `/unsubscribe` page.
- **Student Grades Page** — Detailed per-course grade breakdowns at `/grades`.
- **Transcript Page** — Academic record with GPA calculation at `/transcript`.
- **Sidebar Navigation Enhancements** — Added Notifications, Analytics, Content Generator links.

### Fixed
- **Transcript Grade Calculation** — Replaced dummy grades with real weighted calculations using `calculateCombinedGrade`.

---

## [0.4.0] — Assessment, Projects & Portfolio

### Added
- **Final Exam System** — Server-side grading via `grade_and_submit_exam` DB function with MCQ, true/false, and short-answer support.
- **Final Essay System** — Essay submissions with prompts, rubrics, word limits, and dual AI + admin scoring.
- **Practice Labs** — Hands-on labs with deliverable descriptions, difficulty levels, and AI feedback.
- **Course Project System** — Multi-milestone projects with rubric scoring, AI feedback, and graduation gating.
- **Portfolio Assembler** — Generate portfolio entries per course with executive summaries and connective narratives.
- **Graduation Gate** — Enforces course completion requirements before issuing certificates.
- **Admin Gradebook Enhancements** — Grade weights panel, manual overrides, admin notes, and PDF grade reports.
- **Bulk Content Generators** — Bulk generate lessons, assessments, supplemental content, and textbooks from admin.

---

## [0.3.0] — Certificates & Security

### Added
- **Auto-Generated PDF Certificates** — Students earn a certificate upon completing all lessons. Each certificate includes a unique `SSA-XXXX-XXXX` verification code.
- **Certificate Gallery Page** — Dedicated page displaying all earned certificates.
- **Public Certificate Verification** — Verify authenticity at `/verify/:code`.
- **10 Certificate Themes** — Each course has a distinct visual design.

### Fixed
- **Password Reset Redirect Bug** — Corrected routing to `/reset-password`.
- **Missing Forgot Password Link** — Added to sign-in form.

### Security
- `.env` file excluded from version control.

---

## [0.2.0] — Gamification & Community

### Added
- **XP System** — Experience points for lessons, quizzes, assignments, and streaks.
- **Streak Tracking** — Consecutive daily activity tracking.
- **Badge System** — Unlockable achievement badges.
- **Leaderboard** — Live XP ranking via backend function.
- **Discussion Forums** — Threaded forums per course with upvoting.
- **Notification Bell** — In-app notification center.
- **Student Profile Page** — Progress, XP, streaks, badges, and certificates.

---

## [0.1.0] — Core Platform

### Added
- **10-Course Curriculum** — Full structure across three phases.
- **AI Tutor** — Conversational AI on every lesson page.
- **Interactive Textbook Viewer** — Flip-book reader with highlights, bookmarks, comments, flashcards, embedded quizzes, TTS, vocabulary glossary, reading timer, and milestones.
- **Flashcard System** — SM-2 spaced-repetition flashcards.
- **Graded Quizzes** — Multiple-choice with instant feedback.
- **Assignments & Worksheets** — Submission flow with AI feedback.
- **Admin Dashboard** — Course management, AI content generation, analytics, and gradebook.
- **Email/Password Authentication** — Secure login with email verification.
- **Row Level Security** — All tables protected with RLS policies.
- **Rate Limiting** — AI endpoints rate-limited per user.
- **Cyberpunk Dark Theme** — Neon cyan and purple accent palette.
- **Responsive Design** — Mobile-first layout with collapsible sidebar.
- **Global Search** — Command palette for quick navigation.
- **Student Notepad Widget** — Draggable notes on all authenticated pages.
- **Continue-Later Bookmarking** — Resume from last position.
- **Reading Time Tracking** — Session analytics.
- **Legal Pages** — Privacy Policy, Terms of Service, Refund Policy.
- **Payment Integration** — Stripe checkout with webhook handling.
- **Social Share Image** — Branded OG image.
- **Loading Skeletons** — Placeholder UI during data loads.
- **Error Boundaries** — Global + per-route crash isolation.
- **CORS Hardening** — Shared module restricting origins.

---

*For the full list of planned changes, see [Roadmap](Roadmap.md).*
