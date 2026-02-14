import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary. Catches React errors in the tree and shows
 * a friendly recovery UI instead of a white screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center cyber-bg">
          <div className="cyber-grid absolute inset-0 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 py-12 text-center max-w-md">
            <div className="rounded-full bg-destructive/20 p-4 ring-4 ring-destructive/30">
              <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold text-foreground">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                We hit an unexpected error. Try reloading the page or going back home.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="neon"
                size="lg"
                onClick={this.handleReload}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload page
              </Button>
              <Button variant="outline" size="lg" asChild className="gap-2">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Go home
                </Link>
              </Button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 w-full text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 overflow-auto rounded-md bg-muted/50 p-3 text-xs text-destructive max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
