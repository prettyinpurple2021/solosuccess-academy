/**
 * @file AdminLayout.tsx — Admin-Only Route Guard
 * 
 * Wraps all /admin/* routes. Provides two levels of protection:
 * 1. Authentication check (handled by parent AppLayout)
 * 2. Admin role check (handled here via useIsAdmin hook)
 * 
 * HOW ADMIN ROLES WORK:
 * - The `user_roles` table stores role assignments (user_id + role)
 * - The `useIsAdmin` hook queries this table for role='admin'
 * - Non-admin users are redirected to /dashboard
 * 
 * SECURITY NOTE:
 * This is a client-side guard only. The real security is in the database:
 * - RLS policies on admin tables check for admin role
 * - Edge Functions verify admin status server-side
 * Never rely solely on client-side route guards for security.
 * 
 * PRODUCTION TODO:
 * - Add an "Unauthorized" page instead of silent redirect to dashboard
 * - Consider caching the admin check to avoid re-querying on every navigation
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { NeonSpinner } from "@/components/ui/neon-spinner";
import { lazy, Suspense } from "react";

// Lazy-load the Unauthorized page so it's not bundled for admin users
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));

export function AdminLayout() {
  const { user, isLoading: authLoading } = useAuth();
  // Admin check is cached with staleTime to avoid re-querying on every navigation
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(user?.id);

  // Show loading while checking auth + admin status
  if (authLoading || adminLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show Unauthorized page for non-admin users (instead of silent redirect)
  if (!isAdmin) {
    return (
      <Suspense fallback={<div className="flex flex-1 items-center justify-center py-12"><NeonSpinner size="lg" /></div>}>
        <Unauthorized />
      </Suspense>
    );
  }

  // Render admin child routes
  return <Outlet />;
}
