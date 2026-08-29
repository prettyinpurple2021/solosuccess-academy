import { createFileRoute } from "@tanstack/react-router";
import AISettings from "@/pages/AISettings";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/ai-settings")({
  component: () => (
    <RouteErrorBoundary>
      <AISettings />
    </RouteErrorBoundary>
  ),
});
