import { createFileRoute } from "@tanstack/react-router";
import Profile from "@/pages/Profile";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/profile")({
  component: () => (
    <RouteErrorBoundary>
      <Profile />
    </RouteErrorBoundary>
  ),
});
