import { createFileRoute } from "@tanstack/react-router";
import AdminMigration from "@/pages/admin/AdminMigration";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/migration")({
  component: () => (
    <RouteErrorBoundary>
      <AdminMigration />
    </RouteErrorBoundary>
  ),
});
