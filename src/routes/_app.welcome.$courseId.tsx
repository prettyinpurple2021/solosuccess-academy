import { createFileRoute } from "@tanstack/react-router";
import Welcome from "@/pages/Welcome";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/welcome/$courseId")({
  component: () => (
    <RouteErrorBoundary>
      <Welcome />
    </RouteErrorBoundary>
  ),
});
