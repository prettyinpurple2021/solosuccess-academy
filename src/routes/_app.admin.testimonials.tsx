import { createFileRoute } from "@tanstack/react-router";
import AdminTestimonials from "@/pages/AdminTestimonials";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/testimonials")({
  component: () => (
    <RouteErrorBoundary>
      <AdminTestimonials />
    </RouteErrorBoundary>
  ),
});
