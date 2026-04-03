# Features

SoloSuccess Academy provides a rich, interactive learning experience built around the needs of solo founders. This page documents every major feature available on the platform.

---

## Student Features

### 📚 10-Course Curriculum
A structured learning path divided into three phases — Initialization, Orchestration, and Launch Sequence — guiding students from foundational mindset work through market research, branding, automation, content strategy, financial bootstrapping, sales psychology, strategic roadmapping, and final pitch delivery. Each course includes lessons (6 types), assignments, quizzes, a textbook, a capstone project, and a final exam/essay.

See [Curriculum](Curriculum.md) for the full course and lesson listing.

---

### 🤖 AI Tutor
An intelligent, conversational tutoring assistant available on every lesson page. Students can ask questions, request explanations, or explore ideas in real time. Chat sessions are persisted so students can return to previous conversations.

---

### 📖 Interactive Textbooks
Each course includes a full-page flip-book style digital textbook with:
- Text highlighting with color options and notes
- Page bookmarking
- Inline comments per paragraph
- Vocabulary glossary
- Embedded quizzes with server-side answer checking
- Text-to-speech reading
- Reading timer and milestones
- "Explain This" AI panel for selected text
- Flashcard generation from highlighted passages
- Keyboard navigation support

---

### 🃏 Flashcard System
A built-in spaced-repetition flashcard system powered by the **SM-2 algorithm**. Flashcards can be auto-generated from textbook highlights or created manually. Review intervals adapt based on student performance.

---

### 📝 6 Lesson Types
Every lesson falls into one of six interactive types:

| Type | Description |
|------|-------------|
| **Text** | Rich content with Markdown rendering |
| **Video** | Video lessons with signed URL playback |
| **Quiz** | Multiple-choice with instant feedback and scoring |
| **Assignment** | Written submissions with AI feedback |
| **Worksheet** | Structured multi-question exercises with answer tracking |
| **Activity** | Step-by-step guided activities |

---

### 🎯 Final Exams
Each course can include a comprehensive final exam with:
- Multiple-choice, true/false, and short-answer questions
- Server-side grading (answers never exposed to client)
- Pass/fail determination with configurable passing scores
- Multiple attempt tracking

---

### ✍️ Final Essays
Courses can include essay assessments with:
- Multiple prompt options
- Rubric-based grading criteria
- Word limits and word count tracking
- Dual scoring: AI-generated and admin manual grades

---

### 🔬 Practice Labs
Hands-on labs attached to lessons with:
- Detailed instructions and deliverable descriptions
- Difficulty levels and time estimates
- File upload support
- AI-powered feedback and scoring

---

### 🏗️ Course Projects
Multi-milestone capstone projects per course featuring:
- Sequential milestone submissions with deliverable prompts
- Rubric-based scoring across multiple categories
- AI feedback on each milestone
- Graduation gating (all milestones required for completion)

---

### 📋 Portfolio Assembler
Students can assemble a professional portfolio from their course work:
- Executive summary per course
- Connective narratives linking projects
- Deliverable content from milestone submissions
- Ordered entries for a cohesive presentation

---

### 💬 Discussion Forums
Threaded community discussions per course:
- Create topics and reply with nested comments
- Upvoting system with per-user tracking
- Email notifications on replies
- Purchase-gated access
- Admin moderation and pinning

---

### 🎮 Gamification System

| Element | Description |
|---------|-------------|
| **XP (Experience Points)** | Earned by completing lessons, quizzes, assignments, and daily logins |
| **Streaks** | Consecutive days of activity tracked with current and longest records |
| **Badges** | Unlockable achievements for milestones |
| **Leaderboard** | Live ranking of all students by total XP |
| **Confetti** | Celebration animations on achievements |

---

### 📜 Verified Certificates
Upon completing all lessons, students receive an auto-generated PDF certificate including:
- Student's full name and course title
- Completion date and unique verification code (`SSA-XXXX-XXXX`)
- Public verification URL at `/verify/:code`
- 10 unique visual themes (one per course)

---

### 📊 Student Grades
A dedicated grades page showing per-course breakdowns:
- Quiz, activity, worksheet, exam, and essay score averages
- Combined weighted grade with configurable weights
- Letter grade and GPA calculation

