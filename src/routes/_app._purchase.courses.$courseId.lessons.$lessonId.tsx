import { createFileRoute } from "@tanstack/react-router";
import LessonViewer from "@/pages/LessonViewer";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/_purchase/courses/$courseId/lessons/$lessonId")({
  component: () => (
    <RouteErrorBoundary>
      <LessonViewer />
    </RouteErrorBoundary>
  ),
});
