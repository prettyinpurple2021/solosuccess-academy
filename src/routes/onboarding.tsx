import { createFileRoute } from "@tanstack/react-router";
import Onboarding from "@/pages/Onboarding";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/onboarding")({
  component: () => (
    <RouteErrorBoundary>
      <Onboarding />
    </RouteErrorBoundary>
  ),
});
