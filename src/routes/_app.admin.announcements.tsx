import { createFileRoute } from "@tanstack/react-router";
import AdminAnnouncements from "@/pages/AdminAnnouncements";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/announcements")({
  component: () => (
    <RouteErrorBoundary>
      <AdminAnnouncements />
    </RouteErrorBoundary>
  ),
});
