import { createFileRoute } from "@tanstack/react-router";
import Blog from "@/pages/Blog";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/blog/")({
  component: () => (
    <RouteErrorBoundary>
      <Blog />
    </RouteErrorBoundary>
  ),
});
