import { createFileRoute } from "@tanstack/react-router";
import FinalExam from "@/pages/FinalExam";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/_purchase/courses/$courseId/final-exam")({
  component: () => (
    <RouteErrorBoundary>
      <FinalExam />
    </RouteErrorBoundary>
  ),
});
