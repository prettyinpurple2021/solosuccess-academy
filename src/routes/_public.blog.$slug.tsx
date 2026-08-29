import { createFileRoute } from "@tanstack/react-router";
import BlogPost from "@/pages/BlogPost";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/blog/$slug")({
  component: () => (
    <RouteErrorBoundary>
      <BlogPost />
    </RouteErrorBoundary>
  ),
});
