import { createFileRoute } from "@tanstack/react-router";
import AdminWebhookHealth from "@/pages/AdminWebhookHealth";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/webhook-health")({
  component: () => (
    <RouteErrorBoundary>
      <AdminWebhookHealth />
    </RouteErrorBoundary>
  ),
});
