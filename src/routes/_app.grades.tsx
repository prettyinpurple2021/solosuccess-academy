import { createFileRoute } from "@tanstack/react-router";
import StudentGrades from "@/pages/StudentGrades";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/grades")({
  component: () => (
    <RouteErrorBoundary>
      <StudentGrades />
    </RouteErrorBoundary>
  ),
});
