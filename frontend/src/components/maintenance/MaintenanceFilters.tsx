import React from "react";
import { PredictionFilterState } from "../../types/maintenance.types";
import { Search, RotateCw, Radio } from "lucide-react";

interface Props {
  filters: PredictionFilterState;
  onFilterChange: (filters: Partial<PredictionFilterState>) => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  telemetryStatus: "LIVE" | "CALCULATING" | "STALE" | "OFFLINE";
}

export const MaintenanceFilters: React.FC<Props> = ({
  filters,
  onFilterChange,
  onRefreshAll,
  isRefreshing,
  telemetryStatus
}) => {
  const statusStyles = {
    LIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    CALCULATING: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse",
    STALE: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    OFFLINE: "bg-slate-800 text-slate-400 border-slate-700"
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
      {/* Left: Station & Risk Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Station Segmented Control */}
        <div className="inline-flex p-0.5 rounded-lg bg-slate-950 border border-slate-800" role="group" aria-label="Station Selection">
          {(["ALL", "MAITRI", "BHARATI"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onFilterChange({ stationId: st, page: 1 })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filters.stationId === st
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {st === "ALL" ? "All Stations" : st === "MAITRI" ? "Maitri Station" : "Bharati Station"}
            </button>
          ))}
        </div>

        {/* Risk Band Select */}
        <div className="relative">
          <select
            value={filters.riskBand}
            onChange={(e) => onFilterChange({ riskBand: e.target.value, page: 1 })}
            aria-label="Filter by Risk Band"
            className="appearance-none bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            <option value="ALL">All Risk Bands</option>
            <option value="CRITICAL">⚠ Critical Risk (80-100%)</option>
            <option value="HIGH">▲ High Risk (60-79%)</option>
            <option value="MODERATE">■ Moderate Risk (40-59%)</option>
            <option value="GUARDED">◆ Guarded (20-39%)</option>
            <option value="LOW">● Low Risk (0-19%)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search equipment tag, name..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            aria-label="Search equipment"
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
      </div>

      {/* Right: Live Status Badge & Refresh Button */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Telemetry Staleness Indicator */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold tracking-wider ${
            statusStyles[telemetryStatus]
          }`}
          title={`Inference status: ${telemetryStatus}`}
        >
          <Radio className={`w-3 h-3 ${telemetryStatus === "LIVE" ? "animate-pulse" : ""}`} />
          <span>{telemetryStatus}</span>
        </div>

        {/* Refresh AI Inference Button */}
        <button
          type="button"
          onClick={onRefreshAll}
          disabled={isRefreshing}
          aria-label="Refresh predictive analysis"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 transition-all hover:border-slate-600 disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          <span>{isRefreshing ? "Calculating..." : "Refresh"}</span>
        </button>
      </div>
    </div>
  );
};
