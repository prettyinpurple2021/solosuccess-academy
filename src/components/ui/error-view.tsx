import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorViewProps {
  /** Error message to show (e.g. error?.message). Falls back to a generic message. */
  message?: string;
  /** Called when user clicks "Try again" (e.g. refetch). If not provided, button is hidden. */
  onRetry?: () => void;
  /** Link for "Go back" (e.g. "/dashboard" or "/courses"). If not provided, uses "/". */
  backTo?: string;
  /** Label for the back link. Default "Go home". */
  backLabel?: string;
  /** Use full viewport height. Default true. */
  fullPage?: boolean;
  /** Optional title override. Default "Something went wrong". */
  title?: string;
  className?: string;
}

/**
 * Consistent error state: card with message, optional retry, and go-back link.
 * Use when a query or mutation fails so users can recover.
 */
export function ErrorView({
  message = "We couldn't load this content. Please try again.",
  onRetry,
  backTo = "/",
  backLabel = "Go home",
  fullPage = true,
  title = "Something went wrong",
  className,
}: ErrorViewProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center relative z-10",
        fullPage && "min-h-[280px] py-12",
        className
      )}
    >
      <Card className="w-full max-w-md glass-card border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" aria-hidden />
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <Button variant="neon" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          )}
          <Button variant="outline" asChild className="gap-2">
            <Link to={backTo}>
              <Home className="h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
