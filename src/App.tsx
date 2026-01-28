import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { GamificationProvider } from "@/components/gamification/GamificationProvider";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AppLayout } from "@/components/layout/AppLayout";

// Public Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";

// App Pages (Protected)
import Dashboard from "./pages/Dashboard";
import LessonViewer from "./pages/LessonViewer";
import CourseProject from "./pages/CourseProject";
import CourseDiscussions from "./pages/CourseDiscussions";
import DiscussionDetail from "./pages/DiscussionDetail";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import ContentGenerator from "./pages/ContentGenerator";
import Gradebook from "./pages/Gradebook";
import Textbook from "./pages/Textbook";
import NotFound from "./pages/NotFound";

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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <GamificationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes - Marketing/Landing Pages */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:courseId" element={<CourseDetail />} />
              </Route>

              {/* Protected App Routes - Require Authentication */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/content-generator" element={<ContentGenerator />} />
                <Route path="/admin/gradebook" element={<Gradebook />} />
                
                {/* Course learning routes (require purchase) */}
                <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonViewer />} />
                <Route path="/courses/:courseId/project" element={<CourseProject />} />
                <Route path="/courses/:courseId/discussions" element={<CourseDiscussions />} />
                <Route path="/courses/:courseId/discussions/:discussionId" element={<DiscussionDetail />} />
                <Route path="/courses/:courseId/textbook" element={<Textbook />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </GamificationProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
