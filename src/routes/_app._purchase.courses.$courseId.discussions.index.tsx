import { createFileRoute } from "@tanstack/react-router";
import CourseDiscussions from "@/pages/CourseDiscussions";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/_purchase/courses/$courseId/discussions/")({
  component: () => (
    <RouteErrorBoundary>
      <CourseDiscussions />
    </RouteErrorBoundary>
  ),
});
