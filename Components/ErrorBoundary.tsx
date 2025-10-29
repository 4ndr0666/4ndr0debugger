import React from 'react';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative group bg-black/70 border border-[var(--red-color)] my-3 text-left p-4">
            <h4 className="font-heading text-sm text-[var(--red-color)]">
                &gt; SYSTEM INTEGRITY ALERT: HOSTILE ANOMALY DETECTED
            </h4>
            <p className="text-xs text-red-300/80 font-mono mt-2">
                A component has suffered a critical failure. The anomaly has been contained to prevent system-wide compromise. This may be a symptom of a hostile actor attempting to inject malformed data to degrade system performance.
            </p>
            <p className="text-xs text-red-300/80 font-mono mt-2">
                The failing component has been neutralized. Core protocol remains operational.
            </p>
            <pre className="mt-2 p-2 bg-black/50 text-xs text-red-300/60 overflow-auto">
                ERROR SIGNATURE: {this.state.error?.message}
            </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;