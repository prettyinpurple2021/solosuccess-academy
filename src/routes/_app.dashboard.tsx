import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/dashboard")({
  component: () => (
    <RouteErrorBoundary>
      <Dashboard />
    </RouteErrorBoundary>
  ),
});
