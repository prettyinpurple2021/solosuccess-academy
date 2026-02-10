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

// Layouts (eager - needed for initial shell)
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Lazy-loaded pages (split by route for smaller initial bundle)
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
const Textbook = lazy(() => import("./pages/Textbook"));
const Certificates = lazy(() => import("./pages/Certificates"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <GamificationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <SkipLink />
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
                {/* Public Routes - Marketing/Landing Pages */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:courseId" element={<CourseDetail />} />
              </Route>

              {/* Public Certificate Verification */}
              <Route path="/verify/:verificationCode" element={<VerifyCertificate />} />

              {/* Protected App Routes - Require Authentication */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="courses/:courseId/lessons/:lessonId" element={<AdminLessonDetail />} />
                  <Route path="content-generator" element={<ContentGenerator />} />
                  <Route path="ai-settings" element={<AISettings />} />
                  <Route path="gradebook" element={<Gradebook />} />
                </Route>
                
                {/* Course learning routes (require purchase) */}
                <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonViewer />} />
                <Route path="/courses/:courseId/project" element={<CourseProject />} />
                <Route path="/courses/:courseId/discussions" element={<CourseDiscussions />} />
                <Route path="/courses/:courseId/discussions/:discussionId" element={<DiscussionDetail />} />
                <Route path="/courses/:courseId/textbook" element={<Textbook />} />
                <Route path="/certificates" element={<Certificates />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Route>

                {/* Catch-all */}
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