---

### 📄 Academic Transcript
A transcript page showing the student's complete academic record across all enrolled courses, including letter grades and cumulative GPA.

---

### 🔔 Notifications
An in-app notification system with:
- Bell icon with unread count badge
- Alerts for discussion replies, grading updates, and milestones
- Read/unread state tracking
- Sidebar link for easy access

---

### 👤 Student Profile
Each student has a profile page displaying:
- Display name, avatar (uploadable), and bio
- Enrolled courses and progress
- Earned badges and certificates
- XP total and streak count

---

### 📝 Notepad Widget
A floating, draggable notepad widget available on all authenticated pages for quick note-taking during lessons.

---

### ⏯️ Continue Later
Bookmark your position in any course to resume learning exactly where you left off.

---

### ⌨️ Keyboard Navigation
Full keyboard support across the lesson viewer and textbook with documented shortcuts.

---

### 🔍 Global Search
Command palette (Cmd+K / Ctrl+K) for quick navigation across courses, pages, and settings.

---

## Admin Features

### 📋 Course Management
Full CRUD for courses and lessons with:
- Course editor (title, description, phase, pricing, cover image, assets)
- Lesson editor with Markdown preview and auto-save
- Drag-and-drop lesson reordering
- Publish/unpublish controls

---

### 🤖 AI Content Generator
Generate content using AI with customizable prompts:
- Lesson text, quiz questions, worksheet prompts, activity steps
- Textbook chapters and pages
- Final exam questions and essay prompts
- Smart prompt dialog for fine-tuned generation

---

### 📦 Bulk Generation Tools
- **Bulk Generate Lessons** — Generate all lessons for a course
- **Bulk Generate Assessments** — Generate quizzes and worksheets
- **Bulk Generate Supplemental** — Generate practice labs
- **Bulk Generate Textbooks** — Generate all textbook content
- **Enrich Lessons** — Add descriptions and metadata to existing lessons

---

### 📊 Analytics Dashboard
Real-time metrics including:
- Revenue charts and enrollment counts
- Engagement and completion rates
- Student activity over time

---

### 📒 Gradebook
Comprehensive grading interface with:
- Per-student score table (quiz, activity, worksheet, exam, essay)
- Manual score overrides with admin notes
- Grade weight management per course
- PDF grade report export

---

### 🎓 Exam & Essay Manager
- Create and edit final exams and essays per course
- Bulk generate exam questions and essay prompts
- View student attempts and submissions

---

### 🔧 AI Settings
- API key management for AI providers
- Model selection and configuration

---

### 📁 Asset Management
- Image, video, document, and voice uploads
- AI-powered image and video generation
- Course asset storage with public download URLs

---

## Platform-Wide Features

### 🔐 Security
- **Row Level Security (RLS)** — All tables protected; students access only their own data
- **Security Definer Functions** — `has_role()`, `has_purchased_course()`, `has_completed_course()` for access control
- **Email Authentication** — Mandatory email verification on signup
- **Google OAuth** — One-click sign-in via Lovable Cloud managed credentials
- **Session Timeout** — Auto-logout after 30 min inactivity with warning toast
- **Rate Limiting** — AI and sensitive endpoints rate-limited per user
- **CORS Hardening** — Shared module restricting to production + preview origins

### 🌐 Responsive Design
Mobile-first layout with collapsible sidebar, mobile header, and responsive components across all pages.

### 🎨 Theme
Cyberpunk-inspired dark theme with neon cyan and purple accents. Supports dark, light, and system theme modes via ThemeProvider.

### ♿ Accessibility
- Semantic HTML throughout
- Skip links for keyboard users
- ARIA labels on interactive elements
- Proper heading hierarchy

### 📧 Email System
- Custom branded auth email templates (signup, recovery, invite, magic-link)
- Transactional email system with queue processing
- Email send log and rate limiting
- Suppressed email tracking
- Unsubscribe token management

### 🚀 Performance
- Code-splitting via React.lazy for all pages
- Manual chunk splitting for heavy libraries
- 5-minute stale time on data queries
- Loading skeletons during data fetches

### 🔍 SEO
- react-helmet-async with PageMeta component
- Branded OG image for social sharing
- Semantic meta tags per page
- robots.txt configured
