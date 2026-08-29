import { createFileRoute } from "@tanstack/react-router";
import AboutPage from "@/pages/About";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/about")({
  component: () => (
    <RouteErrorBoundary>
      <AboutPage />
    </RouteErrorBoundary>
  ),
});
