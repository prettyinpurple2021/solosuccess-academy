import { createFileRoute } from "@tanstack/react-router";
import Billing from "@/pages/Billing";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/billing")({
  component: () => (
    <RouteErrorBoundary>
      <Billing />
    </RouteErrorBoundary>
  ),
});
