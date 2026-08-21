import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Route-level error boundary. Catches render crashes in a lazy-loaded page so
 * the shell (Layout, nav, toaster) stays up and shows a house-styled fault
 * panel in the routed area instead.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Route crashed:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="schematic-panel p-12 text-center">
          <AlertTriangle size={28} className="mx-auto text-destructive mb-3" />
          <div className="font-display font-bold uppercase tracking-wider">System Fault</div>
          <p className="tech-label mt-1">
            {String(this.state.error?.message || this.state.error || "Unknown error")}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
