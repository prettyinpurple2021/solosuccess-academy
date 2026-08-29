import { createFileRoute } from "@tanstack/react-router";
import HelpCenter from "@/pages/HelpCenter";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/help")({
  component: () => (
    <RouteErrorBoundary>
      <HelpCenter />
    </RouteErrorBoundary>
  ),
});
