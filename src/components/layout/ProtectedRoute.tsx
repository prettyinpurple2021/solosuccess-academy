/**
 * @file ProtectedRoute.tsx — Generic Auth Guard Component
 * 
 * A reusable wrapper that ensures only authenticated users can
 * see the wrapped content. If not logged in, redirects to /auth.
 * 
 * NOTE: In the current app, AppLayout already handles auth guarding
 * for all protected routes. This component exists as a utility for
 * cases where you need to protect individual components or pages
 * outside of the AppLayout structure.
 * 
 * USAGE:
 * ```tsx
 * <ProtectedRoute>
 *   <SensitivePage />
 * </ProtectedRoute>
 * ```
 * 
 * HOW IT WORKS:
 * 1. While auth is loading → show a full-screen spinner
 * 2. If not authenticated → redirect to /auth with return URL
 * 3. If authenticated → render children
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { NeonSpinner } from '@/components/ui/neon-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner during initial auth check
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center cyber-bg">
        <div className="cyber-grid absolute inset-0" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <NeonSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated — render the protected content
  return <>{children}</>;
}
