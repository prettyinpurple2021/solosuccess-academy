import { createFileRoute } from "@tanstack/react-router";
import LegalDocument from "@/pages/LegalDocument";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/legal/$slug")({
  component: () => (
    <RouteErrorBoundary>
      <LegalDocument />
    </RouteErrorBoundary>
  ),
});
