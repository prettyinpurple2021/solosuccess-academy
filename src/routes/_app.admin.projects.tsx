import { createFileRoute } from "@tanstack/react-router";
import AdminProjects from "@/pages/admin/AdminProjects";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/projects")({
  component: () => (
    <RouteErrorBoundary>
      <AdminProjects />
    </RouteErrorBoundary>
  ),
});
