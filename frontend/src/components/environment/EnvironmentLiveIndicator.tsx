/**
 * POLARIS — Environmental Live Telemetry Freshness Indicator
 * Displays connection state, last update latency, and stale warnings.
 */

import React, { useEffect, useState } from "react";
import { AlertTriangle, WifiOff, RefreshCw } from "lucide-react";
import { useStation } from "../../context/StationContext";
import { formatUtcTime } from "../../utils/formatters";

export const EnvironmentLiveIndicator: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { realtimeStatus, lastTelemetryAt, isStale } = useStation();
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  useEffect(() => {
    const updateElapsed = () => {
      if (lastTelemetryAt) {
        const diff = Math.max(0, Math.floor((Date.now() - new Date(lastTelemetryAt).getTime()) / 1000));
        setSecondsAgo(diff);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [lastTelemetryAt]);

  if (realtimeStatus === "OFFLINE") {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-mono text-slate-400 ${className}`}>
        <WifiOff className="h-3.5 w-3.5 text-slate-500" />
        <span>OFFLINE · AWS Weather Station Standby</span>
      </div>
    );
  }

  if (realtimeStatus === "RECONNECTING") {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-400 ${className}`}>
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
        <span>RECONNECTING AWS LINK...</span>
      </div>
    );
  }

  if (isStale || secondsAgo > 20) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 text-xs font-mono text-amber-300 ${className}`}>
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        <span>STALE SENSOR DATA · ({secondsAgo}s lag)</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-xs font-mono text-sky-400 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
      </span>
      <span className="font-semibold tracking-wider">LIVE AWS STREAM</span>
      <span className="text-slate-400 border-l border-slate-700/60 pl-2">
        {secondsAgo === 0 ? "Just now" : `${secondsAgo}s ago`}
      </span>
      {lastTelemetryAt && (
        <span className="text-slate-500 text-[10px] hidden sm:inline">
          ({formatUtcTime(new Date(lastTelemetryAt))})
        </span>
      )}
    </div>
  );
};
