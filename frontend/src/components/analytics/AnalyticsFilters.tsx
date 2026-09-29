import React from "react";
import { TimeRangeOption } from "../../types/analytics.types";
import { Calendar, RefreshCw } from "lucide-react";

interface Props {
  stationId: string;
  onStationChange: (stationId: string) => void;
  timeRange: TimeRangeOption;
  onTimeRangeChange: (timeRange: TimeRangeOption) => void;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AnalyticsFilters: React.FC<Props> = ({
  stationId,
  onStationChange,
  timeRange,
  onTimeRangeChange,
  startDate,
  endDate,
  onCustomDateChange,
  onRefresh,
  isLoading
}) => {
  const timeWindows: { label: string; value: TimeRangeOption }[] = [
    { label: "1 Hour", value: "1h" },
    { label: "6 Hours", value: "6h" },
    { label: "24 Hours", value: "24h" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "Custom", value: "custom" }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Station Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Station Scope:
          </span>
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            {[
              { id: "ALL", label: "All Stations" },
              { id: "MAITRI", label: "Maitri" },
              { id: "BHARATI", label: "Bharati" }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onStationChange(st.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  stationId === st.id
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Range Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Time Window:
          </span>
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            {timeWindows.map((tw) => (
              <button
                key={tw.value}
                type="button"
                onClick={() => onTimeRangeChange(tw.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  timeRange === tw.value
                    ? "bg-slate-800 text-sky-400 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tw.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-all ml-1 disabled:opacity-50"
            title="Refresh operational telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-400" : "text-slate-400"}`} />
            <span>{isLoading ? "Fetching..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Controls */}
      {timeRange === "custom" && onCustomDateChange && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-300">Custom Boundaries (UTC):</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-400">Start:</label>
            <input
              type="datetime-local"
              value={startDate ? startDate.substring(0, 16) : ""}
              onChange={(e) => {
                const val = e.target.value ? new Date(e.target.value).toISOString() : "";
                onCustomDateChange(val, endDate || "");
              }}
              className="bg-slate-950 border border-slate-750 text-slate-200 rounded px-2.5 py-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400">End:</label>
            <input
              type="datetime-local"
              value={endDate ? endDate.substring(0, 16) : ""}
              onChange={(e) => {
                const val = e.target.value ? new Date(e.target.value).toISOString() : "";
                onCustomDateChange(startDate || "", val);
              }}
              className="bg-slate-950 border border-slate-750 text-slate-200 rounded px-2.5 py-1 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
};
