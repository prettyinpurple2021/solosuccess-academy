import { type ReactNode } from "react";
import { LoadingView } from "@/components/ui/loading-view";
import { ErrorView } from "@/components/ui/error-view";

interface QueryStateGuardProps {
  /** From useQuery: isLoading */
  isLoading: boolean;
  /** From useQuery: isError */
  isError: boolean;
  /** From useQuery: error (for message) */
  error: Error | null;
  /** From useQuery: refetch (for "Try again"). Optional. */
  refetch?: () => void;
  /** Content to render when data is ready. */
  children: ReactNode;
  /** Use full-page layout for loading/error. Default true. */
  fullPage?: boolean;
  /** Shown under spinner when loading. */
  loadingMessage?: string;
  /** "Go back" link path. Default "/". */
  backTo?: string;
  /** Label for back link. Default "Go home". */
  backLabel?: string;
}

/**
 * Wraps content that depends on a single query. Shows loading or error UI
 * when appropriate; otherwise renders children.
 * Use for pages that have one primary data source (e.g. courses list, course detail).
 */
export function QueryStateGuard({
  isLoading,
  isError,
  error,
  refetch,
  children,
  fullPage = true,
  loadingMessage = "Loading...",
  backTo = "/",
  backLabel = "Go home",
}: QueryStateGuardProps) {
  if (isLoading) {
    return (
      <LoadingView
        fullPage={fullPage}
        message={loadingMessage}
      />
    );
  }

  if (isError) {
    return (
      <ErrorView
        message={error?.message}
        onRetry={refetch}
        backTo={backTo}
        backLabel={backLabel}
        fullPage={fullPage}
      />
    );
  }

  return <>{children}</>;
}
