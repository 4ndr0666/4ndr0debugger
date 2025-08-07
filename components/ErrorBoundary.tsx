
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="relative group bg-black/70 border border-[var(--red-color)] my-3 text-left p-4">
            <h4 className="font-heading text-sm text-[var(--red-color)]">
                &gt; SYSTEM WARNING: Code Block Rendering Failed
            </h4>
            <p className="text-xs text-red-300/80 font-mono mt-2">
                This component encountered a critical error, likely due to a bug in the syntax highlighting library when processing the generated code. The error has been contained to prevent a full application crash.
            </p>
            <pre className="mt-2 p-2 bg-black/50 text-xs text-red-300/60 overflow-auto">
                {this.state.error?.message}
            </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
