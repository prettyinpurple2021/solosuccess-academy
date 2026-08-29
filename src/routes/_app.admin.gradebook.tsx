import { createFileRoute } from "@tanstack/react-router";
import Gradebook from "@/pages/Gradebook";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/gradebook")({
  component: () => (
    <RouteErrorBoundary>
      <Gradebook />
    </RouteErrorBoundary>
  ),
});
