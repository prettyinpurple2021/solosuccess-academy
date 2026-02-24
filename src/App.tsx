/**
 * @file App.tsx — Root Application Component & Router Configuration
 * 
 * This is the "brain" of the app. It sets up:
 * 1. Global providers (data fetching, theming, tooltips, gamification, SEO)
 * 2. All route definitions (which URL shows which page)
 * 3. Code-splitting via React.lazy() for performance
 * 
 * ARCHITECTURE OVERVIEW:
 * ┌─────────────────────────────────────────────┐
 * │  QueryClientProvider (data fetching cache)   │
 * │  ├── ErrorBoundary (catches crashes)         │
 * │  │   ├── HelmetProvider (SEO meta tags)      │
 * │  │   │   ├── ThemeProvider (dark/light mode)  │
 * │  │   │   │   ├── GamificationProvider (XP)    │
 * │  │   │   │   │   ├── BrowserRouter (routing)  │
 * │  │   │   │   │   │   └── Routes (pages)       │
 * └─────────────────────────────────────────────┘
 * 
 * ROUTE GROUPS:
 * - Public routes: Landing page, auth, course catalog (no login needed)
 * - Protected routes: Dashboard, profile, lessons (login required)
 * - Admin routes: Course management, analytics (admin role required)
 * 
 * PRODUCTION TODO:
 * - Add route-level error boundaries for graceful per-page error handling
 * - Consider adding analytics tracking on route changes
 * - Add proper 301 redirects for any renamed routes
 */
import { Toaster } from "@/components/ui/toaster";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { GamificationProvider } from "@/components/gamification/GamificationProvider";
import { NeonSpinner } from "@/components/ui/neon-spinner";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { SkipLink } from "@/components/layout/SkipLink";

// ──────────────────────────────────────────────
// LAYOUT SHELLS — Loaded eagerly because they're
// needed immediately to render the page frame.
// ──────────────────────────────────────────────
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// ──────────────────────────────────────────────
// LAZY-LOADED PAGES — Each page is loaded on-demand
// when the user navigates to it. This keeps the
// initial JavaScript bundle small (~50-100KB instead
// of 500KB+), making the first page load much faster.
//
// HOW IT WORKS:
// React.lazy(() => import("./pages/Foo")) creates a
// "split point." Vite generates a separate .js file
// for each lazy import, downloaded only when needed.
// ──────────────────────────────────────────────
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LessonViewer = lazy(() => import("./pages/LessonViewer"));
const CourseProject = lazy(() => import("./pages/CourseProject"));
const CourseDiscussions = lazy(() => import("./pages/CourseDiscussions"));
const DiscussionDetail = lazy(() => import("./pages/DiscussionDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminLessonDetail = lazy(() => import("./pages/AdminLessonDetail"));
const ContentGenerator = lazy(() => import("./pages/ContentGenerator"));
const AISettings = lazy(() => import("./pages/AISettings"));
const Gradebook = lazy(() => import("./pages/Gradebook"));
const AdminExamEssay = lazy(() => import("./pages/AdminExamEssay"));
const Textbook = lazy(() => import("./pages/Textbook"));
const Certificates = lazy(() => import("./pages/Certificates"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const FinalExam = lazy(() => import("./pages/FinalExam"));
const NotFound = lazy(() => import("./pages/NotFound"));

/**
 * TanStack Query client — manages all server-state (API data) caching.
 * 
 * - staleTime: 5 minutes — data won't refetch for 5 min after a successful load.
 *   This reduces unnecessary API calls while keeping data reasonably fresh.
 * - retry: 1 — only retry failed requests once (default is 3, which can be slow).
 * 
 * PRODUCTION TODO:
 * - Consider adding a global `onError` handler to log query failures
 * - Adjust staleTime per-query if some data needs to be more real-time
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

/**
 * Root App component — wraps everything in providers and defines routes.
 * 
 * PROVIDER ORDER MATTERS:
 * 1. QueryClientProvider must be outermost (other hooks depend on it)
 * 2. ErrorBoundary catches rendering errors in the tree below it
 * 3. HelmetProvider enables <Helmet> for SEO in any child component
 * 4. ThemeProvider enables dark/light mode toggling
 * 5. GamificationProvider tracks XP and streak state globally
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <GamificationProvider>
            {/* Two toast systems: Toaster = shadcn toasts, Sonner = sonner toasts */}
            <Toaster />
            <Sonner />
            <BrowserRouter>
            {/* SkipLink: Accessibility — lets keyboard users skip nav to main content */}
            <SkipLink />
            {/* Suspense: Shows loading spinner while lazy pages download */}
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center cyber-bg">
                  <div className="cyber-grid absolute inset-0" />
                  <div className="flex flex-col items-center gap-4 relative z-10">
                    <NeonSpinner size="lg" />
                    <p className="text-sm text-muted-foreground font-mono">Loading...</p>
                  </div>
                </div>
              }
            >
              <Routes>
                {/* ═══════════════════════════════════════════
                    PUBLIC ROUTES — No authentication required.
                    Wrapped in PublicLayout (header + footer).
                    ═══════════════════════════════════════════ */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:courseId" element={<CourseDetail />} />
              </Route>

              {/* Public Certificate Verification — standalone page, no layout */}
              <Route path="/verify/:verificationCode" element={<VerifyCertificate />} />

              {/* Password Reset — public standalone page, user arrives via email link */}
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* ═══════════════════════════════════════════
                  PROTECTED ROUTES — Require authentication.
                  AppLayout checks auth and redirects to /auth
                  if user is not logged in. Includes sidebar.
                  ═══════════════════════════════════════════ */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />

                {/* ─── ADMIN ROUTES ───────────────────────
                    AdminLayout checks for admin role.
                    Non-admins are redirected to /dashboard.
                    ──────────────────────────────────────── */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="courses/:courseId/lessons/:lessonId" element={<AdminLessonDetail />} />
                  <Route path="content-generator" element={<ContentGenerator />} />
                  <Route path="ai-settings" element={<AISettings />} />
                  <Route path="gradebook" element={<Gradebook />} />
                  <Route path="exam-essay" element={<AdminExamEssay />} />
                </Route>
                
                {/* ─── STUDENT LEARNING ROUTES ────────────
                    These require purchase verification
                    (handled at the page level, not route level).
                    
                    PRODUCTION TODO: Consider adding a PurchaseGuard
                    layout component to handle access control at the
                    route level instead of duplicating in each page.
                    ──────────────────────────────────────── */}
                <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonViewer />} />
                <Route path="/courses/:courseId/project" element={<CourseProject />} />
                <Route path="/courses/:courseId/discussions" element={<CourseDiscussions />} />
                <Route path="/courses/:courseId/discussions/:discussionId" element={<DiscussionDetail />} />
                <Route path="/courses/:courseId/textbook" element={<Textbook />} />
                <Route path="/courses/:courseId/final-exam" element={<FinalExam />} />
                <Route path="/certificates" element={<Certificates />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Route>

                {/* 404 catch-all — shows friendly "not found" page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </GamificationProvider>
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
