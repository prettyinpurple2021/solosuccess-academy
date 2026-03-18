

## Comprehensive Project Review & Enhancement Plan

### Summary of Findings

After reviewing every page, component, hook, and edge function, the project is impressively complete. Here's what's working and what needs attention:

---

### What's Fully Functional (No Changes Needed)
- **Routing & Auth**: Dual-layout system, protected routes, admin RBAC, purchase guards
- **Admin Dashboard**: Course CRUD, publish/unpublish, bulk generators (lessons, textbooks, supplemental, assessments), enricher, quick generate, asset uploads
- **Admin Gradebook**: Full student table with quiz/activity/worksheet/exam/essay scores, grade overrides, PDF reports, weight management
- **Admin Analytics**: Revenue charts, engagement metrics, course completions
- **Admin Exam/Essay Generator**: Bulk generation, individual generators, progress tracking
- **Student Lesson Viewer**: All 6 lesson types (text, video, quiz, activity, worksheet, assignment), AI tutor, keyboard nav, reading progress, continue-later, certificate generation on completion
- **Student Course Detail**: Purchase flow, lesson list, sidebar cards for exam/essay/textbook/project/discussion/asset
- **Student Dashboard**: Stats, continue learning, course list, roadmap
- **Final Exam & Essay**: Full interactive players with grading and results
- **Textbook Viewer**: Page-turning, highlights, bookmarks, flashcards, mini-games, TTS, comments
- **Gamification**: XP, streaks, badges, leaderboard
- **Profile, Settings, Certificates, Notifications, Help, Contact, About, Legal pages** — all functional

---

### Issues Found & Enhancements Needed

#### 1. Transcript Grade Calculation is Broken (Critical)
**File**: `src/pages/Transcript.tsx` (lines 52-58)
The transcript currently uses a **dummy grade** based purely on lesson completion percentage. The comment even says `"We don't have lesson data here easily"` and the filter always returns `false`. It should use the same `calculateCombinedGrade` function from `useGradebook.ts` that the admin gradebook uses, pulling actual quiz, activity, worksheet, exam, and essay scores.

**Fix**: Fetch lessons for each course, join with `user_progress` to get quiz/activity/worksheet scores, fetch exam attempts and essay submissions, then call `calculateCombinedGrade` for accurate letter grades and GPA.

#### 2. Student-Facing Grades Page Missing
Students can see their transcript with grades, but there's no dedicated **"My Grades"** page that gives them a detailed breakdown like the admin gradebook shows. Students should be able to see:
- Per-course breakdown of quiz, activity, worksheet, exam, and essay scores
- Combined grade with weight breakdown
- What components are still missing/incomplete

**Fix**: Create a new `src/pages/StudentGrades.tsx` page accessible via sidebar, showing the student's own detailed grade breakdown per course.

#### 3. Sidebar Missing "Notifications" Link
The `AppSidebar.tsx` nav items don't include a link to `/notifications` — students can only access notifications via the bell icon (if implemented in the header). Adding it to the sidebar improves discoverability.

#### 4. Admin Sidebar Missing Analytics & Content Generator Links
The admin sidebar section only shows: Admin Panel, Gradebook, Exams & Essays, AI Settings. Missing quick links to:
- **Analytics** (`/admin/analytics`)
- **Content Generator** (`/admin/content-generator`)

These are accessible from the admin dashboard cards but not from the sidebar directly.

#### 5. Course Detail Lesson Type Icons Incomplete
`CourseDetail.tsx` (lines 369-374) only shows icons for `video` and `quiz` lesson types. Activity, worksheet, and assignment type badges should also be shown so students can scan what type of lesson each is before entering.

#### 6. Dashboard "Your Roadmap" Not Showing Lesson Types
The dashboard roadmap section (right sidebar) shows all 10 courses but doesn't indicate how many of each lesson type exists per course. Adding small type counts (e.g., "3 quizzes, 2 activities") would help students understand what to expect.

---

### Implementation Plan

**Task 1: Fix Transcript Grade Calculation**
- Fetch `lessons` table to map lesson_id → course_id
- Fetch quiz/activity/worksheet scores from `user_progress` for the current user
- Fetch exam attempts from `student_exam_attempts`
- Fetch essay submissions from `student_essay_submissions`
- Use `calculateCombinedGrade` with grade settings for accurate grades
- Update GPA calculation to use real weighted grades

**Task 2: Create Student Grades Page**
- New page at `/grades` showing per-course detailed grade breakdowns
- Columns: Quiz avg, Activity avg, Worksheet avg, Exam score, Essay score, Combined
- Reuse grade calculation logic from `useGradebook.ts`
- Add route to `App.tsx` and sidebar link to `AppSidebar.tsx`

**Task 3: Enhance Sidebar Navigation**
- Add "Notifications" with Bell icon to student nav items
- Add "Analytics" and "Content Generator" to admin sidebar section

**Task 4: Add Lesson Type Icons to Course Detail**
- Show activity, worksheet, and assignment icons alongside video/quiz on the lesson list in `CourseDetail.tsx`

**Task 5: Minor UX Polish**
- Add lesson type counts to dashboard roadmap cards
- Ensure all "coming soon" placeholders have consistent styling

---

### Technical Details

**Transcript fix** requires a new custom hook (e.g., `useStudentGrades`) that fetches:
```text
1. lessons → SELECT id, course_id, type FROM lessons WHERE course_id IN (purchased courses)
2. user_progress → existing query already available
3. student_exam_attempts → JOIN with course_final_exams for course mapping
4. student_essay_submissions → JOIN with course_essays for course mapping
5. grade_settings → already available via useGradeSettings
```
This hook aggregates data into the same shape expected by `calculateCombinedGrade`.

**Student Grades page** reuses `calculateCombinedGrade` and `getWeightsForCourse` from existing hooks, keeping all grade logic centralized.

**No database changes needed** — all required tables and data exist.

