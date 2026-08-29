import { createFileRoute } from "@tanstack/react-router";
import AdminBlogAutoPost from "@/pages/admin/AdminBlogAutoPost";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/blog-auto-post")({
  component: () => (
    <RouteErrorBoundary>
      <AdminBlogAutoPost />
    </RouteErrorBoundary>
  ),
});
