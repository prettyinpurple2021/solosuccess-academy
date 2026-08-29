import { createFileRoute } from "@tanstack/react-router";
import VerifyCertificate from "@/pages/VerifyCertificate";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/verify/$verificationCode")({
  component: () => (
    <RouteErrorBoundary>
      <VerifyCertificate />
    </RouteErrorBoundary>
  ),
});
