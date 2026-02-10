import { NeonSpinner } from "@/components/ui/neon-spinner";
import { cn } from "@/lib/utils";

interface LoadingViewProps {
  /** Use full viewport height (e.g. for full-page loading). Default true. */
  fullPage?: boolean;
  /** Short message below the spinner. */
  message?: string;
  className?: string;
}

/**
 * Consistent loading state: centered spinner + optional message.
 * Use for data-fetching states across the app.
 */
export function LoadingView({
  fullPage = true,
  message = "Loading...",
  className,
}: LoadingViewProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 relative z-10",
        fullPage && "min-h-[280px] py-12",
        className
      )}
    >
      <NeonSpinner size="lg" />
      {message && (
        <p className="text-sm text-muted-foreground font-mono">{message}</p>
      )}
    </div>
  );
}
