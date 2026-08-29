import { createFileRoute } from "@tanstack/react-router";
import AdminPlatformSettings from "@/pages/admin/AdminPlatformSettings";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/platform-settings")({
  component: () => (
    <RouteErrorBoundary>
      <AdminPlatformSettings />
    </RouteErrorBoundary>
  ),
});
