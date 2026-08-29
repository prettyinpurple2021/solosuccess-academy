import { createFileRoute } from "@tanstack/react-router";
import AdminLessonDetail from "@/pages/AdminLessonDetail";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/courses/$courseId/lessons/$lessonId")({
  component: () => (
    <RouteErrorBoundary>
      <AdminLessonDetail />
    </RouteErrorBoundary>
  ),
});
