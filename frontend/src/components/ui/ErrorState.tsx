import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Telemetry Feed Unavailable",
  message = "Unable to synchronize station metrics. Verify network connectivity or satellite downlink link.",
  onRetry,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center rounded-xl border border-red-900/40 bg-red-950/20", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-900/30 text-red-400 mb-3 border border-red-800/50">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-semibold text-red-200">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-red-300/80 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-red-500/20 border border-red-500/40 px-3.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Re-establish Uplink</span>
        </button>
      )}
    </div>
  );
};
