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
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotepadWidget } from '@/components/notepad/NotepadWidget';
import { NebulaBackground } from '@/components/landing/NebulaBackground';
import { StarField } from '@/components/landing/StarField';
import { PendingDeletionBanner } from '@/components/settings/PendingDeletionBanner';

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
        
        {/* Sidebar navigation — see AppSidebar.tsx for menu items */}
        <AppSidebar />
        
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Mobile-only top bar — matches cyberpunk header-glass */}
          <header className="sticky top-0 z-[80] h-14 mobile-header-glass flex items-center px-4 md:hidden">
            <SidebarTrigger />
          </header>
          
          {/* Sitewide banner shown only if user has scheduled account deletion */}
          <PendingDeletionBanner />

          {/* Main content area — <Outlet /> renders the matched child route */}
          <main id="main-content" tabIndex={-1} className="flex-1 relative z-10">
            <Outlet />
          </main>
        </div>

        {/* Floating notepad widget — available on all authenticated pages */}
        <NotepadWidget courseId={null} />
      </div>
    </SidebarProvider>
  );
}
