import { createFileRoute } from "@tanstack/react-router";
import CourseDetail from "@/pages/CourseDetail";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/courses/$courseId")({
  component: () => (
    <RouteErrorBoundary>
      <CourseDetail />
    </RouteErrorBoundary>
  ),
});
