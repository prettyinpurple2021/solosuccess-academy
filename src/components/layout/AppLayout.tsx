/**
 * @file AppLayout.tsx — Authenticated Application Shell
 * 
 * This layout wraps ALL protected (logged-in) routes. It provides:
 * 1. Authentication gate — redirects to /auth if not logged in
 * 2. Sidebar navigation (collapsible, using shadcn SidebarProvider)
 * 3. Mobile-responsive header with hamburger menu trigger
 * 4. Cyberpunk-themed background (cyber-bg + cyber-grid)
 * 
 * ROUTE STRUCTURE:
 * AppLayout wraps:
 *   /dashboard, /profile, /settings, /admin/*, /courses/:id/lessons/*, etc.
 * 
 * HOW AUTH GATE WORKS:
 * - While checking auth status → shows loading spinner
 * - If not authenticated → redirects to /auth with `state.from` so the user
 *   returns to their original destination after login
 * - If authenticated → renders sidebar + main content area
 * 
 * PRODUCTION TODO:
 * - Add a <Footer> component inside the layout if needed
 * - Consider adding a top notification banner slot
 * - Add breadcrumb navigation for deeply nested routes
 */
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { NotepadWidget } from '@/components/notepad/NotepadWidget';
import { NebulaBackground } from '@/components/landing/NebulaBackground';
import { StarField } from '@/components/landing/StarField';
import { PendingDeletionBanner } from '@/components/settings/PendingDeletionBanner';
import { MobileBottomNav } from './MobileBottomNav';

export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // ── Loading state: Show spinner while checking auth ──
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center cyber-bg">
        <div className="cyber-grid absolute inset-0" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <NeonSpinner size="lg" />
          <p className="text-sm text-muted-foreground font-mono">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Auth gate: Redirect unauthenticated users to login ──
  // `state.from` allows redirecting back after successful login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // ── Authenticated layout: Sidebar + main content ──
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full cyber-bg">
        {/* Background grid overlay (purely decorative) */}
        <div className="cyber-grid fixed inset-0 pointer-events-none" />

        {/* Nebula ambient clouds + star field */}
        <NebulaBackground />
        <StarField count={20} />
        
        {/* Sidebar navigation — desktop only (hidden on mobile via Tailwind) */}
        <div className="hidden md:flex">
          <AppSidebar />
        </div>
        
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Sitewide banner shown only if user has scheduled account deletion */}
          <PendingDeletionBanner />

          {/* Main content area — <Outlet /> renders the matched child route */}
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 relative z-10 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0"
          >
            <Outlet />
          </main>
        </div>

        {/* Mobile-only persistent bottom tab bar */}
        <MobileBottomNav />

        {/* Floating notepad widget — available on all authenticated pages */}
        <NotepadWidget courseId={null} />
      </div>
    </SidebarProvider>
  );
}
