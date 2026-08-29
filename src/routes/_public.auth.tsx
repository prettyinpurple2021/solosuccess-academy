import { createFileRoute } from "@tanstack/react-router";
import Auth from "@/pages/Auth";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/auth")({
  component: () => (
    <RouteErrorBoundary>
      <Auth />
    </RouteErrorBoundary>
  ),
});
