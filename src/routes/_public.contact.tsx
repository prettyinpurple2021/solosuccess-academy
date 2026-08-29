import { createFileRoute } from "@tanstack/react-router";
import ContactPage from "@/pages/Contact";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_public/contact")({
  component: () => (
    <RouteErrorBoundary>
      <ContactPage />
    </RouteErrorBoundary>
  ),
});
