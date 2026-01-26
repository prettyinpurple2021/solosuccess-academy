import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

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

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full cyber-bg">
        <div className="cyber-grid fixed inset-0 pointer-events-none" />
        
        <AppSidebar />
        
        <div className="flex-1 flex flex-col relative">
          {/* Top bar with mobile menu trigger */}
          <header className="sticky top-0 z-40 h-14 border-b border-primary/20 bg-background/80 backdrop-blur-xl flex items-center px-4 md:hidden">
            <SidebarTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
          </header>
          
          <main className="flex-1 relative z-10">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
