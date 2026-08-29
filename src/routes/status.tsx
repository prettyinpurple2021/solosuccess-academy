import { createFileRoute } from "@tanstack/react-router";
import Status from "@/pages/Status";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/status")({
  component: () => (
    <RouteErrorBoundary>
      <Status />
    </RouteErrorBoundary>
  ),
});
