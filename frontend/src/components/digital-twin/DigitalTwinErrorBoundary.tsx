import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Layers } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DigitalTwinErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("DIGITAL_TWIN_RENDER_ERROR:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-950/90 text-slate-100 p-8 rounded-xl border border-red-500/30 backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 text-red-400 animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white mb-2">
            DIGITAL TWIN TEMPORARILY UNAVAILABLE
          </h3>

          <p className="text-sm text-slate-400 max-w-md text-center mb-6">
            WebGL 3D graphics context or rendering pipeline encountered an error. 
            Standard telemetry, database services, and dashboard controls remain fully operational.
          </p>

          {this.state.error?.message && (
            <div className="mb-6 px-4 py-2 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono text-red-300 max-w-lg overflow-x-auto">
              {this.state.error.message}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition-colors shadow-lg shadow-cyan-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              Retry 3D Initialization
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors border border-slate-700"
            >
              <Layers className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
