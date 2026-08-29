import { createFileRoute } from "@tanstack/react-router";
import Courses from "@/pages/Courses";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/courses/")({
  component: () => (
    <RouteErrorBoundary>
      <Courses />
    </RouteErrorBoundary>
  ),
});
