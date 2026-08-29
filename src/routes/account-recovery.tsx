import { createFileRoute } from "@tanstack/react-router";
import AccountRecovery from "@/pages/AccountRecovery";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/account-recovery")({
  component: () => (
    <RouteErrorBoundary>
      <AccountRecovery />
    </RouteErrorBoundary>
  ),
});
