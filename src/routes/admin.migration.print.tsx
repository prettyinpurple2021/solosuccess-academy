import { createFileRoute } from "@tanstack/react-router";
import AdminMigrationPrint from "@/pages/admin/AdminMigrationPrint";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/admin/migration/print")({
  component: () => (
    <RouteErrorBoundary>
      <AdminMigrationPrint />
    </RouteErrorBoundary>
  ),
});
