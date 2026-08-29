import { createFileRoute } from "@tanstack/react-router";
import AdminAnalytics from "@/pages/AdminAnalytics";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/analytics")({
  component: () => (
    <RouteErrorBoundary>
      <AdminAnalytics />
    </RouteErrorBoundary>
  ),
});
