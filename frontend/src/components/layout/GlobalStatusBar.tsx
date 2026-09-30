import React, { useState, useEffect } from "react";
import { Radio, RefreshCw, Cpu, Clock, Sparkles } from "lucide-react";
import { useStation } from "../../context/StationContext";
import { StatusBadge } from "../ui/StatusBadge";

export const GlobalStatusBar: React.FC = () => {
  const { stationInfo, kpiSummary, realtimeStatus, lastTelemetryAt, isStale } = useStation();

  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastTelemetryAt) {
        const diff = Math.max(0, Math.floor((Date.now() - lastTelemetryAt.getTime()) / 1000));
        setSecondsAgo(diff);
      } else {
        setSecondsAgo((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastTelemetryAt]);

  const lastUpdateUtc = lastTelemetryAt
    ? lastTelemetryAt.toISOString().slice(11, 19) + " UTC"
    : "Synchronizing...";

  return (
    <div
      role="region"
      aria-label="Operational Status Bar"
      className="w-full border-b border-polar-750 bg-polar-900/90 px-3 sm:px-6 py-1.5 text-xs backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 gap-x-4">
        {/* Left Side: Station & Status */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Radio className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-slate-400 text-[10px] font-mono">BASE:</span>
            <span className="text-white font-bold tracking-wider text-xs">{stationInfo.name}</span>
          </div>

          <span className="hidden sm:inline text-polar-700" aria-hidden="true">•</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px] font-mono">STATUS:</span>
            <StatusBadge status={stationInfo.operationalStatus} size="sm" />
          </div>

          <span className="hidden md:inline text-polar-700" aria-hidden="true">•</span>

          {/* Telemetry Simulation Badge */}
          <div className="flex items-center gap-1 rounded-full bg-polar-850 border border-polar-700 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-slate-300">
            <Sparkles className="h-3 w-3 shrink-0 text-orange-400" />
            <span>STREAM SYNCHRONIZED</span>
          </div>
        </div>

        {/* Right Side: Data Freshness & Diagnostics */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-[11px]">
          {/* Real-time WebSocket connection state */}
          <div className="flex items-center gap-1.5">
            {realtimeStatus === "LIVE" && !isStale ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>LIVE ({secondsAgo}s ago)</span>
              </span>
            ) : isStale ? (
              <span className="flex items-center gap-1 text-amber-400 font-bold" title={`Last updated: ${lastUpdateUtc}`}>
                <Clock className="h-3 w-3 text-amber-400" />
                <span>STALE ({lastUpdateUtc})</span>
              </span>
            ) : realtimeStatus === "RECONNECTING" ? (
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <RefreshCw className="h-3 w-3 text-amber-400 animate-spin" />
                <span>RECONNECTING</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span>OFFLINE</span>
              </span>
            )}
          </div>

          <span className="hidden sm:inline text-polar-700" aria-hidden="true">•</span>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <RefreshCw className="h-3 w-3 text-slate-500" />
            <span className="text-slate-400 text-[10px]">SYNC:</span>
            <span className="text-slate-200">{lastUpdateUtc}</span>
          </div>

          <span className="hidden md:inline text-polar-700" aria-hidden="true">•</span>

          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[10px]">FLEET HEALTH:</span>
            <span className="tabular-nums">{kpiSummary.healthScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
