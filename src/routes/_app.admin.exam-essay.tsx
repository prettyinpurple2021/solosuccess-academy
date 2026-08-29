import { createFileRoute } from "@tanstack/react-router";
import AdminExamEssay from "@/pages/AdminExamEssay";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/exam-essay")({
  component: () => (
    <RouteErrorBoundary>
      <AdminExamEssay />
    </RouteErrorBoundary>
  ),
});
