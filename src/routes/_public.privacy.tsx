import { createFileRoute } from "@tanstack/react-router";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/privacy")({
  component: () => (
    <RouteErrorBoundary>
      <PrivacyPolicy />
    </RouteErrorBoundary>
  ),
});
