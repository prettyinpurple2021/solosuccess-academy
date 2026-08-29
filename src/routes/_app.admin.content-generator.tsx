import { createFileRoute } from "@tanstack/react-router";
import ContentGenerator from "@/pages/ContentGenerator";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/admin/content-generator")({
  component: () => (
    <RouteErrorBoundary>
      <ContentGenerator />
    </RouteErrorBoundary>
  ),
});
