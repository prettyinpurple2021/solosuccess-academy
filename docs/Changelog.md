# Changelog

All notable changes to SoloSuccess Academy are documented on this page.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.

---

## [Unreleased]

### In Progress
- Legal pages: Privacy Policy, Terms of Service, Refund Policy
- Stripe payment integration
- Email notifications via transactional email provider
- Loading skeleton states on Dashboard and Courses pages
- Social media links in footer
- Branded OG/social-share image

---

## [0.3.0] — Certificates & Security

### Added
- **Auto-Generated PDF Certificates** — Students earn a certificate upon completing all lessons and passing a course quiz. Each certificate includes the student's name, course title, completion date, and a unique `SSA-XXXX-XXXX` verification code.
- **Certificate Gallery Page** — Dedicated page displaying all earned certificates with download buttons.
- **Public Certificate Verification** — Anyone can verify a certificate's authenticity via the public verification URL.
- **10 Certificate Themes** — Each course has a distinct visual design theme (e.g., vintage compass, cyberpunk circuit, steampunk gears).

### Fixed
- **Password Reset Redirect Bug** — The "Reset Password" button on the Settings page was routing to a non-existent path. Corrected to `/reset-password`.
- **Missing Forgot Password Link** — The sign-in form now includes a "Forgot password?" link that initiates the recovery email flow.

### Security
- `.env` file excluded from version control via `.gitignore`; a `.env.example` template was added.

---

## [0.2.0] — Gamification & Community

### Added
- **XP System** — Students earn experience points for completing lessons, quizzes, assignments, and maintaining daily login streaks.
- **Streak Tracking** — Consecutive days of activity are tracked and displayed on the student profile.
- **Badge System** — Unlockable achievement badges for key milestones.
- **Leaderboard** — Live ranking of all students by total XP.
- **Discussion Forums** — Threaded community forums per lesson with reply notifications.
- **Notification Bell** — In-app notification center for replies and grading alerts.
- **Student Profile Page** — Displays progress, XP, streaks, badges, and certificates.

---

## [0.1.0] — Core Platform

### Added
- **10-Course Curriculum** — Full course structure across three phases: Initialization, Orchestration, and Launch Sequence.
- **AI Tutor** — Conversational AI assistant available on every lesson page.
- **Interactive Textbook Viewer** — Flip-book style reader with highlighting and margin notes.
- **Flashcard System** — SM-2 spaced-repetition flashcards generated from lesson content.
- **Graded Quizzes** — Multiple-choice assessments with instant feedback and score tracking.
- **Assignments & Worksheets** — Submission flow with AI-powered feedback.
- **Admin Dashboard** — Course management, AI content generation, student analytics, and gradebook.
- **Email/Password Authentication** — Secure login with email verification.
- **Row Level Security** — All database tables protected with RLS policies.
- **Rate Limiting** — AI endpoints rate-limited to 20 requests/hour per user.
- **Cyberpunk Dark Theme** — Neon cyan and purple accent color palette.

---

*For the full list of planned changes, see [Roadmap](Roadmap.md).*
