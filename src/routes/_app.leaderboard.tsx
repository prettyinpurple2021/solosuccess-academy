import { createFileRoute } from "@tanstack/react-router";
import Leaderboard from "@/pages/Leaderboard";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/leaderboard")({
  component: () => (
    <RouteErrorBoundary>
      <Leaderboard />
    </RouteErrorBoundary>
  ),
});
