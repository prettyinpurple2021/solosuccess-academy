import { createFileRoute } from "@tanstack/react-router";
import OAuthConsent from "@/pages/OAuthConsent";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  component: () => (
    <RouteErrorBoundary>
      <OAuthConsent />
    </RouteErrorBoundary>
  ),
});
