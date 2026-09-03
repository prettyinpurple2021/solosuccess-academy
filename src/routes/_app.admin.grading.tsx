import { createFileRoute } from "@tanstack/react-router";
import AdminGrading from "@/pages/admin/AdminGrading";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/grading")({
  component: () => (
    <RouteErrorBoundary>
      <AdminGrading />
    </RouteErrorBoundary>
  ),
});
