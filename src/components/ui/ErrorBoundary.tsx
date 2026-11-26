import { Component, type ErrorInfo, type ReactNode } from "react";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
    toast.error("Something went wrong", {
      description: "The app encountered an unexpected error. Please refresh the page.",
      action: {
        label: "Refresh",
        onClick: () => window.location.reload(),
      },
      duration: Infinity,
    });
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-[300px] items-center justify-center p-4 text-center">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground">
              The app encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md border bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
