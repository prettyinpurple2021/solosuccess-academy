import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/pages/AdminDashboard";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/")({
  component: () => (
    <RouteErrorBoundary>
      <AdminDashboard />
    </RouteErrorBoundary>
  ),
});
