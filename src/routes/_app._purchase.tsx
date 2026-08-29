import { createFileRoute } from "@tanstack/react-router";
import { PurchaseGuard } from "@/components/layout/PurchaseGuard";

export const Route = createFileRoute("/_app/_purchase")({
  component: () => <PurchaseGuard />,
});
