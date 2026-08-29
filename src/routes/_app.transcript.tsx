import { createFileRoute } from "@tanstack/react-router";
import TranscriptPage from "@/pages/Transcript";
import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export const Route = createFileRoute("/_app/transcript")({
  component: () => (
    <RouteErrorBoundary>
      <TranscriptPage />
    </RouteErrorBoundary>
  ),
});
