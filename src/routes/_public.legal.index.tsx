import { createFileRoute } from "@tanstack/react-router";
import Legal from "@/pages/Legal";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/legal/")({
  component: () => (
    <RouteErrorBoundary>
      <Legal />
    </RouteErrorBoundary>
  ),
});
