import React, { useState, useEffect } from "react";
import { Radio, RefreshCw, Wifi, ShieldAlert, Cpu } from "lucide-react";
import { useStation } from "../../context/StationContext";
import { formatRelativeTime } from "../../utils/formatters";

export const GlobalStatusBar: React.FC = () => {
  const { stationInfo, kpiSummary } = useStation();
  const [secondsAgo, setSecondsAgo] = useState<number>(12);

  // Periodic heartbeat tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => (prev >= 45 ? 5 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full border-b border-slate-800/60 bg-polar-900/90 px-4 py-2 text-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 gap-x-4">
        {/* Left Side: Station & Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Radio className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-slate-400">STATION:</span>
            <span className="text-white font-bold tracking-wider">{stationInfo.name}</span>
          </div>

          <span className="hidden sm:inline text-slate-700">•</span>

          <div className="flex items-center gap-1.5 font-semibold">
            <span className="text-slate-400">STATUS:</span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {stationInfo.operationalStatus}
            </span>
          </div>

          <span className="hidden sm:inline text-slate-700">•</span>

          {/* Telemetry Simulation Badge */}
          <div className="flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-300">
            <ShieldAlert className="h-3 w-3 shrink-0" />
            <span>SIMULATION DATA</span>
          </div>
        </div>

        {/* Right Side: Timing & Diagnostics */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <RefreshCw className="h-3 w-3 text-slate-400" />
            <span className="text-slate-400">LAST UPDATE:</span>
            <span className="text-slate-200">{formatRelativeTime(secondsAgo)}</span>
          </div>

          <span className="hidden md:inline text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <Wifi className="h-3 w-3 text-emerald-400" />
            <span>DEMO LIVE</span>
          </div>

          <span className="hidden md:inline text-slate-700">•</span>

          <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
            <Cpu className="h-3 w-3 text-sky-400" />
            <span className="text-slate-400">HEALTH:</span>
            <span>{kpiSummary.healthScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
