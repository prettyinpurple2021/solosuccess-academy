import { createFileRoute } from "@tanstack/react-router";
import Certificates from "@/pages/Certificates";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/certificates")({
  component: () => (
    <RouteErrorBoundary>
      <Certificates />
    </RouteErrorBoundary>
  ),
});
