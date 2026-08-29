import { createFileRoute } from "@tanstack/react-router";
import VerifyLanding from "@/pages/VerifyLanding";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/verify/")({
  component: () => (
    <RouteErrorBoundary>
      <VerifyLanding />
    </RouteErrorBoundary>
  ),
});
