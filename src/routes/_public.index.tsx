import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/")({
  component: () => (
    <RouteErrorBoundary>
      <Index />
    </RouteErrorBoundary>
  ),
});
