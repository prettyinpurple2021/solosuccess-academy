import { createFileRoute } from "@tanstack/react-router";
import RefundPolicy from "@/pages/RefundPolicy";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/refund")({
  component: () => (
    <RouteErrorBoundary>
      <RefundPolicy />
    </RouteErrorBoundary>
  ),
});
