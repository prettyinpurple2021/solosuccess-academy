import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/ResetPassword";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/reset-password")({
  component: () => (
    <RouteErrorBoundary>
      <ResetPassword />
    </RouteErrorBoundary>
  ),
});
