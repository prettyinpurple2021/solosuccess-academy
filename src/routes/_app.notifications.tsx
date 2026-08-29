import { createFileRoute } from "@tanstack/react-router";
import NotificationsPage from "@/pages/Notifications";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/notifications")({
  component: () => (
    <RouteErrorBoundary>
      <NotificationsPage />
    </RouteErrorBoundary>
  ),
});
