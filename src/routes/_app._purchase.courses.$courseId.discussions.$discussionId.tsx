import { createFileRoute } from "@tanstack/react-router";
import DiscussionDetail from "@/pages/DiscussionDetail";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/_purchase/courses/$courseId/discussions/$discussionId")({
  component: () => (
    <RouteErrorBoundary>
      <DiscussionDetail />
    </RouteErrorBoundary>
  ),
});
