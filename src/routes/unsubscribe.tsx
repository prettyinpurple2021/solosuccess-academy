import { createFileRoute } from "@tanstack/react-router";
import Unsubscribe from "@/pages/Unsubscribe";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/unsubscribe")({
  component: () => (
    <RouteErrorBoundary>
      <Unsubscribe />
    </RouteErrorBoundary>
  ),
});
