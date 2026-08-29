import { createFileRoute } from "@tanstack/react-router";
import FinalEssay from "@/pages/FinalEssay";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/_purchase/courses/$courseId/final-essay")({
  component: () => (
    <RouteErrorBoundary>
      <FinalEssay />
    </RouteErrorBoundary>
  ),
});
