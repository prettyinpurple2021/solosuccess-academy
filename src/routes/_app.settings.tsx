import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/pages/Settings";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/settings")({
  component: () => (
    <RouteErrorBoundary>
      <Settings />
    </RouteErrorBoundary>
  ),
});
