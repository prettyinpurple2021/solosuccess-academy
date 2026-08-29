import { createFileRoute } from "@tanstack/react-router";
import Textbook from "@/pages/Textbook";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/_purchase/courses/$courseId/textbook")({
  component: () => (
    <RouteErrorBoundary>
      <Textbook />
    </RouteErrorBoundary>
  ),
});
