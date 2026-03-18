/**
 * @file RouteErrorBoundary.tsx — Per-Route Error Boundary
 * 
 * PURPOSE: Catches rendering errors within individual routes so a crash
 * on one page doesn't break the entire app. Shows an error message with
 * retry option instead of a blank screen.
 */
import React, { Component, ReactNode } from 'react';
import { ErrorView } from '@/components/ui/error-view';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for debugging (would go to Sentry in production)
    console.error('[RouteErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center py-12">
          <ErrorView
            message={this.state.error?.message || 'Something went wrong rendering this page.'}
            onRetry={this.handleRetry}
            backTo="/dashboard"
            backLabel="Back to Dashboard"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
