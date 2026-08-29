import { createFileRoute } from "@tanstack/react-router";
import TermsOfService from "@/pages/TermsOfService";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/terms")({
  component: () => (
    <RouteErrorBoundary>
      <TermsOfService />
    </RouteErrorBoundary>
  ),
});
