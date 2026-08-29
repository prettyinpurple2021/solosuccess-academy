import { createFileRoute } from "@tanstack/react-router";
import CourseProject from "@/pages/CourseProject";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/_purchase/courses/$courseId/project")({
  component: () => (
    <RouteErrorBoundary>
      <CourseProject />
    </RouteErrorBoundary>
  ),
});
